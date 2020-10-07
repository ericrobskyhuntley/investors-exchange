import * as d3 from "d3";
import {geoNicolosi} from "d3-geo-projection";
import * as color from "./colors.js";

const width = 400;
const height = 400;
const padding = 60;

// const graticule = d3.geoGraticule10();
const sphere = ({type: "Sphere"});

const eHemiProj = geoNicolosi()
    .rotate([110, 0, 180])
    .clipAngle(90)
    .precision(.1)
    .fitExtent([[0, 0], [width - padding, height - padding]], sphere)
    .translate([width/2, height/2]);

const wHemiProj = geoNicolosi()
    .rotate([-70, 0, 180])
    .clipAngle(90)
    .precision(.1)
    .fitExtent([[0, 0], [width - padding, height - padding]], sphere)
    .translate([width/2, height/2]);

const drawFeatures = (data, path, context, proj) => {
    context.clearRect(0,0,width,height);
    context.beginPath(), path(sphere), context.fillStyle = color.baseBG, context.shadowBlur = 25, context.shadowColor = color.baseBG, context.fill();
    const r = proj.rotate();
    proj.reflectX(true).rotate([r[0] + 180, -r[1], -r[2]]);
    // Land ('Dark Side')
    context.beginPath(), path(data), context.fillStyle = color.highlightBG, context.shadowBlur = 10, context.shadowColor = color.highlightBG, context.fill();
    // Reflect the Earth
    proj.reflectX(false).rotate(r);
    // Land (Foreground)
    context.beginPath(), path(data), context.fillStyle = color.highlight, context.shadowBlur = 10, context.shadowColor = color.highlight, context.fill();
    // Graticule
    // context.beginPath(), path(graticule), context.lineWidth = 0.5, context.strokeStyle = color.mapBase, context.shadowBlur = 0, context.stroke();
    context.beginPath(), path(sphere), context.lineWidth = 2, context.strokeStyle = color.base, context.shadowBlur = 8, context.shadowColor = color.base, context.stroke();
}

d3.json("http://127.0.0.1:3000/countries/").then(function(d){
    console.log(d);
    const drawHemi = (hemiId, p) => {
        const div = d3.select('#'+hemiId)
            .append('canvas')
            .attr('id', hemiId+'Canvas')
            .attr('width', width)
            .attr('height', height);
        const hemi = document.getElementById(hemiId+'Canvas');
        const context = hemi.getContext("2d");
        const path = d3.geoPath(p, context);
        drawFeatures(d, path, context, p);
    }
    drawHemi("eHemi", eHemiProj);
    drawHemi("wHemi", wHemiProj);
});