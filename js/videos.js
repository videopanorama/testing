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
var startzoom = 5;

//src variables

var xTile; //x of current top left tile of 3x3 grid 
var yTile; //y of current top left tile of 3x3 grid
var zoomLevel; //level of tiles being used

//continuous variables

var xpos = startx; //x of top left tile of visible 2x2, from 0 -> width
var ypos = starty; //y of top left tile of visible 2x2, from 0 -> height
var zoom = startzoom; //zoom level of current set of tiles, [1, 2^levels)

//buffer status

var bufferedPosters = CreatePosArray();
var bufferedVideos = CreatePosArray();

//players status, e.g. loaded, showing

var players = CreateTileArray();

//parameters

var useBuffer = true;
var useVideos = (urlParams.video == "true");;
//var useVideos = false;
var useSync = !(urlParams.sync == "false");

//time 

var timeBefore;
var nearestSecond;

//DOM selections

var videos;


/////////////////////

//initializes every video container, for tileUpdate

function initialize() {
    $("#" + id).attr("mediagroup", "main");
    var video = videojs(id, { loop: true, loadingSpinner: false });
    video.width(tileSize);
    video.height(tileSize);
    //video.poster("seafront/green.jpg");
    if (useVideos) {
        video.on("loadeddata", loaded);
    }

}

//gets the src of specific second frame, should be changed to work for seconds/half seconds

function imageSrc(x, y, level) {
    if (!(validTile(x, y, level))) { return "seafront/black.jpg"; }
    return 'seafront/seafront_full/pics/mipmap_' + level + '_' + y + '_' + x + '.jpg';
}

//gets the src of specific video tile

function videoSrc(x, y, level) {
    if (!(validTile(x, y, level))) { console.log("requested invalid tile " + level + "_" + y + "_" + x); return "../seafront/base.mp4"; }
    return '../seafront/seafront_full/mipmap_' + level + '_' + y + '_' + x + '.mp4';
}

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

//loads poster into memory

function bufferPoster(x, y, level) {

    if (!validTile(x, y, level)) {
        return false;
    }

    bufferStatus = bufferedPosters[level][x][y];

    if (bufferStatus.started) {
        return false;
    }

    bufferStatus.started = true;
    var img = $('<img>');
    img.attr('src', imageSrc(x, y, level));
    img.on('load', function() { bufferStatus.loaded = true; });
    $("#buffering").append(img);

}

//loads video into memory 

function bufferVideo(x, y, level) {

    if (!validTile(x, y, level)) {
        return false;
    }

    bufferStatus = bufferedVideos[level][x][y];

    if (bufferStatus.started) {
        return false;
    }

    bufferStatus.started = true;

    var element = $('<video/>');
    element.attr('id', x + '/' + y);
    $("#buffering").append(element);
    video = videojs(x + '/' + y);
    video.src(videoSrc(x, y));
    video.play();

    // Pause immediately after it starts playing.
    video.on("timeupdate", function() {
        if (this.currentTime > 0) {

            this.pause();

        }
    }, false);
}



//loads all images directly around current view

function bufferAllPosters() {

    for (ytile = -1; ytile < ytilesWindow + 1; ytile++) {
        for (xtile = -1; xtile < xtilesWindow + 1; xtile++) {
            bufferPoster(xtile + xTile, ytile + yTile, 3);

        }
    }

}

//loads all videos directly around current view

function bufferAllVideos() {

    for (ytile = -1; ytile < ytilesWindow + 1; ytile++) {
        for (xtile = -1; xtile < xtilesWindow + 1; xtile++) {
            bufferVideo(xtile + xTile, ytile + yTile);

        }
    }

}



//for loop that runs through every tile in the window and supplies videojs id

function tileUpdate(operation) {
    for (var ytile = 0; ytile < ytilesWindow; ytile++) {
        for (var xtile = 0; xtile < xtilesWindow; xtile++) {
            id = ytile + "_" + xtile;
            operation(xtile, ytile, id);
        }
    }
}

/////////////////

//changes video and poster src depending on xTile and yTile, for tileUpdate

function updatePoster(xtile, ytile, id) {
    var video = videojs(id);

    var src = imageSrc(xtile + xTile, ytile + yTile, zoomLevel);

    $("#" + id).parent().css("background-image", 'url("' + src + '")');
}


function updateVideo(xtile, ytile, id) {
    var video = videojs(id);
    var src = videoSrc(xtile + xTile, ytile + yTile, zoomLevel);
    video.src(src);
    video.currentTime(nearestSecond);
    video.play();
}




//changes xpos and ypos and zoom via css, if video srcs needs to be changed then changeTilesSrc is runn

