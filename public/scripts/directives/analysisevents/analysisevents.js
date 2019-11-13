'use strict';
angular
    .module('ideotics')
    .directive('analysisEvents', idEvents);

idEvents.$inject = ['EventService'];
function idEvents(EventService) {
    return {
        restrict: 'EA',
        transclude: true,
        link: link,
        templateUrl: 'scripts/directives/events/events.html'
    };

    function link(scope, elem) {

        var videoId = scope.dashVM.currentVideo.id || 0;

        if(videoId !== 0)
        {
        	EventService
            .getEvents(videoId)
            .success(function(data, status) {
            })
            .error(function(err, status) {
            });
        }
    }
}
