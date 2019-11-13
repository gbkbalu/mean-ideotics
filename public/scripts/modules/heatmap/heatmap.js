"use strict";
angular
    .module('ideotics')
    .controller('HeatMapController', HeatMapController);

HeatMapController.$inject = ['EventService','$scope','$rootScope'];
function HeatMapController(EventService,$scope,$rootScope) {

    window.dashboard = false;
    $rootScope.setHeaderglobal(18);
    var vm = this;

    var heatmapInstance = h337.create({
        container: document.querySelector('.heatmap')
    });
    var points = [];
    var max = 0;
    var width = 680;
    var height = 420;
    var len = 200;

    var frameWidth = 777;
    var frameHeight = 579;

    vm.fmWidth = frameWidth;
    vm.fmHeight = frameHeight;

    vm.heatMapFilterObject = EventService.getHeatMapFilterObj();
    vm.inVal = 10;
    vm.camImageUrl = "https://images-na.ssl-images-amazon.com/images/I/51M0E6J290L._SL1000_.jpg";

    vm.camImgObj = vm.heatMapFilterObject.cameraImgObj;

    if(isVaulueValid(vm.camImgObj.camImageUrl))
    {
        vm.camImageUrl = vm.camImgObj.camImageUrl
    }

    $('#pf_foto').css('background-image', 'url("' + vm.camImageUrl + '")');

    vm.heatMapFilterObject = vm.heatMapFilterObject.filterObj;
    vm.resetMap = function(setValues)
    {
        var len = 200;
        points = [];
        for(var len=0;len<setValues.length;len++)
        {
            width = Number(setValues[len].playingWidth);
            height = Number(setValues[len].playingHeight);
            var val = Math.floor(10*10);
            max = Math.max(max, val);
            var xVal = Math.round(((Number(setValues[len].xaxis)+Number(setValues[len].xendaxis))/2/frameWidth)*width);
            var yVal = Math.round(((Number(setValues[len].yaxis)+Number(setValues[len].yendaxis))/2/frameHeight)*height);
            var point = {
                x: Math.floor(xVal),
                y: Math.floor(yVal),
                value: vm.inVal
            };
            points.push(point);
        }
        var data = {
            max: max,
            data: points
        };

        heatmapInstance.setData(data);
        $rootScope.stopLoadingBlockUI();
    }
    vm.mapData = '';
    EventService.getEventsByVideoForHeatMap(vm.heatMapFilterObject)
        .success(function(data, status) {
            $rootScope.loadingAndBlockUI('Loading Events To Show HeatMap In Progress...');
            frameWidth = 777;
            frameHeight = 579;
            vm.mapData = data;
            vm.resetMap(data);
        }).error(function(err, status) {

    });

    vm.resetMapDataByVal = function()
    {
        vm.resetMap(vm.mapData);
    }

    vm.reset = function()
    {
        var len = 200;
        points = [];
        while (len--) {
            var val = Math.floor(10*10);
            max = Math.max(max, val);
            var point = {
                x: Math.floor(10*width),
                y: Math.floor(10*height),
                value: val
            };
            points.push(point);
        }

        var data = {
            max: max,
            data: points
        };
        heatmapInstance.setData(data);
    }

    vm.uploadEvents = function()
    {
        $("#importVideoEvents").click();
    }
    $scope.$on('csvResults', function (evt, csvRowsResuls) {
        $rootScope.loadingAndBlockUI('Loading Events To Show HeatMap In Progress...');
        //frameWidth = vm.fmWidth;
        //frameHeight = vm.fmHeight;

        for(var len=0;len<csvRowsResuls.length;len++)
        {
            csvRowsResuls[len]['xaxis'] = Number(csvRowsResuls[len]['xaxis']);
            var bodyRec = csvRowsResuls[len];
            bodyRec['xaxis'] = Math.round((Number(bodyRec['xaxis']))); //(oldval*newwidth/oldwidth)
            bodyRec['yaxis'] = Math.round((Number(bodyRec['yaxis'])));
            bodyRec['xendaxis'] = Math.round((Number(bodyRec['xendaxis'])));
            bodyRec['yendaxis'] = Math.round((Number(bodyRec['yendaxis'])));
            csvRowsResuls[len] = bodyRec;
        }

        vm.mapData = csvRowsResuls;
        vm.resetMap(csvRowsResuls);
    });

    $('#verborgen_file').hide();
    $('#uploadButton').on('click', function () {
        $('#verborgen_file').click();
    });

    $('#verborgen_file').change(function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
            $('#pf_foto').css('background-image', 'url("' + reader.result + '")');
        }
        if (file) {
            reader.readAsDataURL(file);
        } else {
        }
    });


    //vm.reset();

}

