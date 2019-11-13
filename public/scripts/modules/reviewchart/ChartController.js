'use strict';
angular
    .module('ideotics')
    .controller('ChartController', ChartController);

ChartController.$inject = ['$scope','$timeout','$filter','$rootScope','$location','$localStorage','EventService'];

function ChartController($scope,$timeout,$filter,$rootScope, $location, $localStorage,EventService) {

    var vm = this;
    vm.currentVideo = EventService.getSelectedVideo();
    vm.videoId = vm.currentVideo.videoId;
    var dataObjects = [];
    var genderChart = {videoId:vm.videoId,columnName:'Gender'};
    var groupChart = {videoId:vm.videoId,columnName:'Groups'};
    var ageChart = {videoId:vm.videoId,columnName:'Age'};
    var dressChart = {videoId:vm.videoId,columnName:'Dress'};

    vm.getReportByInputObj = function (headerToDisplay,renderId,inputObj) {
        EventService.getEventsByVideoAggregation(inputObj)
            .success(function(data, status) {
                drawFusionChart("Gender Break-up","chart-container-Gender",data.Gender);
                drawFusionChart("Groups","chart-container-AgeGroup",data.Groups);
                drawFusionChart("AGE-WISE BREAK-UP","chart-container-AgewiseBreakup",data.Age);
                drawFusionChart("DRESSING","chart-container-Dress",data.Dress);
                //if(data && data.length>0)
                //{
                    /*console.log(data)
                    dataObjects = [];
                    for(var len=0;len<data.length;len++)
                    {
                        var valObj = {label:data[len].name,value:String(data[len].count)}
                        dataObjects.push(valObj)
                    }
                    drawFusionChart(headerToDisplay,renderId,dataObjects);*/
                //}
            }).error(function(err, status) {
            console.log(err);
            console.log(status);
        });
    }

    vm.getReportByInputObj("Gender Break-up","chart-container-Gender",genderChart);
    //vm.getReportByInputObj("Groups","chart-container-AgeGroup",groupChart)
    //vm.getReportByInputObj("AGE-WISE BREAK-UP","chart-container-AgewiseBreakup",ageChart)
    //vm.getReportByInputObj("DRESSING","chart-container-Dress",dressChart)

    var ageGroupChart = '';
    function  drawFusionChart(headerToDisplay,renderId,displayData) {
        FusionCharts.ready(function () {
            ageGroupChart = new FusionCharts({
                type: 'pie3d',
                renderAt: renderId,
                width: '100%',
                height: '300',
                dataFormat: 'json',
                dataSource: {
                    "chart": {
                        "caption": headerToDisplay,
                        "subCaption": "",
                        "paletteColors": "#0075c2,#1aaf5d,#f2c500,#f45b00,#8e0000",
                        "bgColor": "#ffffff",
                        "showBorder": "0",
                        "use3DLighting": "0",
                        "showShadow": "0",
                        "enableSmartLabels": "0",
                        "startingAngle": "0",
                        "showPercentValues": "1",
                        "showPercentInTooltip": "0",
                        "decimals": "1",
                        "captionFontSize": "14",
                        "subcaptionFontSize": "14",
                        "subcaptionFontBold": "0",
                        "toolTipColor": "#ffffff",
                        "toolTipBorderThickness": "0",
                        "toolTipBgColor": "#000000",
                        "toolTipBgAlpha": "80",
                        "toolTipBorderRadius": "2",
                        "toolTipPadding": "5",
                        "showHoverEffect":"1",
                        "showLegend": "1",
                        "legendBgColor": "#ffffff",
                        "legendBorderAlpha": '0',
                        "legendShadow": '0',
                        "legendItemFontSize": '10',
                        "legendItemFontColor": '#666666'
                    },
                    "data":displayData
                }
            }).render();
        });
    }


    /*$(function () {

        // Make monochrome colors and set them as default for all pies
        Highcharts.getOptions().plotOptions.pie.colors = (function () {
            var colors = [],
                base = Highcharts.getOptions().colors[0],
                i;

            for (i = 0; i < 10; i += 1) {
                // Start out with a darkened base color (negative brighten), and end
                // up with a much brighter color
                colors.push(Highcharts.Color(base).brighten((i - 3) / 7).get());
            }
            return colors;
        }());

        // Build the chart
        Highcharts.chart('container', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: 'Browser market shares at a specific website, 2014'
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                        }
                    }
                }
            },
            series: [{
                name: 'Brands',
                data: [
                    { name: 'Microsoft Internet Explorer', y: 56.33 },
                    { name: 'Chrome', y: 24.03 },
                    { name: 'Firefox', y: 10.38 },
                    { name: 'Safari', y: 4.77 },
                    { name: 'Opera', y: 0.91 },
                    { name: 'Proprietary or Undetectable', y: 0.2 }
                ]
            }]
        });
    });*/
};
