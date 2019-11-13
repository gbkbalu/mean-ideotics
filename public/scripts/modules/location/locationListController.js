"use strict";
define(['application-configuration', 'dataGridService', 'locationService'], function (app) {
	app.register.controller('locationListController', ['$scope',  '$rootScope', '$location', 'dataGridService', 'locationService', 'APP_CONSTANTS', function ($scope,  $rootScope, $location, dataGridService, locationService, appConstants) {
		
		$scope.initializeController = function(){
			$rootScope.pageTitle = 'Location';
			$scope.displayLocationListPage=false;

            
			// Configure List Grid View
			dataGridService.initializeTableHeaders();
			
            dataGridService.addHeader("Location Code", "locationCode");
            dataGridService.addHeader("Location Name", "locationName");
            dataGridService.addHeader("Type", "locationType");
            dataGridService.addHeader("Action", "");
            
            $scope.tableHeaders = dataGridService.getTableHeaders();
            $scope.defaultSort = dataGridService.setDefaultSort("locationCode");
            
            $scope.changeSorting = function (sortProp) {
            	if(sortProp){
                    dataGridService.changeSorting(sortProp, $scope.defaultSort, $scope.tableHeaders);
                    
                    $scope.defaultSort = dataGridService.getSort();
                    $scope.SortDirection = dataGridService.getSortDirection();
                    $scope.SortExpression = dataGridService.getSortExpression();
                    $scope.CurrentPageNumber = 1;

                    $scope.actualSearchSubmission(true);
            	}
            };
            
            $scope.setSortIndicator = function (column) {
                return dataGridService.setSortIndicator(column, $scope.defaultSort);
            };
            
            $scope.resetLocationListSearchForm(false);
		};
		
		$scope.locationListSearchSubmit = function(){
			$scope.actualSearchSubmission(true);
		};
		
		 $scope.pageChanged = function () {
			 $scope.actualSearchSubmission(true);
         };
		 
		$scope.actualSearchSubmission = function(displayBlockMessage){
			locationService.fetchSearchLocationList($scope.createLocationSearchRequestObject(), $scope.handleLocationSearchResponse, $scope.handleLocationSearchResponseError, displayBlockMessage);
		};
		
		$scope.handleLocationSearchResponse = function(response, status){
			$scope.locationSearchResponseList = response.dataList;
			$scope.locationSearchListPaging = response.listProp;
			$scope.displayLocationListPage=true;
		};
		
		$scope.handleLocationSearchResponseError = function(){
			
		};
		
		$scope.resetLocationListSearchForm = function(displayBlockMessage){
			$scope.locationListSearch = new Object();
			$scope.locationSearchResponseList = [];
			
			$scope.PageSize = 10;
            $scope.SortDirection = "DESC";
            $scope.SortExpression = "locationCode";
            $scope.CurrentPageNumber = 1;
            
            $scope.actualSearchSubmission(displayBlockMessage ? true : false);
		};
		
		$scope.createLocationSearchRequestObject = function(){
			var locationSearch = $scope.locationListSearch;
			
			locationSearch.page = $scope.CurrentPageNumber;
			locationSearch.size = $scope.PageSize;
			if($scope.SortExpression){
				locationSearch.sortOrder=$scope.SortDirection;
				locationSearch.sortProperty=$scope.SortExpression;
			}
			
			return locationSearch;
		};
		
		  $scope.exportExcel = function(){
	        	var path = '';
	        	if($location.port()=='80'){
	        		path = $location.protocol()+ '://'+$location.host();
	        	}else {
	        		path = $location.protocol()+ '://'+$location.host()+':'+$location.port();
	        	}        	        	
	        		        	
	        	$scope.locationCode = $scope.locationListSearch.locationCode ? $scope.locationListSearch.locationCode : '';
	        	$scope.locationName = $scope.locationListSearch.locationName ? $scope.locationListSearch.locationName : '';
	        	
	        	window.open(path+appConstants.CONTEXT_PATH + "/excel/exportLocationList.htm?size="+$scope.locationSearchListPaging.totalRecords+"&sortProperty="+$scope.SortExpression+"&sortOrder="+$scope.SortDirection+"&locationCode="+$scope.locationCode+"&locationName="+$scope.locationName, "Report Excel", "");        	  				
	        };    

	}]);
});