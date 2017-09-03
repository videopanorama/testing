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

var bufferedPostersLoading = [];
var bufferedPostersLoaded = [];

var bufferedVideos = CreatePosArray(); //change to format of posters

//players status, e.g. loaded, showing

var players;
var playersShowing;

//parameters

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


////////////////////////// buffering

//loads poster into memory

function bufferPoster(x, y, level) {

    if (!validTile(x, y, level)) {
        return false;
    }

    var file = getImageFile(x, y, level);

    loading = bufferedPostersLoading.indexOf(file) > -1;
    loaded = bufferedPostersLoaded.indexOf(file) > -1;

    if (loading || loaded) {
        return false;
    }
    bufferedPostersLoading.push(file);

    var img = $('<img>');
    img.attr('id', file);
    img.attr('src', imageSrc(x, y, level));
    img.on('load', function() {
        bufferedPostersLoaded.push(this.id);
        bufferedPostersLoading.splice(bufferedPostersLoading.indexOf(file), 1);
    });
    $("#buffering").append(img);
}

function stopBufferingPoster(x, y, level) {
    if (!validTile(x, y, level)) {
        return false;
    }

    file = getImageFile(x, y, level);

    if (!(file in bufferedPostersLoading) || file in bufferedPostersLoaded) {
        return false;
    }

    var img = $('#' + file);
    img.remove();


}

function stopAllBufferingPoster() {
    window.stop();
    bufferedPostersLoading = [];
}

//loads video into memory, incomplete, needs change to poster format

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
    for (var level = -1; level <= 1; level++)
        for (var ytile = -1; ytile <= ytilesWindow; ytile++) {
            for (var xtile = -1; xtile <= xtilesWindow; xtile++) {
                bufferPoster(xtile + xTile, ytile + yTile, zoomLevel + level);

            }
        }

}

//loads all videos directly around current view

function bufferAllVideos() {

    for (var ytile = -1; ytile < ytilesWindow + 1; ytile++) {
        for (var xtile = -1; xtile < xtilesWindow + 1; xtile++) {
            bufferVideo(xtile + xTile, ytile + yTile);

        }
    }

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
    video.width(tileSize);
    video.height(tileSize);

    //$("#" + id).parent().on('load', loadedImage);
    if (useVideos) {
        video.on("playing", loadedVideo);
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

    if (newxpos + tileLength * (xtilesWindow - 1) / scaleFactor > width) {
        newxpos = width - tileLength * (xtilesWindow - 1) / scaleFactor;
    }

    if (newypos + tileLength * (ytilesWindow - 1) / scaleFactor > height) {
        newypos = height - tileLength * (ytilesWindow - 1) / scaleFactor;
    }

    var xposTile = newxpos / tileLength;
    var yposTile = newypos / tileLength;

    var newxTile = Math.floor(xposTile);
    var newyTile = Math.floor(yposTile);

    if (newxpos < 0 || newypos < 0 || newxpos + tileLength * (xtilesWindow - 1) / scaleFactor > width || newypos + tileLength * (ytilesWindow - 1) / scaleFactor > height || newzoom >= Math.pow(2, levels) || newzoomLevel < 1) {
        return false;
    }

    //updates src if necessary




    //zoom css 

    css = function() {


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
    };

    if (newxTile != xTile || newyTile != yTile || newzoomLevel != zoomLevel) {
        xTile = newxTile;
        yTile = newyTile;
        zoomLevel = newzoomLevel;
        css();
        changeTilesSrc(css);

    } else {
        css();
    }


}

//runs update for every tile

function changeTilesSrc(css) {

    timeBefore = videojs("0_0").currentTime();

    nearestSecond = (Math.round(timeBefore) % 8) || 0;


    videos.css("display", "none");

    stopAllBufferingPoster();


    tileUpdate(updatePoster);


    if (useVideos) {
        videosShowing = 0;
        players = CreateTileArray();

        tileUpdate(updateVideo);
    }

    else {
        buffer();
    }







}

var loadedVideo = function() {
    var id = this.id();
    var xtile = getPos(id)["x"];
    var ytile = getPos(id)["y"];
    if (players[xtile][ytile].showing) {
        return;
    }

    players[xtile][ytile].showing = true;
    videosShowing += 1;
    if (videosShowing == xtilesWindow * ytilesWindow) {
        //buffer();
    }


    $("#" + id).css("display", "block");
};


var buffer = function() {
    bufferAllPosters();
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