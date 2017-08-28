
        var mousePos = { "x": 0, "y": 0 };

(function($) {

    // videoId2 = "example_video_2";
    // videoId3 = "example_video_3";
    mediagroupId = "main";

    $(document).on("controls", function() {

        hammer = new Hammer(document.getElementById("videoContainer"));
        hammer.get('pinch').set({enable:true});

        hammer.on("pan", function(event) {changePosition(-event.deltaX/2000,-event.deltaY/2000, 0, 0, 0);});

      //  hammer.on("pinch", function(event) {console.log(-event.deltaX/2000,-event.deltaY/2000, 0, 0, 0);});

        //buttons

        var holding;
        //keys
        var keys = {};


        $("body").mousemove(function(e) {
            mousePos.x = e.pageX;
            mousePos.y = e.pageY;
        });

        $(document).keydown(function(e) {
            keys[e.which] = true;

            var ychange = 0;
            var xchange = 0;
            var zchange = 0;


            if (keys[40]) { //down function
                ychange += 1;
            }
            if (keys[37]) { //left function
                xchange -= 1;
            }
            if (keys[39]) { //right function
                xchange += 1;
            }
            if (keys[38]) { //up function
                ychange -= 1;
            }

            if (keys[81]) { //q function
                zchange += 1;
            }
            if (keys[87]) { //w function
                zchange -= 1;

            }

            if (xchange !== 0 || ychange !== 0 || zchange !== 0) {

            changePosition(xchange, ychange, zchange, mousePos.x, mousePos.y);
        }
        });

        $("#videoContainer").on("wheel", function(e) {
            e.preventDefault();
            zchange = -e.originalEvent.deltaY/100;
            changePosition(0, 0, zchange, e.pageX, e.pageY);
        });

        $(document).keyup(function(e) {
            delete keys[e.which];
        });


        window.addEventListener("keydown", function(e) {
            // space and arrow keys
            if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
            }
        }, false);



    });
})(jQuery);