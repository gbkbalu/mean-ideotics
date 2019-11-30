'use strict';

(function(angular) {

    angular
        .module('abVideoWidget', [])
        .directive('abVideo', videoDirective);

    videoDirective.$inject = ['$rootScope'];

    function videoDirective($rootScope) {
        var template = '<video id="video" controls controlsList="nofullscreen"></video>';

        return {
            restrict: "EA",
            replace: true,
            link: link,
            template: template,
            controller: controller,
            controllerAs: 'videoPlayVM',
            bindToController: {
                api: '='
            }
        };

        function link(scope, elem, attribs, controller) {

            var video = elem[0];

            video.src = attribs.abSrc;

            controller.native = video;

        }

        function controller() {

            var vm = this;

            vm.native = {};

            vm.api = {
                controls: {
                    play: play,
                    pause: pause,
                    changeSource: changeSource,
                    changePosition: moveBufferLocation
                },
                properties: {
                    duration: getDuration,
                    isPaused: isVideoPaused,
                    currentTime: currentTime
                },
                videoStatus: isVideoPaused
            };

            function play() {
                vm.native.play();
                vm.api.properties.isPaused = false;
            }

            // src: url, play:Boolean 
            function changeSource(src, play) {

                // vm.native.src = "https://r1---sn-3u-bh2l6.googlevideo.com/videoplayback?expire=1574428931&ei=o4zXXe2hN7-Is8IPv-WskAY&ip=222.112.215.2&id=o-ALfqarSJ22L-i0ajKaf0k06tq07_A_g5M-78uX2bXS7B&itag=22&source=youtube&requiressl=yes&mm=31%2C26&mn=sn-3u-bh2l6%2Csn-i3b7kn7s&ms=au%2Conr&mv=m&mvi=0&pl=23&initcwndbps=1377500&mime=video%2Fmp4&ratebypass=yes&dur=92.067&lmt=1521001337645699&mt=1574407280&fvip=1&fexp=23842630&c=WEB&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cmime%2Cratebypass%2Cdur%2Clmt&sig=ALgxI2wwRAIgSaPHjsKVQC9mXJjFSzLWDP0JUrkJxlKlOh0UFZFlzAoCIDa06FGxuZn0xsRrlwRBsO9f4FS__BxpOkGL71UwcACU&lsparams=mm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AHylml4wRgIhANxDUBbRfXnd5yVOR3UTNmFHvEsFZ1bjNJTP0lXDlFRFAiEAzmpcXE6tOtWQ7uPMKANsyEHF-lVAksfY4pxXnWTkZSM%3D";
                //https://www.youtube.com/watch?v=VEJs8puLPX0"; //
                // blob:https://www.youtube.com/4c530d6c-0b77-4996-bc56-2b01a445bbde";
                //https://www.youtube.com/watch?v=17Deeq8N2e4"; 
                // vm.native.src = "http://localhost/test.mp4";
                vm.native.src = src;

                if (play) {
                    vm.native.play();
                }
            }

            function moveBufferLocation(timeSec) {
                vm.native.currentTime = timeSec;
                vm.native.pause();
            }

            function pause() {
                // alert(vm.api.properties.currentTime())
                //vm.native.currentTime  = 50;

                vm.native.pause();
            }

            function getDuration() {
                return vm.native.duration;
            }

            function isVideoPaused() {
                return vm.native.paused;
            }

            function currentTime(time) {
                if (time) {
                    vm.native.addEventListener('loadedmetadata', function() {
                        vm.native.currentTime = time;
                    }, false);
                } else {
                    return Math.floor(vm.native.currentTime);
                    //return vm.native.currentTime;
                }
            }
        }

    }

})(window.angular);