"use strict";
var videoElement, options, CCTV;
var videoElementInstance = document.getElementById('video');
var videoRelativeContainer = document.createElement('div');
var node = document.createElement('div');
var moveObject = new Object();
$(document).ready(function() {
    function deleteObject(obj) {
        $(obj).parent().remove();
    }
});
var offsetX = 0;
var offsetY = 0;
var height = 100;
var width = 50;
var userFirstTimeOpen = true;
angular
    .module('ideotics')
    .controller('DashboardController', DashboardController);

DashboardController.$inject = ['$scope', '$compile', '$interval', '$timeout', '$rootScope', '$location', '$localStorage', 'VideoService', 'CategoryService', 'EventService', 'DataService', 'AuthService', 'SubCategoryService', 'IconsService', 'AwsService'];

function DashboardController($scope, $compile, $interval, $timeout, $rootScope, $location, $localStorage, VideoService, CategoryService, EventService, DataService, AuthService, SubCategoryService, IconsService, AwsService) {

    // window.dashboard === false, terminate polling
    window.dashboard = true;
    $rootScope.setHeaderglobal(0);

    var vm = this;

    vm.frame_rate = 50;
    vm.sub_frame_rate = 5;

    vm.metaDataObj = { GFPS: vm.frame_rate };
    vm.comments = '';
    vm.isProfileStaffSelected = false;
    vm.isDashBorard = true;
    var shopperCount = 0;
    var pausedVideoId = 0;
    var pausedVideo = {};
    var shopperNamePrefix = 'Shopper-';
    var categories = ['START', 'SHOPPERPROFILE', 'SKUBEHAVIOUR', 'STAFFPROFILE', 'G-STAFFBEHAVIOUR', 'S-STAFFBEHAVIOUR', 'C-STAFFBEHAVIOUR'];
    var catCodesList = ['START', 'SHOPPERPROFILE', 'SKUBEHAVIOUR', 'STAFFPROFILE', 'G-STAFFBEHAVIOUR', 'S-STAFFBEHAVIOUR', 'C-STAFFBEHAVIOUR'];
    vm.codesList = ['START', 'SHOPPERPROFILE', 'SKUBEHAVIOUR', 'STAFFPROFILE', 'G-STAFFBEHAVIOUR', 'S-STAFFBEHAVIOUR', 'C-STAFFBEHAVIOUR'];
    ///////////////////////////////////////////////////////////////////
    vm.current_target = -1;
    let svgns = "http://www.w3.org/2000/svg";

    let v_container = document.getElementById('video');
    let svg_container = document.getElementById("svg");

    /////////////////////////////////////////////////////////////////////
    var categoryStartTime = "";
    var startPolling = true;
    var categoriesLen = categories.length;

    var bucket = '';
    var isAwsCredExists = false;

    vm.currentFrameNo = 1;
    vm.playingVideoPosition = 0;

    vm.previousFrameNo = 1;
    vm.previousVideoPosition = 0;

    vm.pageNo = 0;
    vm.totalRecords = 0;
    vm.fetchData = true;
    vm.deleteOpt = false;

    vm['dupcategory'] = {};

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    vm.anim_delta = 1 / (vm.frame_rate / vm.sub_frame_rate); //* 0.8;

    vm.initVideo = function() { //called from ab-video

        v_container = document.getElementById('video');
        v_container.addEventListener('playing', playHandler, false);
        v_container.addEventListener('ended', endedHandler, false);
        v_container.addEventListener('pause', pausedHandler, false);
        v_container.addEventListener('seeked', seekedHandler, false);
        v_container.addEventListener('loadeddata', svgResizeHandler, false);
        window.onresize = svgResizeHandler;

        v_container.muted = true;

        setInterval(writeTimer, 200);
        setInterval(readTimer, 1000 * vm.anim_delta);
    }

    vm.initSVG = function() { //called from svg
        svg_container = document.getElementById("svg");
    }

    const getOffset = (el) => {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
        };
    }

    const svgResizeHandler = () => {
        let v = document.getElementById("video");
        let v_w = v.videoWidth;
        let v_h = v.videoHeight;
        let c_w = v.clientWidth;
        let c_h = v.clientHeight;
        let r_w;
        let r_h;

        let v_rate = v_h / v_w;
        let c_rate = c_h / c_w;
        console.log(v_rate, c_rate);

        if (v_rate < c_rate) {
            r_w = c_w;
            r_h = c_w * v_rate;
        } else {
            r_h = c_h;
            r_w = r_h / v_rate;
        }
        vm.svg_width = r_w;
        vm.svg_height = r_h;

        let v_panel = document.getElementById("v_panel");
        let v_panel_off = getOffset(v_panel);
        let v_off = getOffset(v)
            // let left_padding = (c_w - r_w) / 2;
            // let top_padding = (c_h - r_h) / 2;
        let left_padding = (c_w - r_w) / 2 + v_off.left - v_panel_off.left + 2.9;
        let top_padding = (c_h - r_h) / 2 + v_off.top - v_panel_off.top + 2.9;

        console.log("v_offset", v_off.left, v_off.top);
        console.log(v_w, v_h, c_w, c_h, r_w, r_h);
        console.log("padding", left_padding, top_padding);

        let s = document.getElementById("svg");
        let styleStr = "position: absolute;"
        styleStr += "top:" + parseInt(top_padding) + "px; left:" + parseInt(left_padding) + "px;";
        styleStr += "width:" + parseInt(r_w) + "px; height:" + parseInt(r_h) + "px; pointer-events: none;"
        s.setAttribute("style", styleStr);
    }

    const playHandler = () => {
        if (v_container.paused)
            return;

        vm.v_width = v_container.videoWidth;
        vm.v_height = v_container.videoHeight;

        $rootScope.isTracking = true;
    }

    const endedHandler = (e) => {
        $rootScope.isTracking = false;
    }

    const pausedHandler = (e) => {
        $rootScope.isTracking = false;
    }

    const seekedHandler = (e) => {

        resetCtlInfo();

        if (v_container.paused)
            $rootScope.isTracking = false;
        else
            $rootScope.isTracking = true;

        if (v_container.currentTime == parseInt(vm.mediaPlayerApi.properties.duration())) {
            vm.mediaPlayerApi.controls.changePosition(0);
        }
    }

    vm.tmp_arr = [];

    function removeAllObjects() {
        while (svg_container.firstChild) {
            svg_container.firstChild.remove();
        }
    }

    async function readTimer() {
        readModule()
    }

    function readModule() {

        if (vm.v_width == 0 || vm.v_height == 0) {
            console.log("v_width, v_height = ", vm.v_width, vm.v_height);
            return;
        }

        let cur_time = v_container.currentTime;
        let cur_frame_no = Math.round(cur_time * vm.frame_rate);

        // console.log("cur_time, cur_frame_no ================================ ", cur_time, cur_frame_no);

        let datas = ReadBuff(cur_frame_no);
        if (datas == false) {
            return;
        }

        let cur_data = datas[0];
        let nxt_data = datas[1];

        // remove cash
        for (let ti in vm.tmp_arr) {
            let tv = vm.tmp_arr[ti];
            vm.removeCash(tv.id);
        }

        for (let st_key in cur_data.objects) {
            let st_val = cur_data.objects[st_key];
            let ed_val = nxt_data.objects[st_key];

            let st_px = (st_val.x1 + st_val.x2) / 2;
            let st_py = (st_val.y1 + st_val.y2) / 2; // middle center
            // let st_py = st_val.y1 - 20; // top center

            let ed_px;
            let ed_py;

            if (ed_val) {
                ed_px = (ed_val.x1 + ed_val.x2) / 2;
                ed_py = (ed_val.y1 + ed_val.y2) / 2; // midddle center
                // ed_py = ed_val.y1 - 20; // top center

                st_px = Math.round(st_px * vm.svg_width / vm.v_width);
                st_py = Math.round(st_py * vm.svg_height / vm.v_height);
                ed_px = Math.round(ed_px * vm.svg_width / vm.v_width);
                ed_py = Math.round(ed_py * vm.svg_height / vm.v_height);

                if (!isNaN(st_px) && !isNaN(st_py))
                    vm.drawRectMark(st_val, st_px, st_py, ed_px, ed_py);
            }
            if (!ed_val || isNaN(st_px) || isNaN(st_py)) {
                vm.removeCash(st_val.id);
            }
        }
        vm.tmp_arr = cur_data.objects;
    }

    vm.removeCash = function(idx) {
        let g_element = document.getElementById("g_unit_" + idx);
        if (g_element)
            try {
                g_element.parentNode.removeChild(g_element);
            } catch (e) {
                console.log("remove g_element exp...", e.toString);
            }
    }

    vm.buff_size = 500;
    vm.buff_st = 0;
    vm.buff_ed = 0;
    vm.buff_request_size = vm.frame_rate;
    vm.frame_buff = new Array(vm.buff_size);
    vm.can_request = true;

    function resetCtlInfo() {
        vm.can_request = true;
        removeAllObjects();
        resetBuff();
    }

    function resetBuff() {
        vm.buff_st = 0;
        vm.buff_ed = 0;
    }

    function isBuffEmpty() {
        if (vm.buff_st == vm.buff_ed)
            return true;
        return false;
    }

    function getBuffLastElement() {
        let cur = vm.buff_ed - 1;
        if (cur == -1)
            cur = vm.buff_size - 1;
        return vm.frame_buff[cur];
    }

    function isWritable() {
        let cur_num = ((vm.buff_ed + vm.buff_size) - vm.buff_st) % vm.buff_size;
        let need_num = vm.buff_size - cur_num;
        if (need_num >= vm.buff_request_size)
            return true;
        return false;
    }

    function pushBuffDatas(datas, status) {
        for (let i = 0; i < datas.length; i++) {
            let data = datas[i];
            if (vm.currentVideo.videoId != datas[i].video_id)
                continue;
            vm.frame_buff[vm.buff_ed++] = data;

            if (vm.buff_ed == vm.buff_size)
                vm.buff_ed = 0;
        }
        vm.can_request = true;
    }

    function removeBuff(frameno) {
        while (!isBuffEmpty()) {
            if (vm.frame_buff[vm.buff_st].frame_id < frameno) {
                vm.buff_st++;
                if (vm.buff_st == vm.buff_size)
                    vm.buff_st = 0;
            } else
                break;
        }
    }

    vm.empty_cnt = 0;

    function ReadBuff(frameno) {
        console.log("frame_no, st, ed", frameno, vm.buff_st, vm.buff_ed);
        removeBuff(frameno);
        if (isBuffEmpty()) {
            vm.empty_cnt++;
            return false;
        }
        let buff_next = vm.buff_st + 1;
        if (buff_next == vm.buff_size)
            buff_next = 0;
        if (buff_next == vm.buff_ed)
            return false;
        let ret_arr = [vm.frame_buff[vm.buff_st], vm.frame_buff[buff_next]];
        return ret_arr;
    }

    async function writeTimer() {
        await writeModule();
    }

    function writeModule() {
        if (!vm.can_request)
            return;
        vm.can_request = false;
        let cur_time = Math.round(vm.mediaPlayerApi.properties.currentTime());
        let cur_frame_no = Math.round(vm.mediaPlayerApi.properties.currentTime() * vm.frame_rate);
        if (isBuffEmpty()) {
            let frame_no = cur_frame_no;
            DataService
                .getEventListByVideo(vm.currentVideo.videoId, frame_no, vm.buff_request_size)
                .success(pushBuffDatas);
        } else if (isWritable()) {
            let last_element = getBuffLastElement();
            let last_frame_no = last_element.frame_id;
            let frame_no = Math.max(last_frame_no + 1, cur_frame_no);
            DataService
                .getEventListByVideo(vm.currentVideo.videoId, frame_no, vm.buff_request_size)
                .success(pushBuffDatas);
        } else {
            vm.can_request = true;
        }
    }

    $scope.class_filter = ["class", "speed", "accuracy", "actions", "express", "gender", "age", "LPR"]
    $scope.selection = ["speed", "accuracy"];
    $scope.toggleSelection = function toggleSelection(item) {
        let idx = $scope.selection.indexOf(item);
        if (idx > -1) {
            $scope.selection.splice(idx, 1);
        } else {
            $scope.selection.push(item);
        }
        console.log($scope.selection);
    };

    vm.target_timer = 0;

    vm.drawRectMark = function(item, st_px, st_py, ed_px, ed_py) {

            if (!$rootScope.isTracking)
                return;

            if (vm.current_target != -1 && vm.current_target != item.id) //track specific object
                return;

            if (vm.target_timer > 0 && v_container.currentTime > vm.target_timer) { // track specific time range
                vm.mediaPlayerApi.controls.pause();
                vm.target_timer = 0;
            }

            let obj_idx = item.id;

            let obj_key = "obj_" + obj_idx;
            let obj_lbl = "lbl_" + obj_idx;
            let obj_cl = "cl_" + obj_idx;

            if (!svg_container)
                return;

            let g_unit = document.getElementById("g_unit_" + obj_idx);
            if (!g_unit) {
                g_unit = document.createElementNS(svgns, "g");
                g_unit.setAttribute("id", "g_unit_" + obj_idx);
                g_unit.setAttribute("style", "opacity:0.8");
                g_unit.setAttribute("transform", "translate(" + st_px + " " + st_py + ")");

                svg_container.appendChild(g_unit);
            }

            let player = document.getElementById(obj_key);
            if (!player) {
                player = document.createElementNS(svgns, 'text');
                player.setAttribute("id", obj_key);
                player.textContent = "IIIIIIIIIIII";
                player.setAttribute("x", 20);
                player.setAttribute("y", -25);
                player.setAttribute("style", "fill:#ea220b; stroke:#ea220b; stroke-width:0.8em");
                player.setAttribute("font-size", 23);

                g_unit.appendChild(player);
            }

            let player_cl = document.getElementById(obj_cl);
            if (!player_cl) {
                player_cl = document.createElementNS(svgns, 'line');
                player_cl.setAttribute("id", obj_cl);
                player_cl.setAttribute("style", "stroke:#ea220b; stroke-width: 2");

                player_cl.setAttribute("x1", 0);
                player_cl.setAttribute("y1", 0);
                player_cl.setAttribute("x2", 17);
                player_cl.setAttribute("y2", -20);

                g_unit.appendChild(player_cl);
            }

            let player_lbl = document.getElementById(obj_lbl);
            if (!player_lbl) {

                player_lbl = document.createElementNS(svgns, 'text');
                player_lbl.setAttribute("id", obj_lbl);
                player_lbl.setAttribute("fill", "white");
                player_lbl.setAttribute("font-size", 14);

                player_lbl.setAttribute('x', 15);
                player_lbl.setAttribute('y', -47);

                let tcar = document.createElementNS(svgns, 'tspan');
                tcar.textContent = obj_idx + ":" + item["classification"];
                tcar.setAttribute("x", 17);
                tcar.setAttribute("dy", 10);
                player_lbl.appendChild(tcar);

                g_unit.appendChild(player_lbl);

            }

            let speed_acc = false;
            // make obj info text
            for (let idx = 0; idx < $scope.selection.length; idx++) {
                let key = $scope.selection[idx];

                if (key == "class")
                    continue;

                let val = item[key];

                if (key == "accuracy" || key == "speed") {
                    if (!speed_acc) {
                        let speed = item["speed"];
                        let acc = item["accuracy"];

                        acc = parseInt(acc);
                        acc += "%";

                        speed += "km/h";

                        val = speed + "(" + acc + ")";
                        speed_acc = true;
                    } else {
                        continue;
                    }
                }

                let tspan_id = "props_" + obj_idx + "_" + key;

                let tspan = document.getElementById(tspan_id);
                if (!tspan) {
                    tspan = document.createElementNS(svgns, 'tspan');
                    tspan.setAttribute("id", tspan_id);
                    tspan.setAttribute("x", 17);
                    tspan.setAttribute("dy", 15);
                    player_lbl.appendChild(tspan);
                }
                tspan.textContent = val;
            }

            let animation = document.createElementNS(svgns, "animateTransform");

            animation.setAttribute("from", st_px + " " + st_py);
            animation.setAttribute("to", ed_px + " " + ed_py);

            animation.setAttribute("attributeType", "XML");
            animation.setAttribute("attributeName", "transform");
            animation.setAttribute("type", "translate");
            animation.setAttribute("calcMode", "paced");
            animation.setAttribute("repeatCount", 1);

            vm.anim_delta = 1 / (vm.frame_rate / vm.sub_frame_rate); //* 0.8;

            animation.setAttribute("dur", "" + vm.anim_delta + "s");
            animation.setAttribute("fill", "freeze");
            animation.setAttribute("id", "animation_" + obj_idx);

            let previous_animation = document.getElementById("animation_" + obj_idx);
            if (previous_animation) {
                try {
                    g_unit.removeChild(previous_animation);
                } catch (e) {
                    console.log("pre_ani_remove_exp...", e.toString());
                }
            }
            g_unit.appendChild(animation);
            document.getElementById("svg").setCurrentTime(0);
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    vm.showMore = function() {
        for (var len = vm.events.length - 1; len >= 0; len--) {
            var element = vm.events[len];
            if (element.startTime == vm.playingVideoPosition && element.frameno == vm.currentFrameNo) {
                vm.events.splice(len, 1);
            }
        }

        sortEvents();

        angular.forEach(vm.drawnObjs, function(value, key) {
            vm.drawnObjs[key].remove();
        });

        vm.deleteOpt = false;
        EventService
            .getAllShoppersByStartTime({ startTime: vm.playingVideoPosition, videoId: vm.selectedVideoId, isDiscarded: 0, frameno: vm.currentFrameNo })
            .success(function(data, status) {
                if (data && data.length > 0) {
                    vm.events = data.concat(vm.events);
                    for (var lenCount = 0; lenCount < data.length; lenCount++) {
                        vm.deleteOpt = false;
                        vm.selectedEventInEventsList(lenCount);
                    }
                    vm.deleteOpt = true;
                    vm.selectedEventInEventsList(0, data[0]);
                    vm.gridOptions.data = vm.events;
                }

            }).error(function(err, status) {
                console.log(err);
            });
    }

    function sortEvents() {
        vm.events.sort(function(ev1, ev2) {
            var a = parseInt(ev1['frameno']);
            var b = parseInt(ev2['frameno']);

            if (a == b) {
                a = parseInt(ev1['eventId']);
                b = parseInt(ev2['eventId']);
            }

            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1
            }
            return 0;
        });
    }

    vm.selectedVideoRate = '1.0';
    vm.changeSpeedOfVideo = function(value) {
        if (Number(vm.selectedVideoRate) + Number(value) == 0) {
            vm.selectedVideoRate = 0.25;
            var video = document.getElementById('video').playbackRate = vm.selectedVideoRate;
        } else if ((Number(vm.selectedVideoRate) + Number(value)) == 0.75) {
            vm.selectedVideoRate = Number(0.50);
            var video = document.getElementById('video').playbackRate = vm.selectedVideoRate;
        } else if (Number(vm.selectedVideoRate) + Number(value) <= 5 && Number(vm.selectedVideoRate) + Number(value) >= 0.5) {
            vm.selectedVideoRate = Number(vm.selectedVideoRate) + Number(value);
            var video = document.getElementById('video').playbackRate = vm.selectedVideoRate;
        }

    }

    vm.getSignedUrl = function(keyValue) {
        var params = { Bucket: $scope.creds.bucket, Key: keyValue, Expires: 7200 };
        var url = bucket.getSignedUrl('getObject', params, function(err, url) {
            if (url) console.log("The URL is", url);
            return url;
        });
    }

    vm.getFileContent = function() {
        var params = {
            Bucket: $scope.creds.bucket,
            Key: 'Ideocap/videotimetest/videoformat.txt'
        };
        bucket.getObject(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response

            var str = String.fromCharCode.apply(null, data.Body);
            console.log(str)
        });
    }


    vm.project = '';
    vm.currentSelectedVideo = '';
    vm.requiredCats = [];
    vm.fetchedCatsList = categories;
    vm.categoriesDataList = [];
    vm.catListWithCodeAndRepeat = [];

    $rootScope.showCameraImage = function() {
        vm.imageUrl = "https://images-na.ssl-images-amazon.com/images/I/51M0E6J290L._SL1000_.jpg";
        if (isVaulueValid(vm.currentSelectedVideo.camera) && isVaulueValid(vm.currentSelectedVideo.camera.camImageUrl)) {
            vm.imageUrl = vm.currentSelectedVideo.camera.camImageUrl;
        }

        $('#popupCameraImage').modal('show', {
            backdrop: true,
            keyboard: false
        });
    }

    $rootScope.showSettingDlg = function() {

        $('#popupSettingDlg').modal('show', {
            backdrop: true,
            keyboard: false
        });
    }

    vm.getCategoriesListByProject = function(video) {
            vm.fetchedCatsList = [];
            vm.currentSelectedVideo = video;
            if (video.project) {
                vm.project = video.project;
                CategoryService
                //.getCategoriesListByProject(video.project._id)
                    .getCategoriesListByFilter({ camera: video.camera._id, isHidden: false })
                    .success(function(data, status) {
                        //vm.categoriesDataList = (data);
                        categories = [];
                        for (var len = 0; len < data.length; len++) {
                            if (data[len].isHidden == false && data[len].isMandatory == true) {
                                vm.requiredCats.push(data[len].category);
                            }
                            if (data[len].isHidden == false) {
                                vm.fetchedCatsList.push(data[len].category);
                                vm.categoriesDataList.push(data[len]);
                                categories.push(data[len].catcode);
                                vm.catListWithCodeAndRepeat.push({ category: data[len].category, isrepeats: data[len].isrepeats, catcode: data[len].catcode, shoporemp: data[len].shoporemp })
                            }
                        }
                        categoriesLen = categories.length;
                    }).error(function(err, status) {});
            }
        }
        /*CategoryService
            .getCategoriesList()
            .success(function(data, status) {
                vm.categoriesDataList = (data);
            }).error(function(err, status) {
            });*/

    vm.analysing = false;
    vm.eventCreated = false;
    vm.submitForm = false;
    vm.hasError = false;
    vm.analysisFinished = false;

    vm.events = [];
    vm.types = {};
    vm.videos = [];
    vm.currentVideo = {
        videoId: null
    };

    vm.selectedEvent = [];

    vm.event = {};

    vm.currentCategory = '';

    vm.flag = {
        dataEntry: false
    };

    vm.header = {
        controls: true,
        tabs: {
            users: true,
            analysis: true,
            review: true
        }
    };

    vm.category = {

    };

    vm.openVideo = openVideo;
    vm.createEvent = createEvent;
    vm.createNewEvent = shopperProfile
    vm.closeDataEntry = closeDataEntry;
    vm.saveCategory = saveCategory;
    vm.submitEvent = submitEvent;
    vm.submitVideo = submitVideo;
    vm.unlockAllVideos = unlockAllVideos;
    vm.pauseAnalysis = pauseAnalysis;
    vm.onInputChange = onInputChange;
    vm.onInputClick = onInputClick;
    //vm.logout = logout;
    vm.selectedEventInEventsList = selectedEventInEventsList;
    vm.selectedHumanInHumanList = selectedHumanInHumanList;
    vm.deleteDataEntry = deleteSelectedEvent;

    vm.mediaPlayerApi = {};
    vm.selectedEventIndex = '';

    // Init
    getUnlockVideos();

    getTypes();

    //pausedVideoId = $localStorage.user.pausedVideoId;

    vm.selectedCurrCategory = false;

    var previousIndex = '';
    vm.discardRetain = 'Discard';

    vm.addNewShopper = function() {
        if (this.divObj != null && this.divObj != undefined) {
            //this.divObj.remove();
        }
        vm.mediaPlayerApi.controls.pause();
        offsetX = 0;
        offsetY = 0;
        height = 100;
        width = 50;
        vm.isNewShopper = true;
        vm.comments = '';
        vm.isProfileStaffSelected = false;
        vm.isShopperAlreadyIn = false;

        vm.event = {};
        vm.currentEventID = 'new';
        vm.event.frameno = vm.currentFrameNo;
        vm.event.humanid = 'new';

        resetAllDrawnBoxes();
        vm.deleteOpt = true;
        vm.showSelectedEventOnTopOfVideo(true);

        vm['dupcategory'] = {};
        vm.createNewEvent(categories[0]);
    }

    var forwardDuration = 0;
    var currentVideoPositiion = 0;
    vm.forwardVideo = function(forward) {
        removeAllDrawnBoxes();

        vm.closeDataEntry();
        vm.mediaPlayerApi.controls.play();
        forwardDuration = pausedVideo.camera.forwardDuration;
        var totalVideoTime = vm.mediaPlayerApi.properties.duration();
        currentVideoPositiion = vm.mediaPlayerApi.properties.currentTime();
        vm.mediaPlayerApi.controls.pause();

        vm.previousFrameNo = vm.currentFrameNo;
        vm.previousVideoPosition = vm.playingVideoPosition;

        if (forwardDuration == null || forwardDuration == undefined || forwardDuration == 0) {
            forwardDuration = 1;
        }

        if (forward == 1 && totalVideoTime >= currentVideoPositiion && totalVideoTime >= (currentVideoPositiion + forwardDuration)) {
            vm.mediaPlayerApi.controls.play();
            currentVideoPositiion = Number(currentVideoPositiion + forwardDuration);

            if (forwardDuration != 0 && (currentVideoPositiion % forwardDuration) != 0) {
                currentVideoPositiion = currentVideoPositiion - (currentVideoPositiion % forwardDuration);
            }
            vm.mediaPlayerApi.controls.changePosition(currentVideoPositiion);
            vm.mediaPlayerApi.controls.pause();
            vm.currentFrameNo = (currentVideoPositiion * vm.metaDataObj.GFPS) + 1;
            vm.playingVideoPosition = currentVideoPositiion;
        } else if (forward == -1 && currentVideoPositiion > 0 && currentVideoPositiion >= (currentVideoPositiion - forwardDuration)) {
            vm.mediaPlayerApi.controls.play();
            currentVideoPositiion = Number(currentVideoPositiion - forwardDuration);
            if (forwardDuration != 0 && (currentVideoPositiion % forwardDuration) != 0) {
                currentVideoPositiion = currentVideoPositiion - (currentVideoPositiion % forwardDuration);
            }
            vm.mediaPlayerApi.controls.changePosition(currentVideoPositiion);
            vm.mediaPlayerApi.controls.pause();

            vm.currentFrameNo = (currentVideoPositiion * vm.metaDataObj.GFPS) + 1;
            vm.playingVideoPosition = currentVideoPositiion;
        }
        vm.showMore();
    }

    function selectedHumanInHumanList(index, event) {
        $('#eventsList').scrollTop(0);
        if (event != null && event != undefined) {
            if (vm.currentFrameNo != event.frameno) {
                removeAllDrawnBoxes();
                vm.playingVideoPosition = event.startTime;
                vm.mediaPlayerApi.controls.changePosition(event.startTime);
                vm.previousFrameNo = vm.currentFrameNo;
                vm.currentFrameNo = event.frameno;
                vm.current_target = event.eventId;
                vm.target_timer = event.endTime;
                vm.showMore();
            } else {
                resetAllDrawnBoxes();
                vm.deleteOpt = true;
                selectedEventInEventsList(index, event);
            }
        }
        $timeout(() => {
            svgResizeHandler();
        }, 100);

    }

    //triggers the function when event was selected .. video moves to perticular position
    function selectedEventInEventsList(index, currentEvent) {
        offsetX = 0;
        offsetY = 0;
        vm.comments = '';
        vm.discardRetain = 'Discard';

        node.innerHTML = '';
        vm['dupcategory'] = {};
        node.setAttribute('style', '');
        vm.isProfileStaffSelected = false;
        vm.isShopperAlreadyIn = false;
        var nextElement = document.getElementById('event' + index);
        if (nextElement !== null && nextElement !== undefined) {
            for (var eveLen = 0; eveLen < vm.events.length; eveLen++) {
                vm.events[eveLen].background = "";
                vm.events[eveLen].color = "";

                if (currentEvent != null && currentEvent != undefined && currentEvent.frameno == vm.events[eveLen].frameno) {
                    vm.events[eveLen].background = "lightcyan";
                    vm.events[eveLen].color = "border-style: ridge;border-color: yellow";
                    if (currentEvent.analysis != null || currentEvent.analysis != undefined) {
                        var markedCats = Object.keys(currentEvent.analysis);
                        var shopper = currentEvent.analysis[categories[0]];
                        shopper.ShopperORStaff = currentEvent.shopperorstaff;

                        if (shopper.ShopperORStaff == 'SHOPPER' && shopper.Shopper != undefined && (shopper.Shopper).substr(0, 3) != 'NEW') {
                            vm.events[eveLen].color = "border-style: ridge;border-color: blue";
                        } else if (shopper.ShopperORStaff == 'STAFF' && shopper.Staff != undefined && (shopper.Staff).substr(0, 3) != 'NEW') {
                            vm.events[eveLen].color = "border-style: ridge;border-color: blue";
                        } else if (markedCats.indexOf(categories[2]) > -1 || markedCats.indexOf(categories[4]) > -1 || markedCats.indexOf(categories[5]) > -1 || markedCats.indexOf(categories[6]) > -1) {
                            vm.events[eveLen].color = "border-style: solid;border-color: red";
                        } else if (markedCats.indexOf(categories[1]) > -1 || markedCats.indexOf(categories[3]) > -1) {
                            vm.events[eveLen].color = "border-style: solid;border-color: green";
                        }
                    }
                }
            }

            if (currentEvent != null && currentEvent != undefined) {
                currentEvent.background = "lightblue";
            }
            previousIndex = index;

            vm.selectedCurrCategory = true;

            vm.selectedEventIndex = index;
            vm.selectedEvent = angular.copy([vm.events[index]]);
            vm.originalSelectedEvent = angular.copy([vm.events[index]]);

            vm.event = vm.events[index];

            if (vm.event.isDiscarded != null && vm.event.isDiscarded != undefined && vm.event.isDiscarded == 1) {
                vm.discardRetain = 'Retain';
            }

            if (vm.event.analysis) {
                for (var catsLen = 0; catsLen < categories.length; catsLen++) {
                    if (vm.event.analysis[categories[catsLen]]) {
                        vm['dupcategory'][vm.fetchedCatsList[catsLen]] = vm.event.analysis[categories[catsLen]];
                    }
                }
            }

            vm.eventCreated = true;
            var startTime = vm.event.startTime;
            if (vm.event && vm.event.frameno) {
                startTime = vm.event.frameno / vm.metaDataObj.GFPS;
                startTime = startTime.toFixed(2);
            }

            vm.mediaPlayerApi.controls.changePosition(startTime);

            if (isVaulueValid(vm.event.comments)) {
                vm.comments = vm.event.comments;
            }
            height = 100;
            width = 50;
            vm.drawRectangularBoxOverShopper();
        }
    }

    vm.drawRectangularBoxOverShopper = function() {
        if (vm.selectedEvent && vm.selectedEvent.length > 0) {
            vm.selectedEvent[0]['xaxis'] = Math.round((Number(vm.selectedEvent[0]['xaxis']) * Number($("#video").innerWidth())) / Number(vm.selectedEvent[0].playingWidth)); //(oldval*newwidth/oldwidth)
            vm.selectedEvent[0]['yaxis'] = Math.round((Number(vm.selectedEvent[0]['yaxis']) * Number($("#video").innerHeight())) / Number(vm.selectedEvent[0].playingHeight));
            vm.selectedEvent[0]['xendaxis'] = Math.round((Number(vm.selectedEvent[0]['xendaxis']) * Number($("#video").innerWidth())) / Number(vm.selectedEvent[0].playingWidth));
            vm.selectedEvent[0]['yendaxis'] = Math.round((Number(vm.selectedEvent[0]['yendaxis']) * Number($("#video").innerHeight())) / Number(vm.selectedEvent[0].playingHeight));

            vm.selectedEvent[0].width = vm.selectedEvent[0]['xendaxis'] - vm.selectedEvent[0]['xaxis'];
            vm.selectedEvent[0].height = vm.selectedEvent[0]['yendaxis'] - vm.selectedEvent[0]['yaxis'];
            if (vm.selectedEvent[0].height && vm.selectedEvent[0].width) {
                vm.selectedEvent[0].height = Number(vm.selectedEvent[0].height);
                vm.selectedEvent[0].width = Number(vm.selectedEvent[0].width);

                height = Math.round(vm.selectedEvent[0].height);
                width = Math.round(vm.selectedEvent[0].width);
            }

            if (vm.selectedEvent[0].xaxis >= 0 && vm.selectedEvent[0].yaxis >= 0) {
                vm.selectedEvent[0].xaxis = Number(vm.selectedEvent[0].xaxis);
                vm.selectedEvent[0].yaxis = Number(vm.selectedEvent[0].yaxis);
                vm.selectedEvent[0].xendaxis = Number(vm.selectedEvent[0].xendaxis);
                vm.selectedEvent[0].yendaxis = Number(vm.selectedEvent[0].yendaxis);

                offsetX = (Math.round(vm.selectedEvent[0].xaxis));
                offsetY = (Math.round(vm.selectedEvent[0].yaxis));

                if (offsetX && offsetX >= 0 && offsetY && offsetY >= 0) {
                    if (!vm.selectedEvent[0].playingWidth) {
                        vm.selectedEvent[0].playingWidth = Number($("#video").innerWidth())
                    }
                    if (!vm.selectedEvent[0].playingHeight) {
                        vm.selectedEvent[0].playingHeight = Number($("#video").innerHeight())
                    }
                    //offsetX = Math.round((Number(vm.selectedEvent[0].xaxis)/Number(vm.selectedEvent[0].playingWidth))*Number($("#video").innerWidth()));
                    //offsetY = Math.round((Number(vm.selectedEvent[0].yaxis)/Number(vm.selectedEvent[0].playingHeight))*Number($("#video").innerHeight()));
                }

                if (vm.selectedEvent[0].xaxis >= 0 && vm.selectedEvent[0].yaxis >= 0) {
                    vm.shopperDisplayingId = parseInt(vm.selectedEvent[0].name.split('-')[1]);
                    vm.showSelectedEventOnTopOfVideo(false);
                }
            }
        }

        if (vm.selectedEvent[0].analysis && vm.selectedEvent[0].analysis[categories[0]]) {
            var objEvent = vm.selectedEvent[0].analysis[categories[0]];
            if ((objEvent && objEvent['Staff Type'] && objEvent['Staff Type'].length > 0) || (objEvent && objEvent['If Staff: Select Type'] && objEvent['If Staff: Select Type'].length > 0)) {
                vm.isProfileStaffSelected = true;
            }

            if (objEvent && objEvent['If Shopper, Select:'] && objEvent['If Shopper, Select:'].length > 0 && objEvent['If Shopper, Select:'] == 'ALREADY IN') {
                vm.isShopperAlreadyIn = true;
            }
        }
    }

    function getUnlockVideos() {

        var userId = $localStorage.user.userId;
        var pausedTime = $localStorage.user.pausedVideoTime || 0;
        VideoService
            .getUnlockedVideos(userId)
            .success(function(data, status) {
                $rootScope.stopLoadingBlockUI();
                vm.videos = data;
                vm.analysing = false;
                if (vm.videos.length > 0) {
                    vm.videos.forEach(function(element) {
                        if (element.status === 1) {
                            window.dashboard = false;
                            pausedVideo = element;
                            pausedVideoId = element.videoId;
                            vm.analysing = true;

                            vm.mediaPlayerApi.controls.pause();

                            openVideo(pausedVideo, true, pausedTime, true);
                        }
                    });
                } else {
                    vm.videosNoneMsg = 'Videos List Empty';
                }
            }).error(function(err, status) {

            });
    }

    function unlockAllVideos() {

        delete $localStorage.user.pausedVideoTime;
        delete $localStorage.user.pausedVideoId;

        pausedVideoId = 0;

        VideoService
            .unlockAllVideos()
            .success(function(data, status) {
                getUnlockVideos();

                vm.mediaPlayerApi.controls.changeSource("", false);
                vm.currentVideo = {};

                vm.analysing = false;

                shopperCount = shopperCount | 0;
                vm.event = {};
                vm.events = [];
                vm.form = {};

                vm.eventCreated = false;
                vm.closeDataEntry();
            }).error(function(err, status) {

            });
    }

    function shopperProfile(categoryType) {
        vm['dupcategory'] = {};
        vm.eventCreated = false;
        vm.comments = '';
        vm.selectedEvent = [];
        vm.event = {};
        createEvent(categoryType);
    }

    var isAnotherSKU = '';

    vm.subCategoriesList = [];
    vm.editedFlag = false;

    function createEvent(categoryType, editedFlag) {

        vm.editedFlag = editedFlag;

        vm.startDate = new Date();
        clearAndSetInterval(true);
        vm.mediaPlayerApi.controls.pause();

        vm.selectedCurrCategory = false;
        if (categoryType === catCodesList[1] && vm.selectedEvent.length > 0) {
            vm.selectedCurrCategory = true;
        }

        vm.flag.dataEntry = true;

        vm.currentCategory = categoryType;

        vm.form = {};
        vm.form[vm.currentCategory] = null;

        if (!vm.eventCreated) {
            var currentVideoPosition = vm.mediaPlayerApi.properties.currentTime();
            var frameno = (currentVideoPosition * vm.metaDataObj.GFPS) + 1;
            vm.event = {
                videoId: vm.currentVideo.videoId,
                startTime: currentVideoPosition,
                frameno: frameno,
                height: height,
                width: width,
                xaxis: offsetX,
                yaxis: offsetY
            };

            currentVideoPosition = frameno / vm.metaDataObj.GFPS;
            currentVideoPosition = currentVideoPosition.toFixed(2);
            vm.mediaPlayerApi.controls.play();
            vm.mediaPlayerApi.controls.changePosition(currentVideoPosition);
            vm.mediaPlayerApi.controls.pause();

        }

        var indexVal = categories.indexOf(categoryType);

        var subCats = '';
        if (vm.subCategoriesList[vm.categoriesDataList[indexVal]._id]) {
            subCats = vm.subCategoriesList[vm.categoriesDataList[indexVal]._id];
        }

        if (vm.subCategoriesList && subCats !== '') {
            vm.formResetData(vm.subCategoriesList[vm.categoriesDataList[indexVal]._id]);
        } else {
            SubCategoryService
                .getAllSubCategoriesByCategory(vm.categoriesDataList[indexVal]._id, false)
                .success(function(data, status) {
                    vm.subCategoriesList[vm.categoriesDataList[indexVal]._id] = data;
                    vm.formResetData(data);
                }).error(function(err, status) {

                });
        }

    }

    vm.requiredFilelds = [];
    vm.objTestDup = '';
    vm.editedCategory = '';
    vm.dataBkp = '';
    vm.currentIndexVal = 0;
    vm.resetValues = function() {
        vm.formResetData(vm.dataBkp);
    }

    vm.backPressed = function() {
        var index = categories.indexOf(vm.currentCategory);
        if (vm.currentLen > 0 && (vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6]) && vm.objTestDup) {
            vm.currentLen--;
            vm.createEvent(vm.currentCategory);
            //vm.mediaPlayerApi.controls.play();
        } else {
            vm.currentLen = 0;
            if (index > 0 && index < categories.length) {
                /*if((index == 3))
                {
                    if(vm.isProfileStaffSelected)
                    {
                        vm.currentLen = (vm.selectedEvent[0]['analysis'][categories[index - 1]].length-1);
                    }else
                    {
                        vm.currentLen = (vm.selectedEvent[0]['analysis'][categories[index - 2]].length-1);
                    }
                }

                if ((vm.isProfileStaffSelected && index == 2) || (!vm.isProfileStaffSelected && index == 3)) {
                    vm.createEvent(categories[index - 2]);
                } else {
                    vm.createEvent(categories[index - 1]);
                }*/

                if ((vm.currentCategory === catCodesList[1] || vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[3] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6])) {
                    vm.createEvent(categories[0]);
                }
            }
        }
    }
    vm.formResetData = function(data) {
        vm.dataBkp = data;
        vm.requiredFilelds = [];
        vm.form[vm.currentCategory] = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i].isMandatory == true)
                vm.requiredFilelds.push(data[i].subCategory);
        }

        if (vm.eventCreated && vm.selectedEvent[0] != undefined && vm.selectedEvent[0]['analysis'] != undefined) {
            vm.showAnother = false;
            vm.form[vm.currentCategory] = {};
            var objTest = vm.selectedEvent[0]['analysis'][vm.currentCategory];
            vm.objTestDup = vm.selectedEvent[0]['analysis'][vm.currentCategory];
            vm.comments = '';

            if (isAnotherSKU !== '' && (isAnotherSKU === 'Add Another SKU' || isAnotherSKU === 'Add Another Staff')) {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].isMandatory == true) {
                        vm.requiredFilelds.push(data[i].subCategory);
                    }
                    for (var typeLen = 0; typeLen < data[i].type.length; typeLen++) {
                        if (data[i].type[typeLen].isDefault) {
                            data[i].selectedValue = data[i].type[typeLen]['icon'].name;
                            break;
                        }
                    }
                    if (data[i].selectedValue !== undefined) {
                        vm.form[vm.currentCategory][data[i].subCategory] = data[i].selectedValue;
                    }
                }
            } else {
                for (var i = 0; i < data.length; i++) {
                    if (data[i].selectedValue) {
                        delete data[i].selectedValue;
                    }
                    if (vm.currentCategory === catCodesList[0] || vm.currentCategory === catCodesList[1] || vm.currentCategory === catCodesList[3]) {
                        if (objTest !== undefined) {
                            data[i].selectedValue = objTest[data[i].subCategory];
                            if (objTest.comments) {
                                vm.comments = objTest.comments;
                            }
                        }
                    } else if (vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6]) {
                        if (objTest !== undefined) {
                            data[i].selectedValue = objTest[vm.currentLen][data[i].subCategory];
                            if (objTest[vm.currentLen] != undefined && objTest[vm.currentLen].comments != undefined)
                                vm.comments = objTest[vm.currentLen].comments;
                        }
                    }

                    if (data[i].selectedValue !== undefined) {
                        vm.form[vm.currentCategory][data[i].subCategory] = data[i].selectedValue;
                    }

                    if (data[i].isMandatory == true)
                        vm.requiredFilelds.push(data[i].subCategory);
                }
            }
        } else if (vm.currentCategory !== categories[0]) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].selectedValue) {
                    delete data[i].selectedValue;
                }

                if (vm.currentCategory !== catCodesList[0]) {
                    for (var typeLen = 0; typeLen < data[i].type.length; typeLen++) {
                        if (data[i].type[typeLen].isDefault) {
                            data[i].selectedValue = data[i].type[typeLen]['icon'].name;
                            break;
                        }
                    }
                }

                if (data[i].selectedValue !== undefined) {
                    vm.form[vm.currentCategory][data[i].subCategory] = data[i].selectedValue;
                }

                if (data[i].isMandatory == true)
                    vm.requiredFilelds.push(data[i].subCategory);
            }
        }

        var indexVal = categories.indexOf(vm.currentCategory);
        vm.currentIndexVal = indexVal;
        vm['category'][vm.currentCategory] = data;
        vm['dupcategory'][vm.fetchedCatsList[indexVal]] = data;
        vm.editedCategory = vm.fetchedCatsList[indexVal];
        var currentCat = vm.form[vm.currentCategory];
        if (currentCat != null && Object.keys(vm.form[vm.currentCategory]).length > 0) {
            vm.showAnother = true;
        }
        if (vm.currentCategory == categories[0] && Object.keys(vm.form[vm.currentCategory]).length > 0) {

            if ((Object.keys(vm.form[vm.currentCategory])).indexOf('Staff Type') >= 0 || (Object.keys(vm.form[vm.currentCategory])).indexOf('If Staff: Select Type') >= 0) {
                vm.isProfileStaffSelected = true;
            } else {
                vm.isProfileStaffSelected = false;
            }
        }
    }

    function closeDataEntry() {
        $rootScope.stopLoadingBlockUI();
        vm.form = {};
        offsetX = 0;
        offsetY = 0;
        node.innerHTML = '';
        node.setAttribute('style', '');
        vm.flag.dataEntry = false;
        vm.comments = '';
        vm.isNewShopper = false;
        if (this.divObj != null && this.divObj != undefined) {
            //this.divObj.remove();
        }
        resetAllDrawnBoxes();
        //vm.isProfileStaffSelected = false;
        //vm.mediaPlayerApi.controls.play();
    }

    function resetAllDrawnBoxes() {
        var len = 1;
        angular.forEach(vm.drawnObjs, function(value, key) {
            vm.drawnObjs[key].draggable({ disabled: true });
            vm.drawnObjs[key].resizable({ disabled: true });
            vm.drawnObjs[key].css(vm.cssObjs[key]).html(vm.contentObjs[key]);
        });
    }

    function removeAllDrawnBoxes() {
        angular.forEach(vm.drawnObjs, function(value, key) {
            vm.drawnObjs[key].remove();
        });

        vm.drawnObjs = {};
        vm.contentObjs = {};
        vm.cssObjs = {};
    }

    var addAnotherSkuNew = '';
    vm.catError = false;
    vm.currentLen = 0;
    $scope.timeSpentCounter = 0;
    var countSpentTime = '';

    function setTimeInterval() {
        $scope.timeSpentCounter = $scope.timeSpentCounter + 100;
    }

    function clearAndSetInterval(resetFlag) {
        $interval.cancel(countSpentTime);
        if (resetFlag) {
            $scope.timeSpentCounter = 0;
            countSpentTime = $interval(setTimeInterval, 100);
        }
    }

    vm.startDate = new Date();

    function saveCategory(openNext, addAnother, saveOrNext) {

        var keys = [];
        var currentCat = vm.form[vm.currentCategory];
        if (currentCat != null && Object.keys(vm.form[vm.currentCategory]).length > 0) {
            keys = Object.keys(vm.form[vm.currentCategory]);
        }

        if (vm.currentCategory == categories[0] && vm.requiredFilelds.indexOf('Shopper') >= 0) {
            const index = vm.requiredFilelds.indexOf('Shopper');
            vm.requiredFilelds.splice(index, 1);
        }

        var isSuperset = (vm.requiredFilelds).every(function(val) { return keys.indexOf(val) >= 0; });
        vm.hasError = false;
        if ((vm.isProfileStaffSelected || vm.isShopperAlreadyIn) && vm.currentCategory == categories[0]) {
            isSuperset = true;
        }
        if (!isSuperset) {
            vm.hasError = true;
        }

        if (vm.currentCategory == catCodesList[0]) {
            if (keys.length == 0) {
                isSuperset = false;
            }
        }

        var attributesLength = vm['category'][vm.currentCategory].length;

        function initEvent() {
            if (typeof vm.event.analysis === 'undefined') {
                vm.event.analysis = {};
                vm.event.name = shopperNamePrefix + (++shopperCount);
                vm.events.unshift(vm.event);
            }
            vm.eventCreated = true;
            vm.selectedCurrCategory = false;
        }

        function CreateObj(tempObj) {
            for (var key in tempObj) {
                this[key] = tempObj[key];
            }
        }
        isAnotherSKU = saveOrNext;

        var catKeys = Object.keys(vm['dupcategory']);
        var isCatAnalysed = true;
        vm.catError = false;

        if (saveOrNext === 'Save') {
            var copyOfReqCats = angular.copy(vm.requiredCats);
            if (vm.isProfileStaffSelected) {
                var index = copyOfReqCats.indexOf(categories[1]);
                copyOfReqCats.splice(index, 1);
            } else {
                var index = copyOfReqCats.indexOf(categories[2]);
                copyOfReqCats.splice(index, 1);
            }

            var pathIndex = copyOfReqCats.indexOf("Path");
            if (pathIndex >= 0) {
                //copyOfReqCats.splice(pathIndex, 1);
                //copyOfReqCats.push(categories[4]);
            }

            isCatAnalysed = (copyOfReqCats).every(function(val) { return catKeys.indexOf(val) >= 0; });

            if (!isCatAnalysed && vm.event.analysis != null) {
                isCatAnalysed = (copyOfReqCats).every(function(val) {
                    if (vm.event && vm.event.analysis && vm.event.analysis.length > 0) {
                        return (Object.keys(vm.event.analysis)).indexOf(val) >= 0;
                    }
                    return false;
                });
            }
            isCatAnalysed = true;
            if (!isCatAnalysed) {
                if (!vm.hasError) {
                    vm.catError = true;
                }
                saveOrNext = "New";
                isCatAnalysed = !isCatAnalysed;
                openNext = true;
            }
        }

        if (vm.changeOnSelection == true) {
            //vm.changeOnSelection = false;

            if (vm.currentCategory == categories[0] && vm.isShopperSubCat) {
                isSuperset = true;
                isCatAnalysed = true;
                vm.isShopperSubCat = false;
                vm.hasError = false;
            }
        }

        if (!isSuperset || !isCatAnalysed) {
            vm.hasError = true;
        } else if (isSuperset && isCatAnalysed) {
            if (saveOrNext === 'Save') {
                if (vm.isProfileStaffSelected) {
                    if (vm.event && vm.event.analysis && vm.event.analysis[categories[1]] != undefined) {
                        //delete vm.event.analysis[categories[1]]
                    }
                } else {
                    if (vm.event && vm.event.analysis && vm.event.analysis[categories[2]] != undefined) {
                        //delete vm.event.analysis[categories[2]]
                    }
                }
                $rootScope.loadingAndBlockUI('Saving the event.');
            }

            var isSaved = false;

            vm.endDate = new Date();
            var timeDiff = vm.endDate - vm.startDate;
            timeDiff /= 1000;
            timeDiff = $scope.timeSpentCounter;
            clearAndSetInterval(false);

            //vm.mediaPlayerApi.controls.play();

            switch (vm.currentCategory) {
                case catCodesList[0]:
                    initEvent();
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;

                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    vm.event.analysis[vm.currentCategory] = vm.form[vm.currentCategory];
                    break;

                case catCodesList[1]:
                    initEvent();
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;

                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    vm.event.analysis[vm.currentCategory] = vm.form[vm.currentCategory];
                    break;

                case catCodesList[2]:
                    initEvent();
                    if (typeof vm.event.analysis[vm.currentCategory] === 'undefined' || vm.event.analysis[vm.currentCategory] === undefined || vm.event.analysis[vm.currentCategory] === null) {
                        vm.event.analysis[vm.currentCategory] = [];
                    }

                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;
                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    var obj = new CreateObj(vm.form[vm.currentCategory]);
                    obj = setActionTimings(obj);
                    obj.exitTime = angular.copy(vm.exitTime);
                    vm.exitTime = 0;

                    if (addAnother) {
                        vm.currentLen = vm.event.analysis[vm.currentCategory].length - 1;
                    }

                    break;

                case catCodesList[3]:
                    initEvent();
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;

                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    vm.event.analysis[vm.currentCategory] = vm.form[vm.currentCategory];
                    break;

                case catCodesList[4]:
                    initEvent();
                    if (typeof vm.event.analysis[vm.currentCategory] === 'undefined' || vm.event.analysis[vm.currentCategory] === null) {
                        vm.event.analysis[vm.currentCategory] = [];
                    }
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;
                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    var obj = new CreateObj(vm.form[vm.currentCategory]);
                    obj = setActionTimings(obj);
                    if (addAnother) {
                        vm.currentLen = vm.event.analysis[vm.currentCategory].length - 1;
                    }
                    break;

                case catCodesList[5]:
                    initEvent();
                    if (typeof vm.event.analysis[vm.currentCategory] === 'undefined' || vm.event.analysis[vm.currentCategory] === null) {
                        vm.event.analysis[vm.currentCategory] = [];
                    }
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;
                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    var obj = new CreateObj(vm.form[vm.currentCategory]);
                    obj = setActionTimings(obj);
                    if (addAnother) {
                        vm.currentLen = vm.event.analysis[vm.currentCategory].length - 1;
                    }
                    break;

                case catCodesList[6]:
                    initEvent();
                    if (typeof vm.event.analysis[vm.currentCategory] === 'undefined' || vm.event.analysis[vm.currentCategory] === null) {
                        vm.event.analysis[vm.currentCategory] = [];
                    }
                    vm.form[vm.currentCategory].time = categoryStartTime;
                    vm.form[vm.currentCategory].comments = vm.comments;
                    if (vm.form[vm.currentCategory].timeSpent) {
                        vm.form[vm.currentCategory].timeSpent = vm.form[vm.currentCategory].timeSpent + timeDiff;
                    } else {
                        vm.form[vm.currentCategory].timeSpent = timeDiff;
                    }
                    var obj = new CreateObj(vm.form[vm.currentCategory]);
                    obj = setActionTimings(obj);
                    if (addAnother) {
                        vm.currentLen = vm.event.analysis[vm.currentCategory].length - 1;
                    }
                    break;
            }

            if (vm.currentCategory == catCodesList[0] && vm.form && vm.form[vm.currentCategory] && Object.keys(vm.form[vm.currentCategory]).length > 0) {
                vm.isProfileStaffSelected = false;
                vm.isShopperAlreadyIn = false;
                if (Object.keys(vm.form[vm.currentCategory]).indexOf('Staff') >= 0) {
                    vm.isProfileStaffSelected = true;
                    vm.createEvent(categories[2]);
                } else if (Object.keys(vm.form[vm.currentCategory]).indexOf('Shopper') >= 0) {
                    vm.isShopperAlreadyIn = true;
                    //vm.createEvent(categories[1]);
                }
            }

            vm.startDate = new Date();
            clearAndSetInterval(true);

            if (vm.event.analysis && Object.keys(vm.event.analysis).length === 4 && saveOrNext === 'Save') {
                vm.submitForm = true;
            }

            if (!vm.hasError) {
                //vm.closeDataEntry();
            }

            if (saveOrNext === 'Save') {
                vm.event.endTime = vm.mediaPlayerApi.properties.currentTime();
                submitEvent();
            }

            // Save and next  && !vm.event.analysis['Exit Path']
            if (openNext) {
                var index = categories.indexOf(vm.currentCategory);
                if ((vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6]) && vm.objTestDup && vm.currentLen < (vm.objTestDup.length - 1)) {
                    vm.currentLen++;
                    vm.createEvent(vm.currentCategory);
                    //vm.mediaPlayerApi.controls.play();
                } else {
                    vm.currentLen = 0;
                    if (index > -1 && index < categories.length - 1) {
                        if (vm.changeOnSelection) {
                            vm.changeOnSelection = false;
                            vm.createEvent(categories[vm.changeToIndex]);
                        } else {
                            vm.createEvent(categories[index + 1]);
                            //if ((vm.isProfileStaffSelected && index == 0) || index == 1) {
                            //    vm.createEvent(categories[index + 2]);
                            //} else {
                            //    vm.createEvent(categories[index + 1]);
                            //}
                        }
                    }
                }
            }
            //if (openNext || addAnother) {
            if (openNext) {
                if (!(vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[3] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6])) {
                    vm.mediaPlayerApi.controls.changePosition(vm.event.startTime);
                }
                currentVideoPositiion = vm.event.startTime;
                //vm.mediaPlayerApi.controls.play();
            }

            if (addAnother && ((vm.currentCategory === catCodesList[2] || vm.currentCategory === catCodesList[4] || vm.currentCategory === catCodesList[5] || vm.currentCategory === catCodesList[6]))) {
                vm.currentLen++;
                vm.createEvent(vm.currentCategory);
                //vm.mediaPlayerApi.controls.play();
            }
        }
    }

    function setActionTimings(obj) {
        var currentChildCat = vm.event.analysis[vm.currentCategory][vm.currentLen];
        if (currentChildCat && currentChildCat != null && currentChildCat != undefined) {
            obj.actionStartTime = angular.copy(currentChildCat.actionStartTime);
            obj.actionStopTime = angular.copy(currentChildCat.actionStopTime);
            obj.interActionStartTime = angular.copy(currentChildCat.interActionStartTime);
            obj.interActionStopTime = angular.copy(currentChildCat.interActionStopTime);
        }

        if (vm.actionStartTime != 0)
            obj.actionStartTime = angular.copy(vm.actionStartTime);
        if (vm.actionStopTime != 0)
            obj.actionStopTime = angular.copy(vm.actionStopTime);
        if (vm.interActionStartTime != 0)
            obj.interActionStartTime = angular.copy(vm.interActionStartTime);
        if (vm.interActionStopTime != 0)
            obj.interActionStopTime = angular.copy(vm.interActionStopTime);

        vm.event.analysis[vm.currentCategory][vm.currentLen] = obj;
        vm.actionStartTime = 0;
        vm.actionStopTime = 0;
        vm.interActionStartTime = 0;
        vm.interActionStopTime = 0;

        return obj;
    }

    function deleteSelectedEvent() {
        var discarded = vm.events[vm.selectedEventIndex].isDiscarded;
        EventService
            .removeEvent(vm.selectedEvent[0]._id, vm.selectedEvent[0].videoId, discarded, $localStorage.user.userId)
            .success(function(data, status) {

                if (discarded == 0) {
                    vm.events[vm.selectedEventIndex].isDiscarded = 1;
                    vm.events[vm.selectedEventIndex].color = 'red';
                } else {
                    vm.events[vm.selectedEventIndex].isDiscarded = 0;
                    vm.events[vm.selectedEventIndex].color = 'green';
                }
                vm.noOfRecordsDiscarded++;
                vm.closeDataEntry();
                vm.selectedEvent = [];
                vm.event = {};
                vm.eventCreated = false;

                pauseAnalysis(true);

            }).error(function(err, status) {

            });
    }

    function calculateTotalTimeSpent(obj) {
        var totalTimeSpent = 0;
        if (obj == null || obj == undefined || obj.analysis == null || obj.analysis == undefined) {
            return totalTimeSpent;
        }

        for (var catLen = 0; catLen < categories.length; catLen++) {
            var catObj = obj.analysis[categories[catLen]];
            if (catObj != null && catObj != undefined) {
                if (catLen == 0 || catLen == 1 || catLen == 3) {
                    totalTimeSpent = totalTimeSpent + catObj.timeSpent;
                } else {
                    for (var subListLen = 0; subListLen < catObj.length; subListLen++) {
                        totalTimeSpent = totalTimeSpent + catObj[subListLen].timeSpent;
                    }
                }
            }
        }
        return totalTimeSpent;
    }

    function submitEvent() {
        var obj = vm.event;
        if (vm.selectedEvent[0] != undefined && vm.selectedEvent[0].eventId != undefined && vm.selectedEvent[0].eventId != '') {
            obj.eventId = vm.selectedEvent[0].eventId;
        }

        obj.totalTimeSpent = calculateTotalTimeSpent(obj);
        obj.xaxis = offsetX;
        obj.yaxis = offsetY;
        obj.comments = vm.comments;
        obj.height = height;
        obj.width = width;
        obj.xendaxis = Number(obj.xaxis) + Number(width);
        obj.yendaxis = Number(obj.yaxis) + Number(height);
        vm.isNewShopper = false;
        videoElementInstance = document.getElementById('video');
        obj.screenWidth = Number(screen.width);
        obj.screenHeight = Number(screen.height);
        obj.originalVideoWidth = Number(videoElementInstance.videoWidth);
        obj.originalVideoHeight = Number(videoElementInstance.videoHeight);
        obj.playingWidth = Number($("#video").innerWidth());
        obj.playingHeight = Number($("#video").innerHeight());

        obj.existingShopper = angular.copy(vm.existingShopperDet);
        obj.cameraId = vm.currentSelectedVideo.cameraId;
        obj.clientId = vm.currentSelectedVideo.client;
        vm.existingShopperDet = {};
        EventService
            .newEvent(obj)
            .success(function(data, status) {
                vm.comments = '';
                if (data.eventId && !data.msg) {
                    vm.events.push(data);
                }

                //vm.selectedEvent = [];
                //vm.event = {};
                //vm.eventCreated = false;
                var updatableIndex = previousIndex;
                if (updatableIndex !== '') {
                    updatableIndex = updatableIndex + 1;
                }

                vm.closeDataEntry();
                if (vm.events.length > updatableIndex) {
                    selectedEventInEventsList(updatableIndex)
                }


                pauseAnalysis(true);
                vm.showMore();

            }).error(function(err, status) {

            });
    }

    function pauseAnalysis(play) {
        var userId = $localStorage.user.userId;
        var videoId = vm.currentVideo.videoId;
        var currentTime = vm.mediaPlayerApi.properties.currentTime();

        $localStorage.user.pausedVideoTime = currentTime;
        $localStorage.user.pausedVideoId = videoId;

        VideoService
            .pauseAnalysis(userId, videoId, currentTime)
            .success(function(data, success) {
                if (!play) {
                    vm.mediaPlayerApi.controls.pause();
                }
            }).error(function(err, status) {

            });

    }

    function openVideo(video, play, time, pausedAnalysis) {

        userFirstTimeOpen = true;
        window.dashboard = false;
        pausedVideo = video;
        pausedVideoId = video.videoId;
        vm.selectedVideoId = video.videoId;

        time = time ? time : 0;

        //Call API to lock this video
        //TBD
        var userId = $localStorage.user.userId;
        var videoId = video.videoId;
        VideoService
            .getStatus(videoId)
            .success(function(data, status) {
                if (data.status === 0 || (data.status === 1 && data.userId === userId)) {
                    VideoService
                        .lockVideo(userId, videoId)
                        .success(function(data, success) {
                            vm.getCategoriesListByProject(video);
                            vm.metaDataObj = { GFPS: vm.frame_rate };
                            if (video.metaDataObj && video.metaDataObj != null && video.metaDataObj != undefined && video.metaDataObj.GFPS) {
                                vm.metaDataObj = video.metaDataObj;
                            }

                            $localStorage.user.pausedVideoId = videoId;
                            getEventsListBySelectedVideo(videoId);

                            var bucketUrl = '';
                            if ((video.project && video.project.bucket) || video.bucket) {
                                var paramsObj = { Bucket: video.bucket, Key: video.url, Expires: 7200 };

                                vm.mediaPlayerApi.controls.changeSource(video.url, play);
                                vm.mediaPlayerApi.controls.pause();

                                // AwsService
                                //     .authenticateUrl({ paramsObj: paramsObj })
                                //     .success(function(data, status) {
                                // vm.mediaPlayerApi.controls.changeSource(data.signedUrl, play);
                                // vm.mediaPlayerApi.controls.pause();
                                //showCustomProgressBar();
                                // }).error(function(err, status) {
                                //     console.log(err);
                                //     console.log(status);
                                // });
                            } else {
                                bucketUrl = video.url;
                                vm.mediaPlayerApi.controls.changeSource(bucketUrl, play);
                                vm.mediaPlayerApi.controls.pause();
                            }

                            vm.mediaPlayerApi.controls.pause();
                            vm.currentVideo = video;

                            /////////////////////////////////
                            resetCtlInfo()

                            vm.frame_rate = data.fps;
                            vm.sub_frame_rate = data.nskip;
                            /////////////////////////////////

                            console.log(data);

                            vm.analysing = true;

                            vm.mediaPlayerApi.properties.currentTime(time);


                            if (pausedAnalysis) {
                                shopperCount = vm.events.length;
                            } else {
                                shopperCount = shopperCount | 0;
                                vm.event = {};
                                vm.events = [];
                                vm.form = {};
                            }

                            vm.eventCreated = false;
                            vm.closeDataEntry();

                        }).error(function(err, status) {});


                } else {
                    // Todo
                    // Show error message saying video is locked if it is locked by ANOTHER USER
                    // And remove video from videos array if it is locked by ANOTHER USER
                }
            }).error(function(err, status) {

            });
    }

    vm.totalNumberOfEvents = 0;
    vm.noOfRecordsDiscarded = 0;
    vm.selectedVideoId = '';

    vm.staffOrAll = "Adult Events";
    vm.staffFlag = true;
    vm.staffEvents = [];
    vm.dupCopyEvents = [];

    vm.fetchStaffOrAllEvents = function() {
        vm.closeDataEntry();
        vm.staffFlag = !vm.staffFlag;
        vm.staffEvents = [];
        vm.selectedEvent = [];
        if (vm.staffFlag) {
            vm.staffOrAll = "Adult Events";
            vm.pageNo = 0;
            vm.fetchData = true;
            vm.events = [];
            vm.showMore();
        } else {
            vm.staffOrAll = "All Events";

            var lenCount = 0;
            var eventsLength = vm.events.length;

            for (; lenCount < eventsLength; lenCount++) {
                var currentEvent = vm.events[lenCount];
                var catLoopLen = 0;

                if (currentEvent.analysis != undefined && currentEvent.analysis[categories[1]] != undefined && currentEvent.analysis[categories[1]]['Age'] && currentEvent.analysis[categories[1]]['Age'] == 'ADULT') {
                    vm.staffEvents.push(angular.copy(currentEvent));
                }
            }
            vm.events = angular.copy(vm.staffEvents);
        }
    }

    function getEventsListBySelectedVideo(selectedVideoId) {
        vm.selectedVideoId = selectedVideoId;

        EventService
            .getAllShoppersByStartTime({ videoId: vm.selectedVideoId, isDiscarded: 0 })
            .success(function(data, status) {
                vm.gridOptions.data = data;
                vm.events = data;
                sortEvents();
            }).error(function(err, status) {
                console.log(err);
            });
        vm.showMore();
    }

    var notCheckedRecords = 0;
    vm.checkEventsNotChecked = function() {
        notCheckedRecords = 0;
        var lenCount = 0;
        var eventsLength = vm.events.length;

        for (; lenCount < eventsLength; lenCount++) {
            var currentEvent = vm.events[lenCount];
            var catLoopLen = 0;

            if (!currentEvent.analysis && vm.isOpenedForReview) {
                vm.events[lenCount].color = 'red';
            }
            for (; catLoopLen < categoriesLen; catLoopLen++) {
                if (!currentEvent.analysis || !currentEvent.analysis[categories[catLoopLen]]) {
                    notCheckedRecords++;
                    if (vm.isOpenedForReview) {
                        vm.events[lenCount].color = 'red';
                    }
                    break;
                }
            }

            if (currentEvent.isDiscarded && currentEvent.isDiscarded === 1) {
                vm.events[lenCount].color = 'yellow';
            }
        }
    }

    vm.isOpenedForReview = false;
    vm.askForConfirmation = function() {
        vm.checkEventsNotChecked();
        vm.mediaPlayerApi.controls.pause();
        notCheckedRecords = 0;
        vm.noOfRecordsDiscarded = 0;
        vm.totalEventsCount = 0;
        EventService
            .getEventListByVideo(vm.currentVideo.videoId)
            .success(function(data, status) {
                notCheckedRecords = data.notAnalysedCount;
                vm.noOfRecordsDiscarded = data.discaredCount;
                vm.totalEventsCount = data.totalCount;
                vm.doConfirm("Would you like to review the video to submit?", function yes() {
                    vm.isOpenedForReview = true;
                    vm.checkEventsNotChecked();
                    $timeout(function() {
                        vm.selectedEventInEventsList(10);
                    }, 1000);
                }, function submit() {
                    submitVideo();
                }, function no() {
                    // do nothing
                });
            });
    }

    vm.doConfirm = function(msg, yesFn, submitFn, noFn) {
        var doConfirmBox = $("#confirmBox");
        doConfirmBox.find(".message").text(msg);
        //doConfirmBox.find(".message1").text('Total Number Of Events:'+vm.events.length);
        //doConfirmBox.find(".message2").text('Total Number Of Events Discarded:'+vm.noOfRecordsDiscarded);
        //doConfirmBox.find(".message3").text('No.of Events Not Checked By The User:'+notCheckedRecords);
        doConfirmBox.find(".message1").text('Total Number Of Events:' + vm.totalEventsCount);
        doConfirmBox.find(".message2").text('Total Number Of Events Discarded:' + vm.noOfRecordsDiscarded);
        doConfirmBox.find(".message3").text('No.of Events Not Checked By The User:' + notCheckedRecords);
        doConfirmBox.find(".yes,.submit,.no").unbind().click(function() {
            doConfirmBox.hide();
        });
        doConfirmBox.find(".yes").click(yesFn);
        doConfirmBox.find(".submit").click(submitFn);
        doConfirmBox.find(".no").click(noFn);
        doConfirmBox.show();
    }

    vm.formVideoIdToSubmit = '';
    vm.submitVideoFromForm = function() {
        var videoId = vm.formVideoIdToSubmit;
        VideoService
            .updateVideoStatus(videoId, 2, 10)
            .success(function(data, status) {

            });
    }

    function submitVideo() {

        /*if(this.divObj && this.divObj != null && this.divObj != undefined)
        {
            this.divObj.remove();
        }*/
        $rootScope.loadingAndBlockUI('The events are being submitted');
        //Call API to update video status
        var videoId = vm.currentVideo.videoId;
        var videoTimeAtSubmitted = vm.mediaPlayerApi.properties.currentTime();
        VideoService
            .updateVideoStatus(videoId, 2, videoTimeAtSubmitted)
            .success(function(data, status) {
                window.dashboard === true;
                getUnlockVideos();

                vm.mediaPlayerApi.controls.changeSource("", false);
                vm.currentVideo = {};

                vm.analysing = false;

                shopperCount = shopperCount | 0;
                vm.event = {};
                vm.events = [];
                vm.form = {};
                vm.selectedEvent = [];

                vm.eventCreated = false;
                vm.closeDataEntry();
            });
    }

    vm.showAnother = false;
    vm.isShopperAlreadyIn = false;
    vm.actionStartTime = 0;
    vm.exitTime = 0;
    vm.actionStopTime = 0;
    vm.changeToIndex = 0;
    vm.changeOnSelection = false;

    vm.interActionStartTime = 0;
    vm.interActionStopTime = 0;

    vm.isChangeTriggered = false;

    function onInputClick(paramName, subCatName, item, type) {
        if (!vm.isChangeTriggered) {
            vm.form[vm.currentCategory][item.subCategory] = '';
            delete vm.form[vm.currentCategory][item.subCategory];
        }
        vm.isChangeTriggered = false;
    }

    vm.changeComments = function() {
        vm.mediaPlayerApi.controls.pause();
        clearInterval(intervalRewind);
        vm.mediaPlayerApi.controls.pause();
    }

    var intervalRewind = '';
    $(window).keypress(function(e) {
        if (e.keyCode == 65 || e.keyCode == 97) {
            clearInterval(intervalRewind);
            if (vm.mediaPlayerApi.videoStatus()) {
                vm.mediaPlayerApi.controls.play();
            } else {
                vm.mediaPlayerApi.controls.pause();
            }
        } else if (e.keyCode == 68 || e.keyCode == 100) {
            var rewindVideo = document.getElementById('video');
            if (vm.mediaPlayerApi.videoStatus()) {
                vm.mediaPlayerApi.controls.play();
                clearInterval(intervalRewind);
                intervalRewind = setInterval(function() {

                    if (rewindVideo != null && rewindVideo != undefined) {
                        rewindVideo.playbackRate = 1.0;
                        if (rewindVideo.currentTime == 0) {
                            clearInterval(intervalRewind);
                            vm.mediaPlayerApi.controls.pause();
                        } else {
                            rewindVideo.currentTime += -.05;
                        }
                    }
                }, 50);
            } else {
                vm.mediaPlayerApi.controls.pause();
                clearInterval(intervalRewind);
            }
        }
    });

    vm.isShopperSubCat = false;

    function onInputChange(paramName, subCatName, item, type) {
        vm.isChangeTriggered = true;

        if (Object.keys(vm.form[vm.currentCategory]).length === 1) {
            vm.mediaPlayerApi.controls.pause();
            categoryStartTime = vm.mediaPlayerApi.properties.currentTime();
        }

        if (Object.keys(vm.form[vm.currentCategory]).length > 0) {
            vm.mediaPlayerApi.controls.pause();
            vm.showAnother = true;
        }

        if ((vm.currentCategory == catCodesList[2] || vm.currentCategory == catCodesList[4] || vm.currentCategory == catCodesList[5] || vm.currentCategory == catCodesList[6]) && Object.keys(vm.form[vm.currentCategory]).length > 0) {
            if ((Object.keys(vm.form[vm.currentCategory])).indexOf('ActionStart') >= 0 && subCatName == 'ActionStart' && type.icon.name != "NOT APPLICABLE") {
                vm.actionStartTime = vm.mediaPlayerApi.properties.currentTime();
            } else if ((Object.keys(vm.form[vm.currentCategory])).indexOf('ActionStopContinue') >= 0 && subCatName == 'ActionStopContinue' && type.icon.name != "NOT APPLICABLE") {
                vm.actionStopTime = vm.mediaPlayerApi.properties.currentTime();
            } else if ((Object.keys(vm.form[vm.currentCategory])).indexOf('InterActionStart') >= 0 && subCatName == 'InterActionStart' && type.icon.name != "NOT APPLICABLE") {
                vm.interActionStartTime = vm.mediaPlayerApi.properties.currentTime();
            } else if ((Object.keys(vm.form[vm.currentCategory])).indexOf('InterActionStopContinue') >= 0 && subCatName == 'InterActionStopContinue' && type.icon.name != "NOT APPLICABLE") {
                vm.interActionStopTime = vm.mediaPlayerApi.properties.currentTime();
            }
        }

        if (vm.currentCategory == catCodesList[2] && Object.keys(vm.form[vm.currentCategory]).length > 0) {
            if ((Object.keys(vm.form[vm.currentCategory])).indexOf('Exit') >= 0 && subCatName == 'Exit') {
                vm.exitTime = vm.mediaPlayerApi.properties.currentTime();
            }
        }

        vm.changeToIndex = 0;
        vm.changeOnSelection = false;

        vm.isShopperSubCat = false;
        if (item.name && item.name == 'Shopper') {
            vm.isShopperSubCat = true;
        }

        if (type && type.alreadyIn) {
            vm.loadMorePreviousFrameShoppers = false;

            if (type && type.refcatcode && type.refcatcode !== '0' && categories.length > 0 && categories.indexOf(type.refcatcode) > 0 && vm.currentCategory != type.refcatcode) {
                vm.changeToIndex = categories.indexOf(type.refcatcode);
                vm.changeOnSelection = true;
            } else if (item && item.refcatcode && item.refcatcode !== '0' && categories.length > 0 && categories.indexOf(item.refcatcode) > 0 && vm.currentCategory != item.refcatcode) {
                vm.changeToIndex = categories.indexOf(item.refcatcode);
                vm.changeOnSelection = true;
            }

            vm.showExistingShoppers();
        } else if (type && type.refcatcode && type.refcatcode !== '0' && categories.length > 0 && categories.indexOf(type.refcatcode) > 0 && vm.currentCategory != type.refcatcode) {
            vm.changeToIndex = categories.indexOf(type.refcatcode);
            vm.changeOnSelection = true;
            vm.saveCategory(true, false, 'New');
        } else if (item && item.refcatcode && item.refcatcode !== '0' && categories.length > 0 && categories.indexOf(item.refcatcode) > 0 && vm.currentCategory != item.refcatcode) {
            vm.changeToIndex = categories.indexOf(item.refcatcode);
            vm.changeOnSelection = true;
            vm.saveCategory(true, false, 'New');
        }

        if (vm.currentCategory == catCodesList[1] && vm.form && vm.form[vm.currentCategory] && Object.keys(vm.form[vm.currentCategory]).length > 0) {
            vm.isProfileStaffSelected = false;
            vm.isShopperAlreadyIn = false;
            if ((Object.keys(vm.form[vm.currentCategory])).indexOf('Staff Type') >= 0 || (Object.keys(vm.form[vm.currentCategory])).indexOf('If Staff: Select Type') >= 0) {
                vm.isProfileStaffSelected = true;
                vm.saveCategory(true, false, 'New');
            } else if ((Object.keys(vm.form[vm.currentCategory])).indexOf('If Shopper, Select:') >= 0 && vm.form[vm.currentCategory]['If Shopper, Select:'] == 'ALREADY IN') {
                vm.isShopperAlreadyIn = true;
                vm.saveCategory(true, false, 'New');
            }
        }
    }

    vm.gridOptions = {
        columnDefs: [
            { field: 'eventId', displayName: 'Event Id', enableHiding: false },
            { field: 'humanid', displayName: 'Human Id', enableHiding: false },
            { field: 'frameno', displayName: 'Frame No', enableHiding: false },
            { field: 'startTime', displayName: 'Start Time', enableHiding: false },
            { field: 'details', displayName: 'Details', enableHiding: false }
        ],
        multiSelect: false,
        onRegisterApi: function(gridApi) {
            vm.gridApi = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                if (vm.gridApi.selection.getSelectedRows().length > 0) {

                    console.log(vm.gridApi.selection.getSelectedRows()[0])
                }
            });

            $interval(function() {
                vm.gridApi.core.handleWindowResize();
            }, 100);
        }
    };

    vm.existingShopperDet = {};
    vm.selectAlreadyInShopper = function() {
        if (vm.gridApi.selection.getSelectedRows().length > 0) {
            var existingShopper = angular.copy(vm.gridApi.selection.getSelectedRows()[0]);
            vm.existingShopperDet = { eventId: existingShopper.eventId, name: "Shopper-" + existingShopper.eventId };

            offsetX = existingShopper.xaxis;
            offsetY = existingShopper.yaxis;
            height = existingShopper.height;
            width = existingShopper.width;

            vm.showSelectedEventOnTopOfVideo(false);

            swal({
                    title: "Are you sure?",
                    text: "Is this person existing shopper?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, Existing shopper!",
                    closeOnConfirm: true
                },
                function(isConfirm) {
                    if (isConfirm) {
                        vm.event.height = existingShopper.height;
                        vm.event.width = existingShopper.width;
                        vm.event.xaxis = existingShopper.xaxis;
                        vm.event.xendaxis = existingShopper.xendaxis;
                        vm.event.yaxis = existingShopper.yaxis;
                        vm.event.yendaxis = existingShopper.yendaxis;

                        vm.saveCategory(true, false, 'New');
                    } else {
                        $('#existingShoppersList').modal('show', {
                            backdrop: true,
                            keyboard: false
                        });
                        /*offsetX = vm.event.xaxis;
                        offsetY = vm.event.yaxis;
                        height = vm.event.height;
                        width = vm.event.width;

                        vm.showSelectedEventOnTopOfVideo(false);*/
                    }
                },
                function() {

                }
            );

            $('#existingShoppersList').modal('hide');
            toastr.success('Existing Shopper Selected Successfully.', 'Done');
        }
    }
    vm.loadMorePreviousFrameShoppers = false;
    vm.showPreviousFramesShoppers = function() {
        vm.loadMorePreviousFrameShoppers = true;
        vm.showExistingShoppers();
    }

    vm.showExistingShoppers = function() {
        vm.gridOptions.data = [];
        vm.previousVideoPosition = vm.playingVideoPosition - forwardDuration;

        if (vm.previousVideoPosition >= 0) {
            vm.previousFrameNo = (vm.previousVideoPosition * vm.metaDataObj.GFPS) + 1;
            var filterObject = { startTime: vm.previousVideoPosition, videoId: vm.selectedVideoId, isDiscarded: 0, frameno: vm.previousFrameNo };
            if (vm.previousFrameNo > 1 && vm.loadMorePreviousFrameShoppers) {
                filterObject = { videoId: vm.selectedVideoId, isDiscarded: 0, frameno: { $lt: vm.previousFrameNo } };
            }
            EventService
                .getAllShoppersByStartTime(filterObject)
                .success(function(data, status) {
                    for (var len = 0; len < data.length; len++) {
                        if (data[len].analysis && data[len].analysis['SHOPPERPROFILE']) {
                            data[len]['details'] = '';
                            if (data[len].analysis['SHOPPERPROFILE']['Gender']) {
                                data[len]['details'] = data[len]['details'] + data[len].analysis['SHOPPERPROFILE']['Gender'].substring(0, 1) + ',';
                            }

                            if (data[len].analysis['SHOPPERPROFILE']['Group']) {
                                data[len]['details'] = data[len]['details'] + data[len].analysis['SHOPPERPROFILE']['Group'].substring(0, 2) + ',';
                            }

                            if (data[len].analysis['SHOPPERPROFILE']['Age']) {
                                data[len]['details'] = data[len]['details'] + data[len].analysis['SHOPPERPROFILE']['Age'].substring(0, 2) + ',';
                            }

                            if (data[len].analysis['SHOPPERPROFILE']['Color of Top']) {
                                data[len]['details'] = data[len]['details'] + data[len].analysis['SHOPPERPROFILE']['Color of Top'].substring(0, 2) + ',';
                            }

                            if (data[len]['details'].endsWith(",")) {
                                data[len]['details'] = data[len]['details'].substring(0, data[len]['details'].length - 1);
                            }
                        }
                    }
                    vm.gridOptions.data = data;
                }).error(function(err, status) {
                    console.log(err);
                });
        }

        $('#existingShoppersList').modal('show', {
            backdrop: true,
            keyboard: false
        });
    }

    function getTypes() {
        /*CategoryService
         .getTypes()
         .success(function(data, status) {
         angular.forEach(data, function(item) {
         vm.types[item.name] = item.imageUrl;
         });
         }).error(function(err, status) {
         });*/

        IconsService
            .getAllIcons()
            .success(function(data, status) {
                angular.forEach(data, function(item) {
                    vm.types[item.name] = item.imageUrl;
                });
            }).error(function(err, status) {});
    }

    vm.videosNoneMsg = '';

    vm.getCoordinates = function(event) {
        if ((vm.flag.dataEntry) || (vm.selectedEvent && vm.selectedEvent != undefined && (vm.selectedEvent.length > 0 || vm.isNewShopper) && vm.flag && vm.currentSelectedVideo && vm.currentSelectedVideo !== '')) {
            offsetX = event.offsetX;
            offsetY = event.offsetY;
            vm.showSelectedEventOnTopOfVideo(false);
        }
        if (parseInt(v_container.currentTime) == parseInt(v_container.duration)) {
            resetCtlInfo();
        }
    }

    $scope.deleteObjcect = function(obj) {
        swal({
                title: "Are you sure?",
                text: "Would You Like To Delete An Event?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            },
            function() {
                if (moveObject != null && moveObject != undefined && !jQuery.isEmptyObject(moveObject)) {
                    moveObject.remove();
                    vm.closeDataEntry();
                }
                if (vm.selectedCurrCategory) {
                    deleteSelectedEvent();
                    vm.closeDataEntry();
                }
            });
    }

    vm.drawnObjs = {};
    vm.contentObjs = {};
    vm.cssObjs = {};

    vm.points = [
        []
    ];
    vm.imageSrc = "https://cloud.githubusercontent.com/assets/121322/18649301/a9740512-7e73-11e6-8db1-e266cd1c2a3b.jpg";
    vm.enabled = true;
    vm.colorArray = ['#FF0000', '#FFFF00', '#0000FF', '#008000', '#C0C0C0'];
    vm.activePolygon = 0;

    vm.enabled = true;
    vm.points.push([]);
    vm.activePolygon = vm.points.length - 1;

    vm.showSelectedEventOnTopOfVideo = function(firstTimeEdit) {
        //$compile(angular.element('#video'))(vm);
        videoElementInstance = document.getElementById('video');
        videoRelativeContainer = document.createElement('div');

        videoRelativeContainer.style.position = 'relative'
        videoElementInstance.parentNode.insertBefore(videoRelativeContainer, videoElementInstance)
        videoRelativeContainer.appendChild(videoElementInstance)

        var pinPointBoxHTML = 'User Selected<br>' +
            'Time:' + vm.mediaPlayerApi.properties.currentTime();
        node.innerHTML = pinPointBoxHTML;

        var css = {
            "border": "3px solid red",
            "position": "absolute",
            "text-align": "center",
            "pointer-events": "none",
            "display": "inline-block",
            "font-size": "0.9em",
            "box-sizing": "border-box",
            "color": "white",
            "padding": "2px",
            "width": "50px",
            "height": "100px"

        }

        node.setAttribute('style', JSON.stringify(css).replace(/"*\{*\}*/gi, '').replace(/,/gi, ';'))

        if (firstTimeEdit) {
            vm.shopperDisplayingId = angular.copy(shopperCount);
            vm.shopperDisplayingId = vm.shopperDisplayingId + 1;
        }

        node.style.left = offsetX + 'px';
        node.style.top = offsetY + 'px';
        var pinPointBoxHTML = 'ID:' + vm.shopperDisplayingId + '<br>' +
            'X:' + offsetX + '<br>' +
            'Y:' + offsetY + '<br>';

        node.innerHTML = pinPointBoxHTML;

        css = {
            "border": "3px dotted red",
            "position": "absolute",
            "text-align": "center",
            "display": "inline-block",
            "font-size": "0.9em",
            "box-sizing": "border-box",
            "color": "white",
            "padding": "2px",
            "min-width": "25px",
            "min-height": "50px",
            "max-width": "320px",
            "max-height": "600px",
            "z-index": "1",
            "resize": "both",
            "cursor": "move",
            "left": node.style.left,
            "top": node.style.top,
            "height": height,
            "width": width
        }

        var eventId = vm.event.eventId;
        vm.contentObjs[eventId] = angular.copy(pinPointBoxHTML);
        vm.cssObjs[eventId] = angular.copy(css);

        if (vm.drawnObjs[eventId] != null && vm.drawnObjs[eventId] != undefined) {
            vm.drawnObjs[eventId].remove();
            resetAllDrawnBoxes();
        }

        css.border = "3px solid #16ef16";

        if (vm.deleteOpt) {
            pinPointBoxHTML = $compile("<span ng-click='deleteObjcect(this)' style=\"cursor: pointer;position: absolute;background-color: red;right: 0px;top: 0;color: white;padding: 3px;border-radius: 3px;line-height: 15px;font-family: monospace;font-size: medium;z-index:1;\">X</span><br>" + pinPointBoxHTML)($scope);
        }
        vm.display = pinPointBoxHTML;

        this.divObj = $('<div id="rectDranEle"/>').addClass("ui-resizable").css(css).html(vm.display).appendTo(videoRelativeContainer);
        this.divObj.draggable({ containment: videoElementInstance }).resizable({ containment: videoElementInstance });
        moveObject = this.divObj;

        vm.drawnObjs[eventId] = moveObject;

        this.divObj.on("resize", function(rEvent, rUI) {
            var objDrawn = moveObject.position();
            height = Math.round(moveObject.height());
            width = Math.round(moveObject.width());
            offsetX = Math.round(objDrawn.left);
            offsetY = Math.round(objDrawn.top);
        });
        this.divObj.on("dragstop", function(event, ui) {
            var objDrawn = moveObject.position();
            height = moveObject.height() + 8;
            width = moveObject.width() + 8;
            offsetX = objDrawn.left;
            offsetY = objDrawn.top;
            pinPointBoxHTML = 'ID:' + vm.shopperDisplayingId + '<br>' +
                'X:' + offsetX + '<br>' +
                'Y:' + offsetY + '<br>';

            if (vm.event.ideocapid != null && vm.event.ideocapid != undefined && vm.event.ideocapid != '') {
                pinPointBoxHTML = 'ID:' + vm.currentEventID + '<br>' +
                    'X:' + offsetX + '<br>' +
                    'Y:' + offsetY + '<br>' +
                    'IC:' + vm.event.ideocapid + '<br>';
            }

            vm.display = pinPointBoxHTML;
            vm.contentObjs[eventId] = angular.copy(pinPointBoxHTML);
        });

        if (!vm.deleteOpt) {
            this.divObj.draggable({ disabled: true });
            this.divObj.resizable({ disabled: true });
            this.divObj.css(vm.cssObjs[eventId]).html(vm.contentObjs[eventId]);
        }

        if (userFirstTimeOpen) {
            userFirstTimeOpen = false;
            $timeout(function() {
                if (vm.selectedEventIndex != undefined && vm.selectedEvent && vm.selectedEvent.length > 0) {
                    vm.selectedEvent = angular.copy(vm.originalSelectedEvent);
                    vm.drawRectangularBoxOverShopper();
                }

                selectedHumanInHumanList(0, vm.events[0]);
            }, 1000);
        }
    }

    var q = setInterval(function() {

        console.log("q SetInterval");

        var userId = $localStorage.user ? $localStorage.user.userId : null;
        // if window.dashboard === false, terminate polling
        if (!window.dashboard) {
            clearInterval(q);
        }
        if (vm.analysing === false && startPolling) {
            startPolling = false;
            VideoService
                .getUnlockedVideos(userId)
                .success(function(data, status) {
                    vm.videos = data;
                    startPolling = true;
                });
        }
    }, 30000);

};