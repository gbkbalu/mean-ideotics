'use strict';

var directives = angular.module('directives', []);

directives.directive('file', function() {
  return {
    restrict: 'AE',
    scope: {
      file: '@'
    },
    link: function(scope, el, attrs){
      el.bind('change', function(event){
        var files = event.target.files;

          var relativePath = files[0].webkitRelativePath;
          var folder = relativePath.split("/");
          console.log(files[0])
          //alert(relativePath);
        var fileObjs = [];

        for(var filesLen = 0 ;filesLen<files.length;filesLen++)
        {
            var objFile = files[filesLen];
            objFile.uploadProgress = 0;
            objFile.fileSize = Math.round(parseInt(objFile.size)/1000);
            fileObjs.push(objFile)
        }

        scope.$parent.filesToUploaded = fileObjs;

        scope.file = fileObjs[0];
        scope.$parent.file = fileObjs[0];
        scope.$parent.fileUploadLen = 0;
        scope.$parent.uploadProgress =0;
        scope.$apply();

      });
    }
  };
})

directives.directive('onFileChange', function() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.onFileChange);

            element.bind('change', function() {
                scope.$apply(function() {
                    var files = element[0].files;
                    if (files) {
                        onChangeHandler(files);
                    }
                });
            });

        }
    };
})

app.directive('customOnChange', function() {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.customOnChange);
            element.on('change', onChangeHandler);
            element.on('$destroy', function() {
                element.off();
            });

        }
    };
});


directives.directive('customUpload', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                element.on('change', function(){
                    //size in bytes
                    var size = element[0].files[0].size;
                    console.log(size);
                    //do something with the file
                });
            }
        };
    })
directives.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])
directives.directive('csvReader', ['ProjectsService','VideoService',function (ProjectsService,VideoService) {

    // Function to convert to JSON
    var convertToJSON = function (content) {

        // Declare our variables
        var lines = content.csv.replace(/[\r]/g, '').split('\n'),
            headers = lines[0].split(content.separator),
            columnCount = lines[0].split(content.separator).length,
            results = [];

        // For each row
        for (var i = 1; i < lines.length-1; i++) {

            // Declare an object
            var obj = {};

            // Get our current line
            var line = lines[i].split(new RegExp(content.separator + '(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)'));

            // For each header
            for (var j = 0; j < headers.length; j++) {

                // Populate our object
                obj[headers[j]] = line[j];
            }

            // Push our object to our result array
            results.push(obj);
        }

        return results;
    };

    return {
        restrict: 'A',
        scope: {
            results: '=',
            separator: '=',
            callback: '&saveResultsCallback'
        },
        link: function (scope, element, attrs) {

            // Create our data model
            var data = {
                csv: null,
                separator: scope.separator || ','
            };

            // When the file input changes
            element.on('change', function (e) {

                // Get our files
                var files = e.target.files;

                // If we have some files
                if (files && files.length) {

                    // Create our fileReader and get our file
                    var reader = new FileReader();
                    var file = (e.srcElement || e.target).files[0];

                    // Once the fileReader has loaded
                    reader.onload = function (e) {

                        // Get the contents of the reader
                        var contents = e.target.result;

                        // Set our contents to our data model
                        data.csv = contents;

                        // Apply to the scope
                        scope.$apply(function () {

                            // Our data after it has been converted to JSON
                            scope.results = convertToJSON(data);
                            scope.$parent.results = scope.results;
                            scope.$emit('csvResults', scope.results);
                            // Call our callback function 
                            scope.callback(scope.result);
                        });
                    };

                    // Read our file contents
                    reader.readAsText(file);
                }
            });
        }
    };
}])
directives.directive('scrolly', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var raw = element[0];

            element.bind('scroll', function () {
                if (raw.scrollTop + raw.offsetHeight >= (raw.scrollHeight -50)) {
                    scope.$apply(attrs.scrolly);
                }
            });
        }
    };
})
directives.directive('heatMap', function(){
    return {
        restrict: 'E',
        scope: {
            data: '='
        },
        template: '<div container></div>',
        link: function(scope, ele, attr){
            scope.heatmapInstance = h337.create({
                container: ele.find('div')[0]
            });
            scope.heatmapInstance.setData(scope.data);
        }

    };
})
directives.directive('onlyDigits', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attr, ctrl) {
            function inputValue(val) {
                if (val) {
                    var digits = val.replace(/[^0-9]/g, '');

                    if (digits !== val) {
                        ctrl.$setViewValue(digits);
                        ctrl.$render();
                    }
                    return parseInt(digits,10);
                }
                return undefined;
            }
            ctrl.$parsers.push(inputValue);
        }
    };
})
directives.directive("limitTo", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTo);
            angular.element(elem).on("keypress", function(e) {
                if (this.value.length == limit) e.preventDefault();
            });
        }
    }
}])

directives.directive('customOnChange', function() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.customOnChange);
                element.bind('change', onChangeHandler);
            }
        };
    })
angular.module('ui.grid.custom.rowSelection', ['ui.grid'])

    .directive('uiGridCell', function ($timeout, uiGridSelectionService) {
        return {
            restrict: 'A',
            require: '^uiGrid',
            priority: -200,
            scope: false,
            link: function ($scope, $elm, $attr, uiGridCtrl) {
                if ($scope.col.isRowHeader) {
                    return;
                }

                var touchStartTime = 0;
                var touchTimeout = 300;

                registerRowSelectionEvents();

                function selectCells(evt) {
                    // if we get a click, then stop listening for touchend
                    $elm.off('touchend', touchEnd);

                    if (evt.shiftKey) {
                        uiGridSelectionService.shiftSelect($scope.grid, $scope.row, evt, $scope.grid.options.multiSelect);
                    }
                    else if (evt.ctrlKey || evt.metaKey) {
                        uiGridSelectionService.toggleRowSelection($scope.grid, $scope.row, evt, $scope.grid.options.multiSelect, $scope.grid.options.noUnselect);
                    }
                    else {
                        uiGridSelectionService.toggleRowSelection($scope.grid, $scope.row, evt, ($scope.grid.options.multiSelect && !$scope.grid.options.modifierKeysToMultiSelect), $scope.grid.options.noUnselect);
                    }
                    $scope.$apply();

                    // don't re-enable the touchend handler for a little while - some devices generate both, and it will
                    // take a little while to move your hand from the mouse to the screen if you have both modes of input
                    $timeout(function() {
                        $elm.on('touchend', touchEnd);
                    }, touchTimeout);
                };

                function touchStart(evt) {
                    touchStartTime = (new Date()).getTime();

                    // if we get a touch event, then stop listening for click
                    $elm.off('click', selectCells);
                };

                function touchEnd(evt) {
                    var touchEndTime = (new Date()).getTime();
                    var touchTime = touchEndTime - touchStartTime;

                    if (touchTime < touchTimeout ) {
                        // short touch
                        selectCells(evt);
                    }

                    // don't re-enable the click handler for a little while - some devices generate both, and it will
                    // take a little while to move your hand from the screen to the mouse if you have both modes of input
                    $timeout(function() {
                        $elm.on('click', selectCells);
                    }, touchTimeout);
                };

                function registerRowSelectionEvents() {
                    $elm.addClass('ui-grid-disable-selection');
                    $elm.on('touchstart', touchStart);
                    $elm.on('touchend', touchEnd);
                    $elm.on('click', selectCells);
                }
            }
        };
    })
