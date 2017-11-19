//static

var width = 1835;
var height = 640;
var assumedTileSize = 1024; //tile size used when calculating width and height

var levels = 6;
var xmaxLevels = [2, 4, 8, 15, 29, 58]; //maximum x of available tiles at each level
var ymaxLevels = [1, 2, 3, 5, 10, 20]; //maximum y of available tiles at each level

//initialize


var startx = 0;
var starty = 0;
var startzoom = 4;

//src variables

var xTile; //x of current top left tile of 3x3 grid 
var yTile; //y of current top left tile of 3x3 grid
var zoomLevel; //level of tiles being used

//continuous variables

var xpos = startx; //x of top left tile of visible 2x2, from 0 -> width
var ypos = starty; //y of top left tile of visible 2x2, from 0 -> height
var zoom = startzoom; //zoom level of current set of tiles, [1, 2^levels)

//buffer status



//players status, e.g. loaded, showing

var players;

var imagesReady;
var videosReady;

var allImagesReady;
var allVideosReady;

//parameters

var useOffline = urlParams.offline == "true";
var useBuffer = true;
var useVideos = !(urlParams.video == "false");
//var useVideos = false;
var useSync = !(urlParams.sync == "false");

//time 

var timeBefore;
var nearestSecond;

//DOM selections

var videos;

////////////////////////// common



function getId(x, y) {
    return y + "_" + x;
}



function getPos(id) {
    z = id.split("_");
    return { "x": parseInt(z[1]), "y": parseInt(z[0]) };
}

//checks for valid tile

function validTile(x, y, level) {

    if (level > (levels - 1)) {
        return false;
    }

    if (x > (xmaxLevels[level] - 1) || (x < 0)) {
        return false;
    }

    if (y > (ymaxLevels[level] - 1) || (y < 0)) {
        return false;
    }
    return true;
}




/////////////////////

//for loop that runs through every tile in the window and supplies videojs id

function tileUpdate(operation) {
    for (var ytile = 0; ytile < ytilesWindow; ytile++) {
        for (var xtile = 0; xtile < xtilesWindow; xtile++) {
            id = ytile + "_" + xtile;
            operation(xtile, ytile, id);
        }
    }
}

//initializes every video container

function initialize() {
    $("#" + id).attr("mediagroup", "main");
    var video = videojs(id, { loop: true, loadingSpinner: false });
    //video.width(tileSize);
  //  video.height(tileSize);

    //$("#" + id).parent().on('load', loadedImage);
    if (useVideos) {
        video.on("playing", loadedVideo);
    }

}

/////////////////

//changes video and poster src depending on xTile and yTile, for tileUpdate

function updatePoster(xtile, ytile, id) {
    var setBackgroundImage = function(src) { $("#" + id).parent().css("background-image", src); };

    setBackgroundImage("");

    var promise = function(src) { setBackgroundImage('url("' + src + '")'); };

    retrievePoster(xtile + xTile, ytile + yTile, zoomLevel, promise);


}


function updateVideo(xtile, ytile, id) {
    var video = videojs(id);
  //  var src = videoSrc(xtile + xTile, ytile + yTile, zoomLevel);
    // video.src(src);
    // video.currentTime(nearestSecond);
    // video.play();

    var setVideoSrc = function(src) {
        players[xtile][ytile].updated = true;
        video.src(src);
        video.currentTime(nearestSecond);
        video.play();
    };


    var promise = function(src) { setVideoSrc(src);
     //   $("#" + id).css("display", "block");
   };

    retrieveVideo(xtile + xTile, ytile + yTile, zoomLevel, promise);
}

//changes xpos and ypos and zoom via css, if video srcs needs to be changed then changeTilesSrc is runn

