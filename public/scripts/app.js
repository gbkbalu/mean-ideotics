"use strict";
/// <reference path="../typings/tsd.d.ts" />

var errorType = { error: "error", success: "success" };
var app = angular.module('ideotics', ['twoway.services', 'abVideoWidget', 'ngRoute', 'ngStorage', 'ngCookies', 'xeditable', 'controllers', 'videoControllers', 'directives', 'ui.bootstrap',
    'angularFileUpload', 'anguFixedHeaderTable', 'ngLoadingSpinner', 'blockUI', 'btford.socket-io', 'flow', 'ngSanitize', 'ngCsv', '720kb.datepicker', 'ngTableToCsv', 'oc.lazyLoad', 'smart-table', "chart.js",
    'ui.grid', 'ui.grid.selection', 'ui.grid.exporter', 'ui.grid.resizeColumns', 'ui.grid.moveColumns', 'ui.grid.pagination', 'ui.grid.pinning', 'angularTrix', 'ui.grid.custom.rowSelection'
]);

routeConfig.$inject = ['$routeProvider', '$httpProvider', '$localStorageProvider'];
app.config(routeConfig);
//app.run(runFn);
var socket = '';

function routeConfig($routeProvider) {

    $routeProvider
        .when('/', {
            templateUrl: 'views/checkstatus/checkstatus.html',
            controller: 'CheckLoginStatusController',
            controllerAs: 'checkStatusVM',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/checkstatus/Checkstatuscontroller.js'
                        ]
                    });
                }]
            }
        })
        .when('/Login', {
            templateUrl: 'views/login/login.html',
            controller: 'LoginController',
            controllerAs: 'loginVM',
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/login/LoginController.js'
                        ]
                    });
                }]
            }
        })

    .when('/Home', {
        templateUrl: 'views/home/home.html',
        controller: 'HomeController',
        controllerAs: 'homeVM',
        data: {
            authorizedRoles: ['admin', 'reviewer', 'superreviewer']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/home/HomeController.js'
                    ]
                });
            }]
        }
    })

    .when('/helper', {
        templateUrl: 'views/helper/helper.html',
        controller: 'HelperController',
        controllerAs: 'helperVM',
        data: {
            authorizedRoles: ['admin']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/helper/HelperController.js'
                    ]
                });
            }]
        }
    })

    .when('/addOrEditHelper', {
        templateUrl: 'views/helper/addHelper.html',
        controller: 'AddHelperController',
        controllerAs: 'newHelperVm',
        data: {
            authorizedRoles: ['admin']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/helper/addHelperController.js'
                    ]
                });
            }]
        }
    })

    .when('/dashboard', {
        templateUrl: 'views/dashboard/dashboard.html',
        controller: 'DashboardController',
        controllerAs: 'dashVM',
        data: {
            authorizedRoles: ['admin', 'agent']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/dashboard/DashboardController.js'
                    ]
                });
            }]
        }
    })

    .when('/data', {
        templateUrl: 'views/data/data.html',
        controller: 'DataController',
        controllerAs: 'dataVM',
        data: {
            authorizedRoles: ['admin', 'agent']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/data/DataController.js'
                    ]
                });
            }]
        }
    })

    .when('/review', {
            templateUrl: 'views/review/dashboard.html',
            controller: 'ReviewController',
            controllerAs: 'dashVM',
            data: {
                authorizedRoles: ['admin', 'reviewer', 'superreviewer']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/review/DashboardController.js',
                            'js/fusioncharts.js',
                            'js/fusioncharts.charts.js'
                        ]
                    });
                }]
            }
        })
        .when('/team', {
            templateUrl: 'views/team/team.html',
            controller: 'TeamController',
            controllerAs: 'teamVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/team/TeamController.js'
                        ]
                    });
                }]
            }
        })
        .when('/addOrEditTeam', {
            templateUrl: 'views/team/addTeam.html',
            controller: 'AddTeamController',
            controllerAs: 'newTeamVm',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/team/addTeamController.js'
                        ]
                    });
                }]
            }
        })
        .when('/user', {
            templateUrl: 'views/user/user.html',
            controller: 'UserController',
            controllerAs: 'userVM',
            data: {
                authorizedRoles: ['admin', 'reviewer', 'superreviewer']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/user/UserController.js'
                        ]
                    });
                }]
            }
        })

    .when('/addOrEditUser', {
            templateUrl: 'views/user/addUser.html',
            controller: 'AddUserController',
            controllerAs: 'newUserVm',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/user/addUserController.js'
                        ]
                    });
                }]
            }
        })
        .when('/categories', {
            templateUrl: 'views/categories/categories.html',
            controller: 'CategoriesController',
            controllerAs: 'categVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/categories/CategoriesController.js'
                        ]
                    });
                }]
            }
        })
        .when('/tracking', {
            templateUrl: 'views/tracking/tracking.html',
            controller: 'TrackingController',
            controllerAs: 'trackingVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/tracking/TrackingController.js'
                        ]
                    });
                }]
            }
        })
        .when('/videos', {
            templateUrl: 'views/videos/videos.html',
            controller: 'VideoController',
            controllerAs: 'videoVM',
            data: {
                authorizedRoles: ['admin', 'reviewer', 'superreviewer']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/videos/VideoController.js'
                        ]
                    });
                }]
            }
        })
        .when('/addOrEditVideo', {
            templateUrl: 'views/videos/addVideo.html',
            controller: 'AddVideoController',
            controllerAs: 'newVideoVm',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/videos/addVideoController.js'
                        ]
                    });
                }]
            }
        })
        .when('/clietUploadVideos', {
            templateUrl: 'views/clientuploadedvideos/clientuploadedvideos.html',
            controller: 'ClientUploadedVideosController',
            controllerAs: 'videoVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/clientuploadedvideos/ClientUploadedVideosController.js'
                        ]
                    });
                }]
            }
        })

    .when('/usersession', {
            templateUrl: 'views/usersession/usersession.html',
            controller: 'UserSessionController',
            controllerAs: 'userSessionVM',
            data: {
                authorizedRoles: ['admin', 'reviewer', 'superreviewer']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/usersession/UserSessionController.js'
                        ]
                    });
                }]
            }
        })
        .when('/projects', {
            templateUrl: 'views/projects/projects.html',
            controller: 'ProjectsController',
            controllerAs: 'projectVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/projects/ProjectController.js'
                        ]
                    });
                }]
            }
        })

    .when('/addOrEditClient', {
        templateUrl: 'views/projects/addProject.html',
        controller: 'AddProjectController',
        controllerAs: 'newClientVm',
        data: {
            authorizedRoles: ['admin']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/projects/addProjectController.js'
                    ]
                });
            }]
        }
    })

    .when('/addOrEditIp', {
            templateUrl: 'views/ipconfig/addIp.html',
            controller: 'AddIpController',
            controllerAs: 'newIptVm',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/ipconfig/addIpController.js'
                        ]
                    });
                }]
            }
        })
        .when('/ips', {
            templateUrl: 'views/ipconfig/ip.html',
            controller: 'IPController',
            controllerAs: 'ipVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/ipconfig/IpController.js'
                        ]
                    });
                }]
            }
        })
        .when('/cameras', {
            templateUrl: 'views/cameras/cameras.html',
            controller: 'CamerasController',
            controllerAs: 'cameraVM',
            data: {
                authorizedRoles: ['admin', 'reviewer', 'superreviewer']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/cameras/CamerasController.js'
                        ]
                    });
                }]
            }
        })

    .when('/addOrEditCamera', {
        templateUrl: 'views/cameras/addCamera.html',
        controller: 'AddCameraController',
        controllerAs: 'newCameraVm',
        data: {
            authorizedRoles: ['admin']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/cameras/addCameraController.js'
                    ]
                });
            }]
        }
    })

    .when('/awsupload', {
        templateUrl: 'views/awsupload/awsupload.html',
        controller: 'UploadController',
        //controllerAs: 'cameraVM',
        data: {
            authorizedRoles: ['admin', 'client']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/awsupload/AwsUploadController.js'
                    ]
                });
            }]
        }
    })

    .when('/videoAnalysis', {
        templateUrl: 'views/analysis/analysis.html',
        controller: 'AnalysisController',
        controllerAs: 'dashVM',
        data: {
            authorizedRoles: ['admin', 'reviewer']
        },
        resolve: {
            deps: ['$ocLazyLoad', function($ocLazyLoad) {
                return $ocLazyLoad.load({
                    files: [
                        //TODO add all the required css and js
                        'scripts/modules/analysis/AnalysisController.js'
                    ]
                });
            }]
        }
    })

    .when('/heatmap', {
            templateUrl: 'views/heatmap/heatmap.html',
            controller: 'HeatMapController',
            controllerAs: 'heatMapVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'js/heatmap.min.js',
                            'scripts/modules/heatmap/heatmap.js'
                        ]
                    });
                }]
            }
        })
        .when('/charts', {
            templateUrl: 'views/reviewchart/charts.html',
            controller: 'ChartController',
            controllerAs: 'chartVM',
            data: {
                authorizedRoles: ['admin']
            },
            resolve: {
                deps: ['$ocLazyLoad', function($ocLazyLoad) {
                    return $ocLazyLoad.load({
                        files: [
                            //TODO add all the required css and js
                            'scripts/modules/reviewchart/ChartController.js'
                        ]
                    });
                }]
            }
        })
        .otherwise({
            redirectTo: '/'
        });

}