function setPosition(newxpos, newypos, newzoom) {

    var newzoomLevel = Math.floor(Math.log2(newzoom));
    var newzoomrounded = Math.pow(2, newzoomLevel);


    var tileLength = (assumedTileSize / newzoomrounded);
    var scaleFactor = newzoom / newzoomrounded;


    var xposTile = newxpos / tileLength;
    var yposTile = newypos / tileLength;

    var newxTile = Math.floor(xposTile);
    var newyTile = Math.floor(yposTile);

    if (newxpos < 0) {
        newxpos = 0;
    }

    if (newypos < 0) {
        newypos = 0;
    }

    if (newxpos + tileLength * (xtilesWindow - 1) / scaleFactor > width) {
        newxpos = width - tileLength * (xtilesWindow - 1) / scaleFactor;
    }

    if (newypos + tileLength * (ytilesWindow - 1) / scaleFactor > height) {
        newypos = height - tileLength * (ytilesWindow - 1) / scaleFactor;
    }

    if (newzoom > Math.pow(2, levels)) {
        newzoom = Math.pow(2, levels);
    }

    if (newzoom < 1) {
        newzoom = 1;
    }

    if (newxpos < 0 || newypos < 0 || newxpos + tileLength * (xtilesWindow - 1) / scaleFactor > width || newypos + tileLength * (ytilesWindow - 1) / scaleFactor > height || newzoom >= Math.pow(2, levels) || newzoomLevel < 1) {
        return false;
    }

    newzoomLevel = Math.floor(Math.log2(newzoom));
    newzoomrounded = Math.pow(2, newzoomLevel);


    tileLength = (assumedTileSize / newzoomrounded);
    scaleFactor = newzoom / newzoomrounded;


    xposTile = newxpos / tileLength;
    yposTile = newypos / tileLength;

    newxTile = Math.floor(xposTile);
    newyTile = Math.floor(yposTile);

    //zoom css 


    tileSize = defaultTileSize * scaleFactor;
    tileUpdate(function(xtile, ytile, id) {
        var video = videojs(id);
        video.dimensions(tileSize, tileSize);

    });
    $("#videos td").css("width", tileSize).css("height", tileSize);

    // position css


    var right = xposTile - newxTile;
    $("#videos").css("right", right * tileSize);

    var bottom = yposTile - newyTile;
    $("#videos").css("bottom", bottom * tileSize);

    //setting new variables

    xpos = newxpos;
    ypos = newypos;
    zoom = newzoom;

    //updates src if necessary

    if (newxTile != xTile || newyTile != yTile || newzoomLevel != zoomLevel) {
        xTile = newxTile;
        yTile = newyTile;
        zoomLevel = newzoomLevel;
        changeTilesSrc();
    }
}

//runs update for every tile

function changeTilesSrc() {
    timeBefore = videojs("0_0").currentTime();

    nearestSecond = (Math.round(timeBefore) % 8) || 0;


    videos.css("display", "none");

    //   console.error("hiding videos");

    //console.error("updating posters");
    tileUpdate(updatePoster);



    if (useVideos) {
        //   console.error("updating videos");
        players = CreateTileArray();
        tileUpdate(updateVideo);
    }

    if (useBuffer) {
        bufferAllPosters();
    }

}

var loaded = function() {


    var id = this.id();
    var xtile = getPos(id)["x"];
    var ytile = getPos(id)["y"];
    if (players[xtile][ytile].showing) {
        return;
    }
    players[xtile][ytile].showing = true;

    // console.error("showing" + id);
    $("#" + id).css("display", "block");
    // $("#" + id + " *").css("visibility", "visible");


};

////////////////////







function changePosition(xchange, ychange, zoomchange, zoomcenterX, zoomcenterY) {
    var zoomStep = 0.05;
    var posStep = 10;
    var zdelta = zoomStep * zoomchange;
    var zoomRatio = zdelta / zoom;
    var xdelta = posStep * xchange + zoomcenterX * zoomRatio / (zoomRatio + 1) * assumedTileSize / defaultTileSize;
    var ydelta = posStep * ychange + zoomcenterY * zoomRatio / (zoomRatio + 1) * assumedTileSize / defaultTileSize;
    setPosition((xpos || 0) + xdelta, (ypos || 0) + ydelta, (zoom || 5) * (1 + zdelta));
}

$(document).on("startMaster", function() {
    tileUpdate(initialize);
    videos = $(".video-js");
    setPosition(xpos, ypos, zoom);
    $(document).trigger("controls");
    if (useSync) { $(document).trigger("sync"); }
});