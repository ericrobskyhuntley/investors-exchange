import 'ol/ol.css';
import { Map, View } from 'ol';
import { Attribution } from 'ol/control';
import MapboxVector from 'ol/layer/MapboxVector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';


import Select from 'ol/interaction/Select';
import {altKeyOnly, click, pointerMove} from 'ol/events/condition';

import * as color from "./colors.js";
import * as world from "./hemis.js";
import * as vid from "./video.js";

vid.colorize();

const rotate = 15.816 + 90;
const center = [-79.384353, 43.641923];
const cutWidth = 0.3;
const cutHeight = 0.2;
const initZoom = 19;


const highlightStyle = new Style({
    fill: new Fill({
        color: color.highlight
    }),
    stroke: new Stroke({
        color: color.highlight,
        width: 2,
    })
});

const boothStyle = new Style({
    fill: new Fill({
        color: color.highlightBG
    }),
    stroke: new Stroke({
        color: color.highlight,
        width: 1.5,
    })
});

const base = new TileLayer({
    source: new XYZ({
        url: 'http://127.0.0.1:3000/base/{z}/{x}/{-y}.png',
        layername: 'basemap'
    })
});


const boothBase = new TileLayer({
    source: new XYZ({
        url: 'http://127.0.0.1:3000/booths_gp_bg/{z}/{x}/{-y}.png',
        layername: 'boothsBase'
    })
});

const boothShadow = new TileLayer({
    source: new XYZ({
        url: 'http://127.0.0.1:3000/booths_pg_bg/{z}/{x}/{-y}.png',
        layername: 'boothsBase'
    })
});

const booths = new VectorLayer({
    className: 'booths',
    source: new VectorSource({
        url: 'http://127.0.0.1:3000/booths/',
        format: new GeoJSON(),
    }),
    style: boothStyle
});

const map = new Map({
    target: 'map',
    layers: [
        base, 
        boothShadow, 
        boothBase, 
        booths
    ],
    view: new View({
        center: fromLonLat(center),
        zoom: initZoom - 1,
        rotation: rotate * (Math.PI / 180),
        minZoom: 19,
        maxZoom: 21,
    }),
    controls: [
        new Attribution()
    ]
});

map.setView(new View({
    center: map.getView().getCenter(),
    zoom: map.getView().getZoom() + 1,
    rotation: map.getView().getRotation(),
    minZoom: map.getView().getMinZoom(),
    maxZoom: map.getView().getMaxZoom(),
    extent: map.getView().calculateExtent(map.getSize())
}))

function clip(event, offset) {
    let ctx = event.context;
    let w = 600;
    let h = 600;
    // calculate the pixel ratio and rotation of the canvas
    let matrix = event.inversePixelTransform;
    let canvasRotation = -Math.atan2(matrix[1], matrix[0]);
    ctx.save();

    // center the canvas and remove rotation to position clipping
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(-canvasRotation);

    ctx.translate(-w / 2, -h / 2);
    ctx.beginPath();
    ctx.rect(0+offset, 0-offset, w+offset, h-offset)
    ctx.clip();
    ctx.translate(w / 2, h / 2);

    // reapply canvas rotation and position
    ctx.rotate(canvasRotation);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    return ctx
}

boothBase.on('prerender', function (e) {
    clip(e, 0);
});


boothShadow.on('prerender', function (e) {
    clip(e, 15);
});

booths.on('prerender', function (e) {
    clip(e, 0);
});

boothBase.on('postrender', function (e) {
    let ctx = e.context;
    ctx.restore();
});

boothShadow.on('postrender', function (e) {
    let ctx = e.context;
    ctx.restore();
});

booths.on('postrender', function (e) {
    let ctx = e.context;
    ctx.restore();
});

let hovered = null;
let selected = null;

map.on('pointermove', function (e) {
    if (hovered !== null) {
        hovered.setStyle(undefined);

        hovered = null;
        world.boothReset();
    }

    map.forEachFeatureAtPixel(e.pixel, function (f) {
        hovered = f;
        // console.log(hovered.getProperties());
        f.setStyle(highlightStyle);
        let boothNum = hovered.getProperties().booth_no;
        world.exhibitSelect(boothNum, exName, countries);
        return true;
    }, {
        layerFilter: function (a) {
            return (a == booths)
        }
    })
})

map.on('click', function (e) {
    if (selected !== null) {
        selected.setStyle(undefined);
        selected = null;
    }
    map.forEachFeatureAtPixel(e.pixel, function (f) {
        selected = f;
        let boothNum = selected.getProperties().booth_no;
        let exName = selected.getProperties().exhibitor;
        let countries = selected.getProperties().countries;
        world.boothSelect(boothNum, exName, countries);
        let url = 'http://127.0.0.1:3000/video/bw/';
        vid.changeSource(url + boothNum + '.mp4');

        return true;
    }, {
        layerFilter: function (a) {
            return (a == booths)
        }
    })

})