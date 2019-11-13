'use strict';
angular
    .module('ideotics')
    .directive('ngEnter', ngEnter);

function ngEnter() {
    return {
        restrict: 'EA',
        link: link
    };

    function link(scope, elements, attrs) {

        elements.bind('keydown keypress', function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });

    }
}
