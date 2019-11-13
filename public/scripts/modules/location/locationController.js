"use strict";
define(
		[ 'application-configuration', 'locationService', 'vocabularyService', 'modalService', 'userService', 'menuService', 'util'],
		function(app) {

			app.register
					.controller(
							'locationController',
							[
									'$scope',
									'$rootScope',
									'$routeParams',
									'$location',
									'locationService',
									'vocabularyService',
									'modalService',
									'userService',
									'menuService',
									'util',
									'APP_CONSTANTS',
									function($scope, $rootScope, $routeParams,
											$location, locationService, vocabularyService,
											modalService, userService, menuService, util, appConstants) {

										$scope.initializeController = function() {
											
											$scope.latitudeMin = -90;
										    $scope.latitudeMax = 90;
										    $scope.longitudeMin= -180;
										    $scope.longitudeMax= 180;
								
											$scope.initializeBusinessLocation();
											
											userService.authenticateUser($scope.handleGetSessionUserResponse, $scope.handleGetSessionUserErrorResponse);
											if (!$routeParams.locationCode) {

												$rootScope.pageTitle = appConstants.ADD_LOCATION_TITLE;
												$scope.pageDesc = 'This section allows you to add location information into Mi-Trace system.';
												
												$scope.readOnlyLocationCode = false;
												$scope.addLocationFlag = true;
												$scope.addLocation.email = $rootScope.sessionItems.userEmail;

											}
											else  {
												
												$rootScope.pageTitle = appConstants.EDIT_LOCATION_TITLE;	
												$scope.pageDesc = 'This section allows you to edit location information into Mi-Trace system.';
												
												$scope.readOnlyLocationCode = true;
												$scope.addLocationFlag = false;

												locationService
														.fetchBusinessLocation(
																{
																	"locationCode" : $routeParams.locationCode
																},
																$scope.handleSearchByLocationCodeResponse,
																$scope.handleSearchByLocationCodeErrorResponse);	
												
											};
										
										};
										
										
										$scope.initializeBusinessLocation = function() {
											
											$scope.addLocation = locationService.newEmptyLocation();
											$scope.readPoints = [];
											$scope.extensions = [];
											$scope.createdBy='';

																					
											// Fetch BusinessLocationType Vocabulary
											vocabularyService
													.fetchBizLocTypeVocList($scope.handleBusinessLocationTypeVoc, 
															$scope.handleBusinessLocationTypeVocError);
										};
										
										$scope.submitLocationInformation = function() {		
											delete $scope.addLocation.extensions;
											$scope.addLocation.extensions = new Array();
											
											if($scope.extensions)
								            {												
												angular.forEach($scope.extensions, function (value, key) {  
													if(value.attribute.toUpperCase() != appConstants.MODIFIED_BY &&
								         			   value.attribute.toUpperCase() != appConstants.CREATED_BY){									         			  
														$scope.addLocation.extensions.push({
								         				  attribute: value.attribute.toUpperCase(),
								         				  value: value.value
								    	              });						         			  
													}							         		  
													
								         	  });
								            }
											
											if($scope.addLocation.contactNumber)
											{        	
									        	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.slice(0,3) + "-" + $scope.addLocation.contactNumber.slice(3);
											}else{
												$scope.addLocation.contactNumber='';
											}
											
											if($scope.addLocationFlag){	
												$scope.submitLocation();
											}else{												
												$scope.editLocation();
											}
											
										};
										
										$scope.addReadPointsList = function() {

										    $scope.addLocation.readpoints = $scope.readPoints;
										    $scope.readPoints = [];
										    
										};
											
										$scope.submitLocation = function(){
									    if ($rootScope.sessionItems.userName) {
									    	$scope.addLocation.extensions.push({
						         				  attribute: appConstants.CREATED_BY,
						         				  value: $rootScope.sessionItems.userName
						    	              });			
									    }
									    
									    $scope.addReadPointsList();
									    
										locationService
												.createLocation(
														$scope.addLocation,
														$scope.handlecreateLocationResponse,
														$scope.handlecreateLocationErrorResponse);											
										};
										
										$scope.editLocation = function(){											
											var now=new Date();	
											$scope.addLocation.createdDate=now.toISOString();
											$scope.addLocation.modifiedDate=now.toISOString();
											
											if($scope.createdBy){
												$scope.addLocation.extensions.push({
							         				  attribute: appConstants.CREATED_BY,
							         				  value: $scope.createdBy
							    	              });						
											}
											
											if ($rootScope.sessionItems.userName) {
												$scope.addLocation.extensions.push({
							         				  attribute: appConstants.MODIFIED_BY,
							         				  value: $rootScope.sessionItems.userName
							    	              });			
								            }
											
											$scope.existingReadPoints=angular.copy($scope.addLocation.readpoints);											
											
											if(!$scope.addLocation.readpoints){
												$scope.addLocation.readpoints = [];
											}
											
											angular.forEach($scope.readPoints, function (value, key) {												
							        			$scope.addLocation.readpoints.push(value);
							        		});
											    
											locationService
											.updateLocation(
													$scope.addLocation,
													$scope.handleupdateLocationResponse,
													$scope.handleupdateLocationErrorResponse);
											
										};

										$scope.addNewReadPoint = function($event) {
											
											$scope.readPoints
													.push({readPoint : ''});
											$event.preventDefault();
																				
										};
										
										$scope.addExtensions = function($event){
											$scope.extensions.push({attribute:'',value:''});
										};

										$scope.resetLocationForm = function() {
											
											$scope.initializeController();
											return false;
										};

										$scope.handleBusinessLocationTypeVoc = function(
												response, status) {
											$scope.locationAddVocTypes = response.dataList;
										};

										$scope.handleBusinessLocationTypeVocError = function(
												response, status) {
										};
										
										$scope.handleGetSessionUserResponse = function(
												response, status) {
											if (response.status != 'SUCCESS') {
												$rootScope.authenticated = false;
												delete $rootScope.sessionItems;
												$rootScope.authMenuItems = menuService.getNoLoggedInAuthMenuItems();
								        		$rootScope.menuItems = menuService.getNoLoginMenuItems();
												$location.path('accounts/login');
											}
										};

										$scope.handleGetSessionUserErrorResponse = function(
												response, status) {
										};

										$scope.handlecreateLocationResponse = function(
												response) {
											if (response.status == 'SUCCESS') {
												var modalresult = modalService
														.showModal({}, {
																	headerText: 'Success',
																	bodyText: 'Added Location Successfully!!! \n'        
															});
												(modalresult.result).then(function(){
													$location.path(appConstants.LIST_LOCATION_PATH);
												});
												
											} else {
												$scope.readPoints = $scope.addLocation.readpoints;
												if($scope.addLocation.contactNumber)
												{
									            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
												}
												$scope.addLocation.errors = response.errors;
											}
										};
										
										$scope.handlecreateLocationErrorResponse = function(
												response) {
											$scope.readPoints = $scope.addLocation.readpoints;
											$scope.addLocation.readpoints=[];
											if($scope.addLocation.contactNumber)
											{
								            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
											}
										};

										$scope.handleSearchByLocationCodeResponse = function(response){	
											$scope.addLocation = response;
											angular.forEach(response.extensions, function(value, key){
								            	if(value.attribute == appConstants.CREATED_BY){
								            		$scope.createdBy = value.strValue?value.strValue:value.doubleValue?value.doubleValue:value.intValue?value.intValue:value.dateValue;
								            	}else if(value.attribute != appConstants.MODIFIED_BY){
								            		$scope.extensions.push(value);
								            	}
								            });
											util.setExtensionsInValue($scope.extensions);
											
											if($scope.addLocation.contactNumber)
											{
								            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
											}
										};
										
										$scope.handleSearchByLocationCodeErrorResponse = function(response){
											if($scope.addLocation.contactNumber)
											{
								            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
											}
										};
										
										
										$scope.handleupdateLocationResponse = function(
												response) {
											if (response.status == 'SUCCESS') {
												var modalresult = modalService
														.showModal(
																{},
																{
																	headerText : 'Success',
																	bodyText : 'Location Updated Successfully!'
																});
												(modalresult.result).then(function(){
																	$location
																			.path(appConstants.LIST_LOCATION_PATH);
																});
											} else {
												$scope.addLocation.readpoints=$scope.existingReadPoints;	
												$scope.addLocation.errors = response.errors;
												if($scope.addLocation.contactNumber)
												{
									            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
												}
											}
										};
																				
										$scope.handleupdateLocationErrorResponse = function(response){
											$scope.addLocation.readpoints=$scope.existingReadPoints;	
											if($scope.addLocation.contactNumber)
											{
								            	$scope.addLocation.contactNumber = $scope.addLocation.contactNumber.replace('-','');
											}
										};

									} ]);
		});