/*
runFn.$inject = ['$rootScope', 'AuthService', 'editableOptions', '$http','$location'];
function runFn($rootScope, AuthService, editableOptions,$http,$location) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'

    $rootScope.$on('$routeChangeStart', routeChangeStart);

    function routeChangeStart(event, next) {

        var authorizedRoles = [];

        if(next.data === null || typeof next.data === 'undefined') {
            return;
        }

        authorizedRoles = next.data.authorizedRoles;

        if(!AuthService.isAuthorized(authorizedRoles)) {
            event.preventDefault();

            if(AuthService.isAuthenticated()) {
                // User is not authorised but authenticated
                showNotificationMessage('Not authorised to access it, But logged in.',errorType.error);
                //$location.path('/Login');

            } else {
                // User is not logged in
                console.log('User not logged in');
                $rootScope.clearSessionAndOpenLogin();
            }
        }
    }
}
*/

app.config(function($provide, $httpProvider) {
    $provide.factory('MyHttpInterceptor', function($q, $localStorage, $rootScope, $location) {
        return {
            request: function(config) {
                config.headers = config.headers || {};
                if ($localStorage.token) {
                    config.headers.Authorization = 'Bearer ' + $localStorage.token;
                }
                return config || $q.when(config);
            },

            requestError: function(rejection) {
                return $q.reject(rejection);
            },

            response: function(response) {
                return response || $q.when(response);
            },

            responseError: function(rejection) {
                if (rejection.status && rejection.status === 500) {
                    showNotificationMessage("Internal Server Error 500! Please report it to admin with screen shot! Kindly explain the issue when did you got this issue.");
                } else if (rejection.status && rejection.status === 401) {
                    $rootScope.clearSessionAndOpenLogin();
                } else if (rejection.status && rejection.status === 403) {
                    showNotificationMessage("You are not authorized person to access it.Please report it to admin.");
                }
                return $q.reject(rejection);
            }
        };
    });
    $httpProvider.interceptors.push('MyHttpInterceptor');
});
app.config(function(blockUIConfigProvider) {
    // Change the default overlay message
    blockUIConfigProvider.message("executing...");

    // Change the default delay to 100ms before the blocking is visible
    blockUIConfigProvider.delay(100);

    // Disable automatically blocking of the user interface
    blockUIConfigProvider.autoBlock(false);
})
app.config(['ChartJsProvider', function(ChartJsProvider) {
    // Configure all charts
    ChartJsProvider.setOptions({
        chartColors: ['#green', '#red'],
        responsive: true
    });
    // Configure all line charts
    ChartJsProvider.setOptions('line', {
        showLines: false
    });
}])
app.config(['flowFactoryProvider', function(flowFactoryProvider) {
    flowFactoryProvider.defaults = {
        target: 'uploads',
        permanentErrors: [404, 500, 501],
        maxChunkRetries: 1,
        chunkRetryInterval: 5000,
        simultaneousUploads: 4
    };
    flowFactoryProvider.on('catchAll', function(event) {});
}])

