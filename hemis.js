import * as d3 from "d3";
import { svg } from "d3";
import { geoNicolosi } from "d3-geo-projection";
import { geoAirocean } from "d3-geo-polygon";
import { none } from "ol/centerconstraint";
import * as color from "./colors.js";

const pad = 30;

// const context = DOM.context2d(width, height);
let box = document.querySelector('body');
let w = box.offsetWidth / 4;
let h = box.offsetHeight;
console.log(w, h);
const graticule = d3.geoGraticule10();
const sphere = ({ type: "Sphere" });

const drawHemi = (c, ex, hemi) => {
    let rotate = [];
    let proj = null;
    let divID = null;
    let r = null;
    if (hemi == "e") {
        rotate = [-70, 0, 180];
    } else if (hemi == "w") {
        rotate = [110, 0, 180];
    } else if (hemi =="b") {
        divID = "#fuller"
        proj = geoAirocean()
            .translate([w/2, h/2]);
        let angle = proj.angle();
        proj.angle(angle+90);
        proj.fitExtent([[pad, pad], [w - pad, h - pad]], sphere);  
    }
    if (hemi=="e" | hemi=="w") {
        divID = "#" + hemi + "Hemi";
        proj = geoNicolosi()
            .rotate(rotate)
            .clipAngle(90)
            .precision(.1)
            .fitExtent([[0, 0], [w - pad, h - pad]], sphere)
            .translate([w/2, h/2]);
    }
    const path = d3.geoPath()
        .projection(proj)
        .pointRadius(2);
    const svg = d3.select(divID)
        .append('svg')
        .attr('width', w)
        .attr('height', h);
    // Background
    svg.append("path")
        .attr("d", path(sphere))
        .attr("stroke", "none")
        .attr("fill", color.baseBG);
    if (hemi=="e" | hemi=="w") {
        r = proj.rotate();
        proj.reflectX(true).rotate([r[0] + 180, -r[1], -r[2]]);
    }
    // 'Dark Side' Countries
    if (hemi=="e" | hemi=="w") {
        svg.append("path")
            .attr("d", path(c))
            // .attr("class", function(d) { return + d.country})
            .attr("fill", color.highlightBG);
        proj.reflectX(false).rotate(r);
    }
    // Countries
    svg.append("path")
        // .data(c)
        // .enter().append("path")
        .attr("d", path(c))
        .attr("fill", color.highlight);
    // Graticule
    svg.append("path")
        .attr("d", path(graticule))
        .attr("stroke-width", 0.25)
        .attr("stroke", color.base)
        .attr("fill", "none");
    // Exhibitor locations
    svg.append("path")
        .attr("d", path(ex))
        .attr("fill", color.base)
        .attr("stroke", "none");
    // Sphere
    svg.append("path")
        .attr("d", path(sphere))
        .attr("stroke-width", 2)
        .attr("stroke", color.highlight)
        .attr("fill", "none");
}

const d3Draw = () => {
    let endpoints = ['http://127.0.0.1:3000/countries/',
        'http://127.0.0.1:3000/exhibitors/'];
    let promises = [];

    endpoints.forEach(function (url) {
        promises.push(d3.json(url));
    });

    Promise.all(promises).then(function (data) {
        let countries = data[0];
        // country and country_long
        // console.log(countries);
        let exhibitors = data[1];
        // drawHemi(countries, exhibitors, "e");
        // drawHemi(countries, exhibitors, "w");
        drawHemi(countries, exhibitors, "b")
    });
}

d3Draw();