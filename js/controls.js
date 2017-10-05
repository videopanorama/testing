var mousePos = { "x": 0, "y": 0 };

(function($) {

    // videoId2 = "example_video_2";
    // videoId3 = "example_video_3";
    mediagroupId = "main";

    $(document).on("controls", function() {

        var el = document.getElementById("videoContainer");

        var mc = new Hammer.Manager(el);

        mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));

        mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith(mc.get('pan'));

        mc.on("panstart panmove", 
            function(e) { changePosition(-e.deltaX / 200, -e.deltaY / 200, 0, 0, 0); });

        mc.on("pinch", function(e) {console.log(e);});

        var holding;

        var keysPressed = {};

        window.addEventListener("keydown", function(e) {
            // space and arrow keys
            if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);

        $(document).keydown(function(e) {
            keysPressed[e.which] = true;

            var ychange = 0;
            var xchange = 0;
            var zchange = 0;


            if (keysPressed[40]) { //down function
                ychange += 1;
            }
            if (keysPressed[37]) { //left function
                xchange -= 1;
            }
            if (keysPressed[39]) { //right function
                xchange += 1;
            }
            if (keysPressed[38]) { //up function
                ychange -= 1;
            }

            if (keysPressed[81]) { //q function
                zchange += 1;
            }
            if (keysPressed[87]) { //w function
                zchange -= 1;
            }

            if (xchange !== 0 || ychange !== 0 || zchange !== 0) {

                changePosition(xchange, ychange, zchange, mousePos.x, mousePos.y);
            }
        });

        $(document).keyup(function(e) {
            delete keysPressed[e.which];
        });

        $("body").mousemove(function(e) {
            mousePos.x = e.pageX;
            mousePos.y = e.pageY;
        });

        var zoom;



        // $("#videoContainer").on("mousedown", function(e) {

        //     if (e.which !=1) {return false;}

        //     holding = true;

            
        //     zoom = setInterval(function(){

        //         var zchange = 1;

        //     if (keysPressed[16]) {
        //         zchange = -1;
        //     }
        //         changePosition(0,0,zchange,e.pageX,e.pageY);
        //     },100);
        // });

        // $("#videoContainer").on("mouseup", function(e) {
        //     //if (e.which !=1) {return false;}
        //     holding = false;
        //     clearInterval(zoom);
        // });



        $("#videoContainer").on("wheel", function(e) {
            e.preventDefault();
            zchange = -e.originalEvent.deltaY / 100;
            changePosition(0, 0, zchange, e.pageX, e.pageY);
        });





    });
})(jQuery);