//idle session timeout(logout)
app.run(function($rootScope, $timeout, $document, $http, $localStorage, socket, $cookies, HelperService, AuthService, $location, $interval) {
    var socketIO = socket.connectSockect();
    socketIO.emit('connected', true);
    socketIO.on('welcome', function(data) {
        $rootScope.socketConnected(data);
    });

    $rootScope.socketConnected = function() {
        socketIO.emit('connected', { sessionId: $http.defaults.headers.common.session_id });
    }

    $rootScope.sendMessageToAll = function(title, messageTxt) {
        socketIO.emit('sendMessageT0All', { sessionId: $http.defaults.headers.common.session_id, title: title, message: messageTxt });
    }

    $interval(function() {
        var sessionId = $http.defaults.headers.common.session_id;
        if (sessionId != null && sessionId != undefined) {
            socketIO.emit('connected', { sessionId: $http.defaults.headers.common.session_id });
        }
    }, 30000);

    socketIO.on('receiveMessage', function(data) {
        $.sweetModal({
            title: data.title,
            content: data.message
        });
    });

    socketIO.on('logoutAll', function(data) {
        $timeout(function() {
            location.reload();
        }, 5000);
        AuthService.clearAllSessions();
        $rootScope.logout();
        $location.path('/Login');
    });

    if ($localStorage.user !== undefined && $localStorage.user !== null && $localStorage.user.role) {
        $rootScope.cookieMinutes = 20;
        if ($localStorage.user.role === 'client') {
            $rootScope.cookieMinutes = 60;
        } else if ($localStorage.user.role === 'agent') {
            $rootScope.cookieMinutes = 5;
        }

        $rootScope.TimeOutTimerValue = $rootScope.cookieMinutes * 60 * 1000;
    }

    // Start a timeout
    var TimeOut_Thread = $timeout(function() { LogoutByTimer() }, $rootScope.TimeOutTimerValue);
    var bodyElement = angular.element($document);

    angular.forEach(['keydown', 'keyup', 'click', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'scroll', 'focus'],
        function(EventName) {
            bodyElement.bind(EventName, function(e) { TimeOut_Resetter(e) });
        });

    function LogoutByTimer() {
        if ($localStorage.id !== undefined && $localStorage.id !== null && $localStorage.id !== '') {
            $rootScope.logout();
        }
    }

    function TimeOut_Resetter(e) {
        /// Stop the pending timeout
        $timeout.cancel(TimeOut_Thread);
        /// Reset the timeout
        TimeOut_Thread = $timeout(function() { LogoutByTimer() }, $rootScope.TimeOutTimerValue);
        if (isVaulueValid($localStorage.id) && isVaulueValid($localStorage.user)) {
            $rootScope.setCookie("userObject", $localStorage.user, $rootScope.cookieMinutes);
        }
    }

    $rootScope.globals = {
        user: $localStorage.user
    };

    $rootScope.tabs = [];
    $rootScope.uniqueTabArr = [];

    $rootScope.screenWidth = window.screen.width;
    $rootScope.screenHeight = window.screen.height;

    $rootScope.headerMenuSelected = 0;
    $rootScope.headerTitle = 'Dashboard';
    $rootScope.uirefer = 'Dashboard';
    $rootScope.helperCode = 'Analysis';
    $rootScope.setHelpModalTitleAndCode = function() {
        $rootScope.screenWidth = window.screen.width;
        $rootScope.screenHeight = window.screen.height;

        if ($rootScope.screenWidth !== 1366 || $rootScope.screenHeight !== 768) {
            // toastr.error("Please change resolution to 1366*768", 'Done');
            // showNotificationMessage("Please change resolution to 1366*768");
            // return;
        }

        if ($rootScope.headerMenuSelected == 0) {
            $rootScope.helpModalTitle = "About Analysis Panel.";
            $rootScope.helperCode = 'Analysis';
            $rootScope.headerTitle = 'Analysis';
            $rootScope.uirefer = 'dashboard';

        } else if ($rootScope.headerMenuSelected == 1) {
            $rootScope.helpModalTitle = "About Users Panel.";
            $rootScope.helperCode = 'Users';
            $rootScope.headerTitle = 'Users';
            $rootScope.uirefer = 'user';
        } else if ($rootScope.headerMenuSelected == 2) {
            $rootScope.helpModalTitle = "About Parameters Panel.";
            $rootScope.helperCode = 'Parameters';
            $rootScope.headerTitle = 'Parameters';
            $rootScope.uirefer = 'categories';
        } else if ($rootScope.headerMenuSelected == 3) {
            $rootScope.helpModalTitle = "About Projects Panel.";
            $rootScope.helperCode = 'Projects';
            $rootScope.headerTitle = 'Projects';
            $rootScope.uirefer = 'projects';
        } else if ($rootScope.headerMenuSelected == 4) {
            $rootScope.helpModalTitle = "About Cameras Panel.";
            $rootScope.helperCode = 'Cameras';
            $rootScope.headerTitle = 'Cameras';
            $rootScope.uirefer = 'cameras';

        } else if ($rootScope.headerMenuSelected == 5) {
            $rootScope.helpModalTitle = "About Videos Panel.";
            $rootScope.helperCode = 'Videos';
            $rootScope.headerTitle = 'Videos';
            $rootScope.uirefer = 'videos';
        } else if ($rootScope.headerMenuSelected == 6) {
            $rootScope.helpModalTitle = "About User Sessions Panel.";
            $rootScope.helperCode = 'Sessions';
            $rootScope.headerTitle = 'Sessions';
            $rootScope.uirefer = 'usersession';
        } else if ($rootScope.headerMenuSelected == 8) {
            $rootScope.helpModalTitle = "About Client Videos Panel.";
            $rootScope.helpBodyContent = "About Client Videos Panel Help."
            $rootScope.headerTitle = 'Dashboard';
        } else if ($rootScope.headerMenuSelected == 11) {
            $rootScope.helpModalTitle = "About Ip Config Panel.";
            $rootScope.helperCode = 'IpConfig';
            $rootScope.headerTitle = 'IpConfig';
            $rootScope.uirefer = 'ips';
        } else if ($rootScope.headerMenuSelected == 13) {
            $rootScope.helpModalTitle = "About Review Panel.";
            $rootScope.helperCode = 'Review';
            $rootScope.headerTitle = 'Review';
            $rootScope.uirefer = 'review';
        } else if ($rootScope.headerMenuSelected == 15) {
            $rootScope.helpModalTitle = "About Team Panel.";
            $rootScope.helperCode = 'Teams';
            $rootScope.headerTitle = 'Teams';
            $rootScope.uirefer = 'team';
        } else if ($rootScope.headerMenuSelected == 16) {
            $rootScope.helpModalTitle = "About Dashboard Panel.";
            $rootScope.helperCode = 'Dashboard';
            $rootScope.headerTitle = 'Dashboard';
            $rootScope.uirefer = 'Home';
        } else if ($rootScope.headerMenuSelected == 17) {
            $rootScope.helpModalTitle = "About Helper Panel.";
            $rootScope.helperCode = 'Helper';
            $rootScope.headerTitle = 'Helper';
            $rootScope.uirefer = 'helper';
        } else if ($rootScope.headerMenuSelected == 18) {
            $rootScope.helpModalTitle = "About HeatMap Panel.";
            $rootScope.helperCode = 'HeatMap';
            $rootScope.headerTitle = 'HeatMap';
            $rootScope.uirefer = 'heatmap';
        } else if ($rootScope.headerMenuSelected == 19) {
            $rootScope.helpModalTitle = "About Tracking Panel.";
            $rootScope.helperCode = 'Tracking';
            $rootScope.headerTitle = 'Tracking';
            $rootScope.uirefer = 'tracking';
        }

        var tabObject = {
            helpModalTitle: $rootScope.helpModalTitle,
            helperCode: $rootScope.helperCode,
            headerTitle: $rootScope.headerTitle,
            uirefer: $rootScope.uirefer,
            headerMenuSelected: $rootScope.headerMenuSelected
        }

        addDashboardTabObject();
        if ($rootScope.uniqueTabArr.indexOf($rootScope.headerMenuSelected) < 0) {
            $rootScope.uniqueTabArr.push($rootScope.headerMenuSelected);
            tabObject.headerMinTitle = tabObject.headerTitle.substr(0, 5);
            $rootScope.tabs.push(angular.copy(tabObject));
        }
    }

    function addDashboardTabObject() {
        if ($rootScope.globals && $rootScope.globals != null && $rootScope.globals != undefined) {
            var user = $rootScope.globals.user;
            if (user && user.role && user.role === 'admin') {
                if ($rootScope.uniqueTabArr.indexOf(16) < 0) {
                    var dashboardTab = {
                        headerMenuSelected: 16,
                        helpModalTitle: "About Dashboard Panel.",
                        helperCode: 'Dashboard',
                        headerTitle: 'Dashboard',
                        headerMinTitle: 'Dashb',
                        uirefer: 'Home'
                    }

                    $rootScope.uniqueTabArr.push(16);
                    $rootScope.tabs.push(angular.copy(dashboardTab));
                }
            }
        }
    }

    $rootScope.removeTab = function(headerMenuSelectedId) {
        var tabIndex = $rootScope.uniqueTabArr.indexOf(headerMenuSelectedId);
        if (tabIndex >= 0 && $rootScope.uniqueTabArr.length > 1) {
            if ((headerMenuSelectedId == 2 || headerMenuSelectedId == 19) && $rootScope.isUpdated) {
                $rootScope.askForConfirmation();
            } else {
                $rootScope.uniqueTabArr.splice(tabIndex, 1);
                var currentLen = 0;
                for (var len = 0; len < $rootScope.tabs.length; len++) {
                    if (headerMenuSelectedId == $rootScope.tabs[len].headerMenuSelected) {
                        currentLen = len;
                        $rootScope.tabs.splice(len, 1);
                        break;
                    }
                }

                if ($rootScope.uniqueTabArr.length > 1 && currentLen > 0) {
                    $rootScope.setHeaderAndChangePage($rootScope.tabs[currentLen - 1].headerMenuSelected);
                } else {
                    $rootScope.openPageByUserRole($rootScope.globals.user);
                }
            }
        }
    }

    $rootScope.openPageByUserRole = function(user) {
        if (user && user.role && user.role === 'client') {
            $rootScope.setHeaderglobal(10);
            $location.path('/awsupload');
        } else if (user && user.role && (user.role === 'reviewer' || user.role === 'superreviewer')) {
            $rootScope.setHeaderglobal(16);
            $location.path('/Home');
        } else if (user && user.role && user.role === 'admin') {
            $rootScope.setHeaderglobal(16);
            $location.path('/Home');
        } else if (user && user.role && user.role === 'agent') {
            $rootScope.setHeaderglobal(0);
            $location.path('/dashboard');
        }
    }

    $rootScope.openIdeoticsNewTab = function() {
        var win = window.open("http://www.ideotics.com", '_blank');
        win.focus();
    }

    $rootScope.setHeaderAndChangePage = function(selectedValue) {
        if ($rootScope.checkIsLoggedIn()) {
            if (($rootScope.headerMenuSelected == 2 || $rootScope.headerMenuSelected == 19) && $rootScope.isUpdated) {
                $rootScope.askForConfirmation();
            } else {
                HelperService.getHelperDataService();
                $rootScope.headerMenuSelected = selectedValue;
                $rootScope.setHelpModalTitleAndCode();
                $location.path('/' + $rootScope.uirefer);
            }
        } else {
            AuthService.clearSessionAndCookie();
        }
    }

    $rootScope.askForConfirmation = function() {
        swal({
                title: "Are you sure?",
                text: "You will not be able to recover these changes! Please save changes before changing.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, change it!",
                closeOnConfirm: true
            },
            function() {
                $rootScope.isUpdated = false;
            });
    }

    $rootScope.setHeaderglobal = function(selectedValue) {
        if ($rootScope.checkIsLoggedIn()) {
            HelperService.getHelperDataService();
            $rootScope.headerMenuSelected = selectedValue;
            $rootScope.setHelpModalTitleAndCode();
        } else {
            AuthService.clearSessionAndCookie();
        }
    }

    $rootScope.openHelpModal = function() {
        $rootScope.helpModalTitle = "About Users Panel.";
        $rootScope.helpBodyContent = "About Users Panel Help."
        $rootScope.setHelpModalTitleAndCode();
        $rootScope.helpBodyContent = HelperService.getHelperTextByCode($rootScope.helperCode);

        /*$('#helpModal').modal('show',{
         backdrop: true,
         keyboard: false
         });*/

        $.sweetModal({
            title: $rootScope.helpModalTitle,
            content: $rootScope.helpBodyContent
        });
    }

    $rootScope.hideHelpModal = function() {
        $('#helpModal').modal('hide');
    }

    $rootScope.checkIsLoggedIn = function() {
        var sessionObject = $cookies.get("userObject");
        if (isVaulueValid(sessionObject)) {
            return true;
        }
        return false;
    }

})