function setPosition(newxpos, newypos, newzoom) {

    var newzoomLevel = Math.floor(Math.log2(newzoom));
    var newzoomrounded = Math.pow(2, newzoomLevel);

    if (newzoom >= Math.pow(2, levels)) {
        newzoom = Math.pow(2, levels) - 0.1;
    }

    if (newzoom < 4) {
        newzoom = 4;
    }

    newzoomLevel = Math.floor(Math.log2(newzoom));
    newzoomrounded = Math.pow(2, newzoomLevel);

    var tileLength = (assumedTileSize / newzoomrounded);
    var scaleFactor = newzoom / newzoomrounded;

    if (newxpos < 0) {
        newxpos = 0;
    }

    if (newypos < 0) {
        newypos = 0;
    }

    if (newxpos + tileLength * xtilesView / scaleFactor > width) {
        newxpos = width - tileLength * xtilesView / scaleFactor;
    }

    if (newypos + tileLength * ytilesView / scaleFactor > height) {
        newypos = height - tileLength * ytilesView / scaleFactor;
    }


    if (newxpos < 0 || newypos < 0 || newxpos + tileLength * xtilesView / scaleFactor > width || newypos + tileLength * ytilesView / scaleFactor > height || newzoom >= Math.pow(2, levels) || newzoomLevel < 1) {
        return false;
    }
    xpos = newxpos;
    ypos = newypos;
    zoom = newzoom;

    var xposTile = newxpos / tileLength;
    var yposTile = newypos / tileLength;

    var newxTile = Math.floor(xposTile);
    var newyTile = Math.floor(yposTile);

   //css();

    if (newxTile != xTile || newyTile != yTile || newzoomLevel != zoomLevel) {
        xTile = newxTile;
        yTile = newyTile;
        zoomLevel = newzoomLevel;
        
        changeTilesSrc();
       // css();
    } else {
        css();
    }
}

function css() {

    var zoomrounded = Math.pow(2, zoomLevel);

    var scaleFactor = zoom / zoomrounded;

    var tileLength = assumedTileSize / zoomrounded;

    var xposTile = xpos / tileLength;
    var yposTile = ypos / tileLength;


    tileSize = defaultTileSize * scaleFactor;
    tileUpdate(function(xtile, ytile, id) {
        var video = videojs(id);
        video.dimensions(tileSize, tileSize);

    });
    $("#videos td").css("width", tileSize).css("height", tileSize);

    // position css


    var right = xposTile - xTile;
    $("#videos").css("right", right * tileSize);

    var bottom = yposTile - yTile;
    $("#videos").css("bottom", bottom * tileSize);

    //setting new variables


}

var timeout = 10;

function changeTilesSrc() {

    timeBefore = videojs("0_0").currentTime();

    nearestSecond = (Math.round(timeBefore) % 8) || 0;


    videos.css("display", "none");



    stopAllBufferingPoster();

    imagesReady = 0;

    tileUpdate(updatePoster);

    //$("#videoContainer").waitForImages(function() { console.log("asd", imagesReady, allImagesReady);  });


    if (useVideos) {
        videosReady = 0;
        players = CreateTileArray();
        tileUpdate(updateVideo);
    } else {
        buffer();
    }

    css();





}

var loadedVideo = function() {
    var id = this.id();
    var xtile = getPos(id)["x"];
    var ytile = getPos(id)["y"];

    if (players[xtile][ytile].showing || !(players[xtile][ytile].updated)) {
        return;
    }


    players[xtile][ytile].showing = true;
    videosReady += 1;

    $("#" + id).css("display", "block");

    if (videosReady == xtilesWindow * ytilesWindow) {
        buffer();
        console.log("all videos loaded, buffering posters...");
    }
};




var buffer = function() {
    if (useBuffer) bufferAllPosters();
};

////////////////////

function changePosition(xchange, ychange, zoomchange, mouseX, mouseY) {
    var zoomStep = 0.05;
    var posStep = 30;
    var zdelta = zoomchange * zoomStep;
    var tileLength = assumedTileSize / Math.pow(2, zoomLevel);
    var xdelta = (mouseX / tileSize * tileLength) * zdelta * (1) / (1 + zdelta);
    var ydelta = (mouseY / tileSize * tileLength) * zdelta * (1) / (1 + zdelta);

    setPosition(xpos + xchange * posStep / zoom + xdelta, ypos + ydelta + ychange * posStep / zoom, zoom * (1 + zdelta));
}

$(document).on("startMaster", function() {
    tileUpdate(initialize);
    videos = $(".video-js");
    setPosition(xpos, ypos, zoom);
    $(document).trigger("controls");
    if (useSync) { $(document).trigger("sync"); }
});