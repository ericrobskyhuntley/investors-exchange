import * as d3 from "d3";
import { symbol, square } from "d3-shape";
import { geoNicolosi } from "d3-geo-projection";
import { geoAirocean } from "d3-geo-polygon";
const slug = require("slug");
import { highlight, highlightBG, base, baseBG, offAxis, mapRotation, shadowOffset } from "./constants.js";
import { select } from "d3";

const pad = 30;

// const context = DOM.context2d(width, height);
let box = document.querySelector('body');
let w = box.offsetWidth / 4;
let h = box.offsetHeight;
const graticule = d3.geoGraticule10();
const sphere = ({ type: "Sphere" });
const symbolSize = 300;

const selectTime = 750;

let boothSelect = function (boothNum, exName, countries) {
    let nameSlug = slug(exName);
    let countriesAgg = countries.map(i => '#' + slug(String(i))).join(', ');
    console.log(countriesAgg);
    d3.selectAll(".exhibitor")
        .classed("clicked", false)
        .transition()
        .duration(selectTime)
        .style("opacity", 0);
    d3.selectAll("#" + nameSlug)
        .transition()
        .duration(selectTime)
        .style("opacity", 1);
    d3.selectAll(".hq-c")
        .transition()
        .duration(selectTime)
        .style("opacity", 0);
    d3.selectAll("#hq-c-" + boothNum)
        .transition()
        .duration(selectTime)
        .attr("stroke-width", 1)
        .style("opacity", 1);
    d3.selectAll(".country")
        .transition()
        .duration(selectTime)
        .attr("fill", highlightBG);
    d3.selectAll(countriesAgg)
        .transition()
        .duration(selectTime)
        .attr("fill", highlight);
    d3.selectAll('#' + slug(exName))
        .classed("clicked", true)
        .transition()
        .duration(50)
        .attr("stroke", base)
        .attr("fill", highlight)
        .style("opacity", 1);
};

let boothHover = function (boothNum, exName) {
    d3.selectAll(".booth-hq")
        .transition()
        .duration(50)
        .style("opacity", 0);
    d3.selectAll("#booth-hq-" + boothNum)
        .transition()
        .duration(50)
        .attr("stroke-width", 1)
        .style("opacity", 1);

    d3.selectAll('.exhibitor')
        .classed("hovered", false)
        .transition()
        .duration(50);
    d3.selectAll(".exhibitor")
        .filter(function () {
            return !this.classList.contains('clicked');
        })
        .transition()
        .duration(50)
        .style("opacity", 0);
    d3.select('#' + slug(exName))
        .classed("hovered", true)
        .transition()
        .duration(50)
        .attr("stroke-width", 1)
        .style("opacity", 1);
};

