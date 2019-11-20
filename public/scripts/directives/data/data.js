'use strict';
angular
    .module('ideotics')
    .directive('idData', idData);

idData.$inject = ['DataService'];

function idData(DataService) {
    return {
        restrict: 'EA',
        transclude: true,
        link: link,
        templateUrl: 'scripts/directives/data/data.html'
    };

    function link(scope, elem) {

        var videoId = scope.dataVM.currentVideo.id || 0;

        if (videoId !== 0) {
            DataService
                .getEvents(videoId)
                .success(function(data, status) {})
                .error(function(err, status) {});
        }

    }
}