import * as color from "./colors.js";

const colorize = () => {
    document.getElementById("vid-div").setAttribute("style", "background-color:" + color.highlight);
}

module.exports = {
    colorize
}