const drawHemi = (c, ex, exc, hqC, hemi) => {
    let rotate = [];
    let proj = null;
    let divID = null;
    let r = null;
    if (hemi == "e") {
        rotate = [-70, 0, 180];
    } else if (hemi == "w") {
        rotate = [110, 0, 180];
    } else if (hemi == "b") {
        divID = "#fuller"
        proj = geoAirocean()
            .translate([w / 2, h / 2]);
        let angle = proj.angle();
        proj.angle(angle + 90);
        proj.fitExtent([[pad, pad], [w - pad, h - pad]], sphere);
    }
    if (hemi == "e" | hemi == "w") {
        divID = "#" + hemi + "Hemi";
        proj = geoNicolosi()
            .rotate(rotate)
            .clipAngle(90)
            .precision(.1)
            .fitExtent([[pad, pad], [w - pad, h - pad]], sphere)
            .translate([w / 2, h / 2]);
    }
    const cross = symbol().type(d3.symbolCross).size(symbolSize);
    const triangle = symbol().type(d3.symbolTriangle).size(symbolSize / 3);
    const circle = symbol().type(d3.symbolCircle).size(symbolSize / 4);

    const path = d3.geoPath()
        .projection(proj);

    const svg = d3.select(divID)
        .append('svg')
        .attr('width', w)
        .attr('height', h);

    let filter = svg.append("defs")
        .append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "130%");

    filter.append("feDropShadow")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 0)
        .attr("flood-color", highlight)
        .attr("flood-opacity", highlight)
        .attr("dx", shadowOffset)
        .attr("dy", -shadowOffset)
        .attr("result", "blur");

    let feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "feDropShadow")
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    svg.append("path")
        .attr("id", function (d) {
            return "globe-view"
        })
        .attr("class", function (d) {
            return "globe-back"
        })
        .attr("d", path(sphere))
        .attr("fill", base)
        .style("filter", "url(#drop-shadow)");
    if (hemi == "e" | hemi == "w") {
        r = proj.rotate();
        proj.reflectX(true).rotate([r[0] + 180, -r[1], -r[2]]);
    }
    // 'Dark Side' Countries
    if (hemi == "e" | hemi == "w") {
        svg.append("path")
            .attr("d", path(c))
            // .attr("class", function(d) { return + d.country})
            .attr("fill", highlightBG);
        proj.reflectX(false).rotate(r);
    }
    // Countries
    svg.append("g")
        .attr("id", "countries")
        .selectAll("path")
        .data(c.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("id", function (d) {
            return slug(d.properties.country_long);
        })
        .attr("class", function (d) {
            return "country";
        })
        .attr("fill", highlightBG)
        .attr("stroke", "none")
        .attr("stroke-width", 0);

    // Graticule
    svg.append("path")
        .attr("d", path(graticule))
        .attr("stroke-width", 0.25)
        .attr("stroke", highlight)
        .attr("fill", "none");

    // Booth-to-HQ
    svg.append("g")
        .attr("id", function (d) {
            return "booth-to-hq"
        })
        .selectAll("path")
        .data(exc.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", function (d) {
            return "booth-hq";
        })
        .attr("id", function (d) {
            return "booth-hq-" + d.properties.booth_no;
        })
        .attr("fill", "none")
        .attr("stroke", base)
        .attr("stroke-width", 0.1)
        .attr("opacity", 0);

    // HQ-to-Country
    svg.append("g")
        .attr("id", "hq-to-countries")
        .selectAll("path")
        .data(hqC.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("id", function (d) {
            return "hq-c-" + d.properties.booth_no;
        })
        .attr("class", function (d) {
            return "hq-c";
        })
        .attr("fill", "none")
        .attr("stroke", highlight)
        .attr("stroke-width", 0.2)
        .style("opacity", 0);

    svg.append("path")
        .attr("d", circle)
        .attr("transform", function () {
            return "translate(" + proj([-79.384676, 43.642470]) + ")";
        })
        .attr("class", function (d) {
            return "locator";
        })
        .attr("fill", highlight)
        .attr("stroke", base)
        .attr("stroke-width", 2)
        .attr("opacity", 1);

    svg.append("path")
        .attr("d", triangle)
        .attr("transform", function () {
            let coords = proj([-79.384676, 43.642470]);
            coords.splice(0, 2, [coords[0] - 8, coords[1] + 8])
            return "translate(" + coords + ") rotate(" + -mapRotation + ")";
        })
        .attr("class", function (d) {
            return "locator";
        })
        .attr("fill", highlight)
        .attr("stroke", base)
        .attr("stroke-width", 2)
        .attr("opacity", 1);


    // Exhibitor locations
    svg.append("g")
        .attr("id", function () {
            return "exhibitors"
        })
        .selectAll("path")
        .data(ex.features)
        .enter()
        .append("path")
        .attr("d", cross)
        .attr("transform", function (d) {
            if (d.geometry.coordinates) {
                return "translate(" + proj(d.geometry.coordinates) + ")";
            }
        })
        .attr("class", function (d) {
            return "exhibitor";
        })
        .attr("id", function (d) {
            return slug(d.properties.name);
        })
        .attr("fill", base)
        .attr("stroke", highlight)
        .attr("stroke-width", 2)
        .attr("opacity", 0);
    //Sphere
    svg.append("path")
        .attr("d", path(sphere))
        .attr("stroke-width", 1)
        .attr("stroke", highlight)
        .attr("fill", "none");

}

const d3Draw = () => {
    let endpoints = ['http://127.0.0.1:3000/countries/',
        'http://127.0.0.1:3000/exhibitors/',
        'http://127.0.0.1:3000/exhibitorHQ/',
        'http://127.0.0.1:3000/HQCountry/'];
    let promises = [];
    endpoints.forEach(function (url) {
        promises.push(d3.json(url));
    });

    Promise.all(promises).then(function (data) {
        let countries = data[0];
        let exhibitors = data[1];
        let exhibitorHQ = data[2];
        let hqCountry = data[3];
        // drawHemi(countries, exhibitors, "e");
        // drawHemi(countries, exhibitors, "w");
        drawHemi(countries, exhibitors, exhibitorHQ, hqCountry, "b")
    });
}

d3Draw();

module.exports = {
    boothSelect,
    boothHover
}