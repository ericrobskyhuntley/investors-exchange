import { highlight, highlightBG, base, baseBG } from "./constants.js";
import videojs from "video.js";
import 'video.js/dist/video-js.css';

let b = document.querySelector('body');
let w = b.offsetWidth;
let wBooth = b.offsetWidth / 4;
const playbackRate = 0.4;

const colorize = () => {
    document
        .getElementById("base-overlay")
        .setAttribute("style", "background-color:" + base);
}
const player = videojs('booth-view', {
    controls: false,
    autoplay: true,
    preload: 'auto',
    loop: true
});

const overlayPlayer = videojs('vid-motion', {
    controls: false,
    autoplay: true,
    preload: 'auto',
    loop: true
});

player.defaultPlaybackRate(playbackRate);
overlayPlayer.defaultPlaybackRate(playbackRate);


player.ready(function(){
    this.src({
        type: "video/mp4", 
        src: "http://127.0.0.1:3000/video/bw/2103.mp4"
    });
    this.width(wBooth);
    this.on('mousemove', function(e){
        this.pause();
        let prop = (1 - (e.offsetX / wBooth));
        this.currentTime(this.duration() * prop);
    });
});

overlayPlayer.ready(function(){
    this.src({
        type: "video/mp4", 
        src: "http://127.0.0.1:3000/video/bw/2103.mp4"
    });
    this.width(w);
});

var changeSource = function(src) {
    player.src({
        type: "video/mp4", 
        src: src
    })
    overlayPlayer.src({
        type: "video/mp4", 
        src: src
    })
}


module.exports = {
    colorize,
    changeSource
}