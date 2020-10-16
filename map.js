import 'ol/ol.css';
import { Map, Overlay, View } from 'ol';
import { transformExtent } from 'ol/proj';
import { Attribution } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { toStringHDMS } from 'ol/coordinate';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';

import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

import { highlight, highlightBG, base, baseBG, mapRotation, shadowOffset } from "./constants.js";
import * as world from "./world.js";
import * as vid from "./video.js";

vid.colorize();

const shadowBoxes = document.getElementsByClassName('shadow');
for (var i = 0; i < shadowBoxes.length; i++) {
    let shadowStyle = "box-shadow: " + shadowOffset + "px -" + shadowOffset + "px 0px " + highlight;
    shadowBoxes[i].style = shadowStyle;
}

const center = [-79.384353, 43.641923];
const mapExtent = [-79.3866460768208526, 43.6400473344762645, -79.3822610655956566, 43.6442472623937832];
const initZoom = 19;
const width = 450;
const height = 700;

const selectedStyle = new Style({
    fill: new Fill({
        color: base
    }),
    stroke: new Stroke({
        color: base,
        width: 2,
    })
});

const highlightStyle = new Style({
    fill: new Fill({
        color: highlight
    }),
    stroke: new Stroke({
        color: base,
        width: 2,
    })
});

const boothStyle = new Style({
    fill: new Fill({
        color: highlightBG
    }),
    stroke: new Stroke({
        color: highlight,
        width: 1.5,
    })
});

const cityscape = new TileLayer({
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
        cityscape,
        boothShadow,
        boothBase,
        booths
    ],
    view: new View({
        center: fromLonLat(center),
        zoom: initZoom,
        rotation: mapRotation * (Math.PI / 180),
        minZoom: 18,
        maxZoom: 21,
    }),
    controls: [
        new Attribution()
    ]
});

map.setView(new View({
    center: map.getView().getCenter(),
    zoom: map.getView().getZoom(),
    rotation: map.getView().getRotation(),
    minZoom: map.getView().getMinZoom(),
    maxZoom: map.getView().getMaxZoom(),
    extent: transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857')
}));

function clip(event, offset) {
    let ctx = event.context;
    let w = width;
    let h = height;
    // calculate the pixel ratio and rotation of the canvas
    let matrix = event.inversePixelTransform;
    let canvasRotation = -Math.atan2(matrix[1], matrix[0]);
    ctx.save();

    // center the canvas and remove rotation to position clipping
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(-canvasRotation);

    ctx.translate(-w / 2, -h / 2);
    ctx.beginPath();
    ctx.rect(0 + offset, 0 - offset, w + offset, h - offset)
    ctx.clip();
    ctx.translate(w / 2, h / 2);

    // reapply canvas rotation and position
    ctx.rotate(canvasRotation);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 2;
    ctx.stroke();
    return ctx
}

boothBase.on('prerender', function (e) {
    clip(e, 0);
});


boothShadow.on('prerender', function (e) {
    clip(e, shadowOffset);
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

let popup = document.getElementById('popup')
let info = document.getElementById('info-box')

map.on('pointermove', function (e) {
    if (hovered !== null) {
        hovered.setStyle(undefined);
        hovered = null;
    }

    map.forEachFeatureAtPixel(e.pixel, function (f) {
        popup.style.visibility = "visible";
        hovered = f;
        if (hovered) {
            hovered.setStyle(highlightStyle);
            let boothNum = hovered.getProperties().booth_no;
            let exName = hovered.getProperties().exhibitor;
            world.boothHover(boothNum, exName);
            let left = e.originalEvent.x;
            let top = e.originalEvent.y - shadowOffset;
            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
            popup.style.backgroundColor = base;
            let content = '<code>Booth #' + boothNum + '</code><hr style="border: 0.1px solid ' + highlight + '"><h3>' + exName + "</h3>";
            popup.innerHTML = content;
        }
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
        console.log(selected.getProperties());
        if (selected) {
            selected.setStyle(selectedStyle);
            let p = selected.getProperties();
            let boothNum = p.booth_no;
            let exName = p.exhibitor;
            let countries = p.countries;
            let add = p.add;
            let web = p.website;

            // Trigger world map change on click.
            world.boothSelect(boothNum, exName, countries);

            // Show info box on click.
            info.style.visibility = "visible";
            info.style.backgroundColor = base;
            let content = "<code>Booth #" + boothNum + "</code>" 
                + "<h3>" + exName + "</h3><ul class='no-bullets'>" 
                + "<li>" + add + "</li>" 
                + "<li>Exploring sites in <code><u>" + String(countries).replace(/,/g, '</u></code>, <code><u>') + "</u></code></li>" 
                + "<li><code><a href='" + web + "'>" + web + "</a></code></li></ul>"
            // let content = '<code>Booth #' + boothNum + '</code><hr style="border: 0.1px solid ' + highlight + '">' + exName;
            info.innerHTML = content;

            // Change video source on click.
            let url = 'http://127.0.0.1:3000/video/bw/';
            vid.changeSource(url + boothNum + '.mp4');

            // Remove popup on click.
            popup.style.visibility = "hidden";
        }
        return true;
    }, {
        layerFilter: function (a) {
            return (a == booths)
        }
    })

})

map.getViewport().addEventListener('mouseout', function (e) {
    popup.style.visibility = "hidden";
}, {
    layerFilter: function (a) {
        return (a == booths)
    }
});