app.controller('ApplicationController', ApplicationController);

ApplicationController.$inject = ['$http', '$scope', '$cookies', '$window', '$localStorage', '$rootScope', 'USER_ROLES', 'AuthService', '$location', '$timeout', 'blockUI', 'HelperService'];

function ApplicationController($http, $scope, $cookies, $window, $localStorage, $rootScope, USER_ROLES, AuthService, $location, $timeout, blockUI, HelperService) {
    $rootScope.innerHeightTable = "height:" + ($window.innerHeight - 200) + "px;";

    $rootScope.gridHeightTable = "height:" + ($window.innerHeight - 150) + "px;";

    $rootScope.videoInnerHeightTable = "height:" + ($window.innerHeight - 200) + "px;margin-bottom:0px;";

    $rootScope.globals = {
        user: $localStorage.user
    };

    $rootScope.setCookie = function(key, value, minutes) {
        var now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        $cookies.put("userObject", JSON.stringify($localStorage.user), {
            expires: now
        });
    }

    $rootScope.getCookie = function(inputKey) {
        var keyVal = $cookies.get(inputKey);

        if (isVaulueValid(keyVal)) {
            return JSON.parse(keyVal);
        }
        return '';
    }

    function checkIsLoggedIn() {
        var sessionObject = $cookies.get("userObject");
        if (isVaulueValid(sessionObject)) {
            return true;
        }
        return false;
    }

    $rootScope.$on('$routeChangeStart', routeChangeStart);

    function routeChangeStart(event, next) {

        var authorizedRoles = [];

        if (next.data === null || typeof next.data === 'undefined') {
            return;
        }

        authorizedRoles = next.data.authorizedRoles;
        if (!checkIsLoggedIn()) {
            AuthService.clearSessionAndCookie();
        } else if (!AuthService.isAuthorized(authorizedRoles)) {
            event.preventDefault();

            if (AuthService.isAuthenticated()) {
                // User is not authorised but authenticated
                showNotificationMessage('Not authorised to access it, But logged in.', errorType.error);
                //$location.path('/Login');

            } else {
                // User is not logged in
                console.log('User not logged in');
                AuthService.clearSessionAndCookie();
            }
        }
    }

    $rootScope.loadingAndBlockUI = function(loadingMessage) {
        blockUI.start(loadingMessage);
    }

    $rootScope.stopLoadingBlockUI = function() {
        $timeout(function() {
            blockUI.stop();
        }, 1000);
    }


    $http.defaults.headers.common.session_id = $localStorage.id;

    $rootScope.clearAllCookies = function() {
        var cookies = $cookies.getAll();
        angular.forEach(cookies, function(v, k) {
            $cookies.remove(k);
        });
    }

    $rootScope.clearSessionAndOpenLogin = function() {
        $rootScope = $rootScope.$new(true);
        $scope = $scope.$new(true);

        $localStorage.id = null;
        $localStorage.role = null;
        $localStorage.user = null;
        $rootScope.TimeOutTimerValue = 20 * 60 * 1000;

        var cookies = $cookies.getAll();
        angular.forEach(cookies, function(v, k) {
            $cookies.remove(k);
        });

        $location.path('/Login');
    }

    $rootScope.logout = function() {
        AuthService
            .logout()
            .then(function(data, status) {
                return true;
            }, function(err, status) {});
    }

    $rootScope.sortColumn = 'camerasId';
    $rootScope.reverseSort = false;
    $rootScope.sortData = function(column) {
        $rootScope.reverseSort = ($rootScope.sortColumn === column) ? !$rootScope.reverseSort : false;
        $rootScope.sortColumn = column;
    }

    $rootScope.getSortClass = function(column) {
        if ($rootScope.sortColumn === column) {
            return $rootScope.reverseSort ? 'arrow-down' : 'arrow-up';
        }
        return '';
    }

    $rootScope.setSortColumnAndOrder = function(column, order) {
        $rootScope.sortColumn = column;
        $rootScope.reverseSort = order;
    }

}
angular.module('ideotics').factory('socket', function(socketFactory) {
    var socketIO = {};
    return {
        getSocket: function() {
            return socketIO;
        },
        connectSockect: function() {
            var ioSocket = io.connect({
                path: '/socket.io-client'
            });
            var socket = socketFactory({
                ioSocket: ioSocket
            });
            socketIO = socket;
            return socket;
        }
    };
})

angular.module('ideotics').config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
}]);

angular.module('ideotics')
    .constant('USER_ROLES', {
        all: '*',
        admin: 'admin',
        agent: 'agent',
        client: 'client',
        reviewer: 'reviewer'
    });

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true && JSON.stringify(obj) === JSON.stringify({});
}

var setUndefinedToEmpty = function(data) {
    var keysObj = Object.keys(data);
    for (var len = 0; len < keysObj.length; len++) {
        if (data[keysObj[len]] === undefined || data[keysObj[len]] === null) {
            data[keysObj[len]] = '';
        }
    }
    return data;
}

var isVaulueValid = function(nameValue) {
    if (nameValue === undefined || nameValue === null || nameValue === 'undefined' || nameValue === '') {
        return false;
    }
    return true;
}

var showNotificationMessage = function(message, type) {
    sweetAlert("Oops...", message, type);
}

var confirmationMessage = function(message) {
    swal({
            title: "Are you sure?",
            text: "You will not be able to recover this imaginary file!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        },
        function() {
            swal("Deleted!", "Your imaginary file has been deleted.", "success");
        });
}