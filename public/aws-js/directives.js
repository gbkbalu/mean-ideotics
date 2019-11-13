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
        var file = files[0];
        scope.filesToUploaded = files;

        for(var filesLen = 0 ;filesLen<scope.filesToUploaded.length;filesLen++)
        {
            scope.filesToUploaded[filesLen].uploadProgress = 0;
        }

        scope.$parent.filesToUploaded = files;

        scope.file = file;
        scope.$parent.file = file;
        scope.$apply();
      });
    }
  };
})

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