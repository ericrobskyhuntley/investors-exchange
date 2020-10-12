import * as d3 from "d3";
import { geoNicolosi } from "d3-geo-projection";
import { geoAirocean } from "d3-geo-polygon";
const slug = require("slug");
import * as color from "./colors.js";

const pad = 30;

// const context = DOM.context2d(width, height);
let box = document.querySelector('body');
let w = box.offsetWidth / 4;
let h = box.offsetHeight;
const graticule = d3.geoGraticule10();
const sphere = ({ type: "Sphere" });

let mouseOver = function (d) {
    d3.selectAll(".country")
        .transition()
        .duration(50)
        .style("opacity", 0.5);
    d3.select(this)
        .transition()
        .duration(50)
        .style("opacity", 1);
}

let mouseLeave = function (d) {
    d3.selectAll(".country")
        .transition()
        .duration(50)
        .style("opacity", 1);
}

let boothSelect = function (boothNum, exName, countries) {
    let nameSlug = slug(exName);
    let countriesAgg = countries.map(i => '#' + slug(String(i))).join(', ');
    d3.selectAll(".booth-hq")
        .transition()
        .duration(50)
        .style("opacity", 0);
    d3.selectAll("#booth-hq-" + boothNum)
        .transition()
        .duration(50)
        .attr("stroke-width", 1)
        .style("opacity", 1);
    d3.selectAll(".exhibitor")
        .transition()
        .duration(50)
        .style("opacity", 0);
    d3.selectAll("#" + nameSlug)
        .transition()
        .duration(50)
        .style("opacity", 1);
    d3.selectAll("#hq-c-" + boothNum)
        .transition()
        .duration(50)
        .attr("stroke-width", 1)
        .style("opacity", 1);
    d3.selectAll(".country")
        .transition()
        .duration(50)
        .style("opacity", 0.5);
    d3.selectAll(countriesAgg)
        .transition()
        .duration(50)
        .style("opacity", 1);
}

let boothReset = function () {
    d3.selectAll(".booth-hq")
        .transition()
        .duration(50)
        .style("opacity", 1)
        .attr("stroke-width", 0.5);
    d3.selectAll(".exhibitor")
        .transition()
        .duration(50)
        .style("opacity", 1);
    d3.selectAll(".hq-c")
        .transition()
        .duration(50)
        .style("opacity", 0);
    d3.selectAll(".country")
        .transition()
        .duration(50)
        .style("opacity", 1);
}

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
    const path = d3.geoPath()
        .projection(proj)
        .pointRadius(2);
    const svg = d3.select(divID)
        .append('svg')
        .attr('width', w)
        .attr('height', h);
    svg.append("path")
        .attr("id", function (d) {
            return "globe-shadow"
        })
        .attr("class", function(d) {
            return "globe-shadow"
        })
        .attr("d", path(sphere))
        .attr("stroke", "none")
        .attr("fill", color.highlight)
        .attr("transform", "translate(15, -15)");
    svg.append("path")
        .attr("id", function (d) {
            return "globe-view"
        })
        .attr("class", function(d) {
            return "globe-back"
        })
        .attr("d", path(sphere))
        .attr("fill", color.base);
    if (hemi == "e" | hemi == "w") {
        r = proj.rotate();
        proj.reflectX(true).rotate([r[0] + 180, -r[1], -r[2]]);
    }
    // 'Dark Side' Countries
    if (hemi == "e" | hemi == "w") {
        svg.append("path")
            .attr("d", path(c))
            // .attr("class", function(d) { return + d.country})
            .attr("fill", color.highlightBG);
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
            return slug(d.properties.country);
        })
        .attr("class", function (d) {
            return "country";
        })
        .attr("fill", color.highlight)
        .attr("stroke", "none")
        .attr("stroke-width", 0)
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave);

    // Graticule
    svg.append("path")
        .attr("d", path(graticule))
        .attr("stroke-width", 0.25)
        .attr("stroke", color.highlight)
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
        .attr("stroke", color.base)
        .attr("stroke-width", 0.1);

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
        // .attr("fill", color.highlight)
        .attr("fill", "none")
        .attr("stroke", color.base)
        .attr("stroke-width", 0.2)
        .style("opacity", 0);

    // Exhibitor locations
    svg.append("g")
        .attr("id", function (d) {
            return "exhibitors"
        })
        .selectAll("path")
        .data(ex.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", function (d) {
            return "exhibitor";
        })
        .attr("id", function (d) {
            return slug(d.properties.name);
        })
        .attr("fill", color.base)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5);
    //Sphere
    // svg.append("path")
    //     .attr("d", path(sphere))
    //     .attr("stroke-width", 2)
    //     .attr("stroke", "white")
    //     .attr("fill", "none");
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
    boothReset
}