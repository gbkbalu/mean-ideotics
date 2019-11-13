'use strict';
Date.locale = {
    month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    date_fix_short: ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th', 'st'],
    date_Time_short:['12:00 AM','01:00 AM','02:00 AM','03:00 AM','04:00 AM','05:00 AM','06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM','09:00 PM','10:00 PM','11:00 PM']
};


function getDateTimeWithOutConverting(dateFormatStr)
{
    var dateNow = new Date();
    var _userOffset = dateNow.getTimezoneOffset()*60*1000;

    var dateTimeObj = new Date(dateFormatStr);
    dateTimeObj = new Date(dateTimeObj.getTime() + _userOffset);

    return dateTimeObj;
}

function getDateTimeWithConverting(dateFormatStr)
{
    var dateNow = new Date();
    var _userOffset = dateNow.getTimezoneOffset()*60*1000;

    var dateTimeObj = new Date(dateFormatStr);
    dateTimeObj = new Date(dateTimeObj.getTime() - _userOffset);

    return dateTimeObj;
}

var formatTimeAMOrPM = function(date)
{
    var hours = date.getHours();
    var minutes = addZero(date.getMinutes());
    var seconds = addZero(date.getSeconds());
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    var strTime = addZero(hours) + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return String(i);
}

function getAvailableFrmOrToDtFrmt(dateFrmtStr)
{
    //var frmDate = getDateTimeWithConverting(dateFrmtStr);
    var frmDate = new Date(dateFrmtStr);

    var availableFromDateTime = Date.locale.month_names_short[frmDate.getMonth()]+' '+frmDate.getDate()+Date.locale.date_fix_short[frmDate.getDate()-1]+' '+frmDate.getFullYear();
    //   +' @'+formatTimeAMOrPM(frmDate);

    availableFromDateTime = availableFromDateTime+' @'+formatTimeAMOrPM(frmDate);

    return availableFromDateTime;
}

var svc = angular.module('twoway.services', []);

svc.factory('helpers', function(appconstant) {

    var helpers = {

        watchersContainedIn: function(scope) {
            var watchers = (scope.$$watchers) ? scope.$$watchers.length : 0;
            var child = scope.$$childHead;
            while (child) {
                watchers += (child.$$watchers) ? child.$$watchers.length : 0;
                child = child.$$nextSibling;
            }
            return watchers;
        },

        randomGender: function() {
            return (Math.floor(Math.random() * 2) % 2 === 0) ? 'M' : 'F';
        },

        randomAge: function() {
            return Math.floor(Math.random() * 90) + 1;
        },

        randomName: function(length) {
            var nome = "";
            for (var i = 0; i < length; i++)
                nome += appconstant.letters.charAt(Math.floor(Math.random() * appconstant.letters.length));
            return nome;
        },

        randomUrl: function() {
            return (Math.floor(Math.random() * 2) % 2 === 0) ? 'http://www.' + (helpers.randomName(20) + '.' + helpers.randomName(2)).toLowerCase() : '';
        }
    }

    return helpers;
});

svc.constant('appconstant', {
    letters : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    
    avatars: {
        'M': 'http://howlstream.com/dist/images/icons/PNG/Dude.png',
        'F': 'http://howlstream.com/dist/images/icons/PNG/Girl.png'
    },

    ageColors: {
        average: {},
        minor: {
            'background-color': 'red',
            color: 'white'
        },
        senior: {
            'background-color': 'brown',
            color: 'yellow'
        },
    }
});

