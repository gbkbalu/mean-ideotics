'use strict';
(function (angular) {

    angular
        .module('abVideoWidget', [])
        .directive('abVideo', videoDirective);

    function videoDirective() {

        var template = '<video id="video" controls autoplay=""></video>';

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
                videoStatus:isVideoPaused
            };

            function play() {
                vm.native.play();
                vm.api.properties.isPaused = false;
            }
			
            // src: url, play:Boolean 
            function changeSource(src, play) {

                vm.native.src = src;

                if (play) {
                    vm.native.play();
                }
            }

            function moveBufferLocation(timeSec) {
                vm.native.currentTime  = timeSec;
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
                    vm.native.addEventListener('loadedmetadata', function () {
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
