'use strict';
angular
    .module('ideotics')
    .controller('LoginController', LoginController);

LoginController.$inject = ['$localStorage', '$rootScope', 'AuthService'];
function LoginController($localStorage, $rootScope, AuthService) {
    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.headerMenuSelected = 0;
    $rootScope.setHeaderglobal(50);
    var vm = this;

    vm.error = {
        hasError: false,
        msg: ''
    };

    vm.credentials = {username:'admin@ideotics.com',password:'Adm1n789&'};
    vm.userCreds ={userName:false,password:false};

    vm.login = login;
    function login(obj) {

        clearError();
        console.log(obj);
        if(validate())
        {
            AuthService
                .login(obj)
                .then(function(user) {
                    $rootScope.tabs = [];
                    $rootScope.uniqueTabArr = [];
                    $rootScope.globals = {user: user};
                    $localStorage.user = user;

                    $rootScope.currentLoggedInUserId = user.userId;

                    $rootScope.cookieMinutes = 20;
                    if(user && user.role)
                    {
                        $rootScope.cookieMinutes = 20;
                        if(user.role === 'client')
                        {
                            $rootScope.cookieMinutes = 60;
                        }

                        $rootScope.TimeOutTimerValue = $rootScope.cookieMinutes*60*1000;
                    }
                    $rootScope.setCookie("userObject", user, $rootScope.cookieMinutes);
                    $rootScope.socketConnected();
                    $rootScope.openPageByUserRole(user);
                },
                function(err) {
                    setError(err.data ? err.data.error: '');
                });
        }else
        {
            vm.error.hasError = true;
            if(vm.userCreds.userName && vm.userCreds.password)
                vm.error.msg = 'Please Enter Valid UserName And Password.';
            else if(!vm.userCreds.userName)
                vm.error.msg = 'Please Enter Valid UserName.';
            else
                vm.error.msg = 'Please Enter Valid Password.';
        }
    }
    //login(vm.credentials);

    function validate()
    {
        vm.userCreds ={userName:false,password:false};
        if(isVaulueValid(vm.credentials.username))
        {
            vm.credentials.username = vm.credentials.username.trim();
            if((vm.credentials.username).length>0)
            {
                vm.userCreds.userName=true;
            }
        }

        if(isVaulueValid(vm.credentials.password))
        {
            vm.credentials.password = vm.credentials.password.trim();
            if((vm.credentials.password).length>0)
            {
                vm.userCreds.password=true;
            }
        }

        if(vm.userCreds.username && vm.userCreds.password)
        {
            return false;
        }

        return true;
    }

    function clearError() {
        vm.error.hasError = false;
        vm.error.msg = '';
    }

    function setError(msg) {
        vm.error.hasError = true;
        msg.length > 0 ? (msg = msg) : (msg = 'Unable to reach the server. Contact administrator.');
        vm.error.msg = msg;
    }

};
