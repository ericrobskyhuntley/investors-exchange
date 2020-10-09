import * as d3 from "d3";
import { svg } from "d3";
import {geoNicolosi} from "d3-geo-projection";
import { none } from "ol/centerconstraint";
import * as color from "./colors.js";

const width = 400;
const height = 400;
const padding = 60;

const graticule = d3.geoGraticule10();
const sphere = ({type: "Sphere"});

const wHemiProj = geoNicolosi()
    .rotate([110, 0, 180])
    .clipAngle(90)
    .precision(.1)
    .fitExtent([[0, 0], [width - padding, height - padding]], sphere)
    .translate([width/2, height/2]);

const eHemiProj = geoNicolosi()
    .rotate([-70, 0, 180])
    .clipAngle(90)
    .precision(.1)
    .fitExtent([[0, 0], [width - padding, height - padding]], sphere)
    .translate([width/2, height/2]);

const ePath = d3.geoPath().projection(eHemiProj)
const wPath = d3.geoPath().projection(wHemiProj)

const div = d3.select('#eHemi')
    .append('svg')
    .attr('id', 'eHemiSVG')
    .attr('width', width)
    .attr('height', height);

const drawGlobe = () => {
    let endpoints = ['http://127.0.0.1:3000/countries/', 'http://127.0.0.1:3000/exhibitors/'];
    let promises = [];

    endpoints.forEach(function(url) {
        promises.push(d3.json(url));
    });

    Promise.all(promises).then(function(data){
        let countries = data[0];
        let exhibitors = data[1];
        const r = eHemiProj.rotate();
        eHemiProj.reflectX(true).rotate([r[0] + 180, -r[1], -r[2]]);
        // Sphere
        div.append("path")
            .attr("d", ePath(sphere))
            .attr("stroke-width", 3)
            .attr("stroke", color.highlight)
            .attr("fill", color.baseBG);
        // 'Dark Side' Countries
        div.append("path")
            .attr("d", ePath(countries))
            .attr("fill", color.highlightBG);
        eHemiProj.reflectX(false).rotate(r);
        // Countries
        div.append("path")
            .attr("d", ePath(countries))
            .attr("fill", color.highlight);
        // Graticule
        div.append("path")
            .attr("d", ePath(graticule))
            .attr("stroke-width", 1)
            .attr("stroke", color.highlight)
            .attr("fill", "none");
    });
}

drawGlobe();