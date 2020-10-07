import 'ol/ol.css';
import { Map, View } from 'ol';
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
const rotate = 15.816 + 90;
const center = [-79.384353, 43.641923];
const cutWidth = 0.3;
const cutHeight = 0.25;
const initZoom = 19;
import * as color from "./colors.js";

const highlightStyle = new Style({
    fill: new Fill({
      color: color.highlightBG,
    }),
    stroke: new Stroke({
      color: color.highlight,
      width: 2,
    })
});

const boothStyle = new Style({
    fill: new Fill({
      color: color.baseBG,
    }),
    stroke: new Stroke({
      color: color.base,
      width: 1,
    })
});

const base = new TileLayer({
    source: new XYZ({
        url: 'http://127.0.0.1:3000/urb_tiles/{z}/{x}/{-y}.png',
        layername: 'basemap'
    })
});


const osm = new TileLayer({
    source: new OSM()
});

const booths = new VectorLayer({
    className: 'booths',
    source: new VectorSource({
        url:'http://127.0.0.1:3000/booths/',
        format: new GeoJSON(),
    }),
    style: boothStyle
});

const map = new Map({
    target: 'map',
    layers: [
        base, osm, booths
    ],
    view: new View({
        center: fromLonLat(center),
        zoom: initZoom,
        rotation: rotate * (Math.PI / 180)
    })
});

function clip(event) {
    let ctx = event.context;
    let w = ctx.canvas.width * cutWidth;
    let h = ctx.canvas.height * cutHeight;
    // calculate the pixel ratio and rotation of the canvas
    let matrix = event.inversePixelTransform;
    let canvasRotation = -Math.atan2(matrix[1], matrix[0]);
    ctx.save();

    // center the canvas and remove rotation to position clipping
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(-canvasRotation);

    ctx.translate(-w/2, -h/2);
    ctx.beginPath();
    ctx.rect(0, 0, w, h)
    ctx.clip();
    ctx.translate(w/2, h/2);

    // reapply canvas rotation and position
    ctx.rotate(canvasRotation);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    return ctx
}

osm.on('prerender', function (e) {
    clip(e);
});

booths.on('prerender', function (e) {
    clip(e);
});

osm.on('postrender', function (e) {
    let ctx = e.context;
    ctx.restore();
});

booths.on('postrender', function (e) {
    let ctx = e.context;
    ctx.restore();
});

let hovered = null;
let selected = null;
let video = document.getElementsByTagName("video")[0];
let videoSource = document.getElementsByTagName("source");

map.on('pointermove', function(e) {
    if (hovered !== null) {
        hovered.setStyle(undefined);
        hovered = null;
    }

    map.forEachFeatureAtPixel(e.pixel, function(f) {
        hovered = f;
        f.setStyle(highlightStyle);
        return true;
    }, {
        layerFilter: function(a) {
            return(a == booths)
        }
    })
})

map.on('click', function(e) {
    if (selected !== null) {
        selected.setStyle(undefined);
        selected = null;
    }
    map.forEachFeatureAtPixel(e.pixel, function(f) {
        selected = f;
        let boothNum = selected.getProperties().booth_no;
        let url = 'http://127.0.0.1:3000/video/bw/';
        videoSource[0].src = url + boothNum + '.mp4';;
        video.load();
        video.play();
        return true;
    }, {
        layerFilter: function(a) {
            return(a == booths)
        }
    })

})