var mongoose = require('mongoose')
    , config = require('../config')
    , helper = require('../utils/helper')
    , _ = require('lodash')
    , moment = require('moment')
    , fs = require('fs')
var zip = require('express-zip');
var json2csv = require('json2csv');
var alasql = require('alasql');
var mergeJSON = require("merge-json") ;
var csv = require("fast-csv");

exports.downloadLogFiles = function (req, res) {
    res.zip([
        { path: 'err.log', name: 'err.log' },
        { path: 'out.log', name: 'out.log' }
    ]);
};

exports.getSubmittedEventToCSVExport = function (req, res) {
    var body = req.body;

    var byColumn = ' videoId ';
    var inputValues = body.videoId;
    if(body.cameraId)
    {
        byColumn = ' cameraId ';
        inputValues = body.cameraId;
    }

    var cameracode = body.cameracode;
    var clientname = body.clientname;

    var cameraId = body.cameraId;
    var clientsId = body.clientsId;

    var shopperFields = ['Human-UID','1st-UID','Clip-Id','Hum-ClipID','C-Start','C-Event-Start','C-Event-End','DwellTime','ShopperORStaff','UniqGrpID','GroupOf','Entrance'];//'Shopper_UID','Staff_UID',
    var skuFields = ['Human-UID','1st-UID','Clip-Id','Hum-ClipID','FrameNo','ShopperORStaff','C-Start','C-Event-Start','C-Event-End'];
    var gStaffFields = ['Human-UID','1st-UID','Clip-Id','Hum-ClipID','C-Start','C-Event-Start','C-Event-End','C-Profile Saved-Sec','FrameNo','ShopperORStaff'];
    var cStaffFields = ['Human-UID','1st-UID','Clip-Id','Hum-ClipID','C-Start','C-Event-Start','C-Event-End','C-Profile Saved-Sec','FrameNo','ShopperORStaff'];
    var sStaffFields = ['Human-UID','1st-UID','Clip-Id','Hum-ClipID','C-Start','C-Event-Start','C-Event-End','C-Profile Saved-Sec','FrameNo','ShopperORStaff'];
    var systemFields = ['Human-UID','1st-UID','Clip-Id','Clip-Id-F','C-Start','C-Event-Start','C-Event-End','C-Profile Saved-Sec','ClientName','CameraCode','EventId','FrameNo','Xaxis','Yaxis','Xendaxis','Yendaxis','x1','y1','x2','y2','PlayingWidth','PlayingHeight','OriginalVideoWidth','OriginalVideoHeight','S3-path'];
    var otherFields = [];
    var exitFields = [];

    var finalEventsReplaceObj = {"Human-UID":"E00 Human-UID","1st-UID":"E01 1st-UID","Clip-Id":"E02 Clip-Id","Hum-ClipID":"E03 Hum-ClipID","C-Start":"E04 C-Start","C-Event-Start":"E05 C-Event-Start","C-Event-End":"E06 C-Event-End","DwellTime":"E07 DwellTime","ShopperORStaff":"E08 ShopperORStaff","Ending Action":"E09 Ending Action","Shopper":"E10 Shopper","Already-In Location":"E11 Already-In Location","Gender":"E12 Gender","Entrance":"B09 Entrance","Location":"E13 Location","Staff's Gender":"E14 Staff's Gender","Age":"E15 Age","Staff's Attire":"E16 Staff's Attire","Color of Top":"E17 Color of Top","Top Pattern":"E18 Top Pattern","Staff's Color of Top":"E19 Staff's Color of Top","Dress":"E20 Dress","Staff's Location":"E21 Staff's Location","Staff Type":"E23 Staff Type","Special":"E24 Special","Special 1":"E25 Special 1","Hair / Head Cover":"E26 Hair / Head Cover","Shape":"E27 Shape","Race":"E28 Race","A-On Start":"E29 A-On Start","Xaxis":"E30 Xaxis","Yaxis":"E31 Yaxis","Xendaxis":"E32 Xendaxis","Yendaxis":"E33 Yendaxis","1-Percentage":"E34 1-Percentage","1-Matched-Human-UID":"E35 1-Matched-Human-UID","2-Percentage":"E36 2-Percentage","2-Matched-Human-UID":"E37 2-Matched-Human-UID","3-Percentage":"E38 3-Percentage","3-Matched-Human-UID":"E39 3-Matched-Human-UID","comments":"E40 comments","comments1":"E41 comments1","comments2":"E42 comments2","A-On-Shpr-Prof":"E43 A-On-Shpr-Prof","A-On-Stf-Prof":"E44 A-On-Stf-Prof","C-Profile Saved-Sec":"E45 C-Profile Saved-Sec","FrameNo":"E46 FrameNo","EndFrameNo":"E47 EndFrameNo","Grp-ID-ifGroup":"Grp-ID-ifGroup","UniqGrpID":"UniqGrpID","GroupOf":"GroupOf"};
    var behaviourReplaceObj = {"Human-UID":"B00 Human-UID","1st-UID":"B01 1st-UID","Clip-Id":"B02 Clip-Id","Hum-ClipID":"B03 Hum-ClipID","FrameNo":"B04 FrameNo","ShopperORStaff":"B05 ShopperORStaff","C-Start":"B06 C-Start","C-Event-Start":"B07 C-Event-Start","C-Event-End":"B08 C-Event-End","Entrance":"B09 Entrance","AisleActionStart":"B10 AisleActionStart","Aisle Location":"B11 Aisle Location","ActionStart":"B12 ActionStart","ActionStopContinue":"B13 ActionStopContinue","Action Location":"B14 Action Location","Product Location":"B14 Product Location","Location":"B14 Location","InterActionStart":"B15 InterActionStart","InterActionStopContinue":"B16 InterActionStopContinue","Staff Help":"B17 Staff Help","Help Offered":"B18 Help Offered","Payment Type":"B19 Payment Type","Interaction Location":"B11 Interaction Location","Customer Service Efficiency":"B20 Customer Service Efficiency","Stock Availability":"B20 Stock Availability","Table Availability":"B21 Table Availability","Last Action":"B22 Last Action","A-On Behavr":"B23 A-On Behavr","V-Shpr Exit":"B24 V-Shpr Exit","C-actionStartTime-Sec":"B25 C-actionStartTime-Sec","C-actionStopTime-Sec":"B26 C-actionStopTime-Sec","C-actionTime-Sec":"B27 C-actionTime-Sec","I-actionStartTime-Sec":"B28 I-actionStartTime-Sec","I-actionStopTime-Sec":"B29 I-actionStopTime-Sec","I-actionTime-Sec":"B30 I-actionTime-Sec","comments":"B31 comments","C-Profile Saved-Sec":"B32 C-Profile Saved-Sec"};
    var gStaffReplaceObj = {"Human-UID":"G00 Human-UID","1st-UID":"G01 1st-UID","Clip-Id":"G02 Clip-Id","Hum-ClipID":"G03 Hum-ClipID","C-Start":"G04 C-Start","C-Event-Start":"G05 C-Event-Start","C-Event-End":"G06 C-Event-End","C-Profile Saved-Sec":"G07 C-Profile Saved-Sec","FrameNo":"G08 FrameNo","ShopperORStaff":"G09 ShopperORStaff","ActionStart":"G10 ActionStart","Type of Service":"G11 Type of Service","Type of Help Offered to Shopper":"G12 Type of Help Offered to Shopper","Offered Help":"G13 Offered Help","ActionStopContinue":"G14 ActionStopContinue","Location":"G15 Location","Action Location":"G15 Action Location","Staff's Gender":"G16 Staff's Gender","Exit":"G17 Exit","Staff's Attire":"G18 Staff's Attire","Staff's Color of Top":"G19 Staff's Color of Top","Staff's Location":"G20 Staff's Location","Staff Type":"G21 Staff Type","A-On-G-Stf-Behavr":"G22 A-On-G-Stf-Behavr","C-actionStartTime-Sec":"G23 C-actionStartTime-Sec","C-actionStopTime-Sec":"G24 C-actionStopTime-Sec","C-actionTime-Sec":"G25 C-actionTime-Sec","I-actionStartTime-Sec":"G26 I-actionStartTime-Sec","I-actionStopTime-Sec":"G27 I-actionStopTime-Sec","I-actionTime-Sec":"G28 I-actionTime-Sec","comments":"G29 comments"};
    var cStaffReplaceObj = {"Human-UID":"C00 Human-UID","1st-UID":"C01 1st-UID","Clip-Id":"C02 Clip-Id","Hum-ClipID":"C03 Hum-ClipID","C-Start":"C04 C-Start","C-Event-Start":"C05 C-Event-Start","C-Event-End":"C06 C-Event-End","C-Profile Saved-Sec":"C07 C-Profile Saved-Sec","FrameNo":"C08 FrameNo","ShopperORStaff":"C09 ShopperORStaff","ActionStart":"C10 ActionStart","ActionStopContinue":"C11 ActionStopContinue","Location":"C12 Location","Action Location":"C12 Action Location","Staff's Gender":"C13 Staff's Gender","Exit":"C14 Exit","Staff's Attire":"C15 Staff's Attire","Staff's Color of Top":"C16 Staff's Color of Top","Staff's Location":"C17 Staff's Location","Staff Type":"C18 Staff Type","A-On-S-Stf-Behavr":"C19 A-On-S-Stf-Behavr","C-actionStartTime-Sec":"C20 C-actionStartTime-Sec","C-actionStopTime-Sec":"C21 C-actionStopTime-Sec","C-actionTime-Sec":"C22 C-actionTime-Sec","I-actionStartTime-Sec":"C23 I-actionStartTime-Sec","I-actionStopTime-Sec":"C24 I-actionStopTime-Sec","I-actionTime-Sec":"C25 I-actionTime-Sec","comments":"C26 comments"};
    var sStaffReplaceObj = {"Human-UID":"S00 Human-UID","1st-UID":"S01 1st-UID","Clip-Id":"S02 Clip-Id","Hum-ClipID":"S03 Hum-ClipID","C-Start":"S04 C-Start","C-Event-Start":"S05 C-Event-Start","C-Event-End":"S06 C-Event-End","C-Profile Saved-Sec":"S07 C-Profile Saved-Sec","FrameNo":"S08 FrameNo","ShopperORStaff":"S09 ShopperORStaff","Number of Security Checks":"S10 Number of Security Checks","Number of Security Checks Missed":"S11 Number of Security Checks Missed","ActionStart":"S12 ActionStart","Staff's Gender":"S13 Staff's Gender","ActionStopContinue":"S14 ActionStopContinue","Staff's Attire":"S15 Staff's Attire","Location":"S16 Location","Action Location":"S16 Action Location","Staff's Color of Top":"S17 Staff's Color of Top","Exit":"S18 Exit","Staff's Location":"S19 Staff's Location","Staff Type":"S20 Staff Type","A-On-C-Stf-Behavr":"S21 A-On-C-Stf-Behavr","C-actionStartTime-Sec":"S22 C-actionStartTime-Sec","C-actionStopTime-Sec":"S23 C-actionStopTime-Sec","C-actionTime-Sec":"S24 C-actionTime-Sec","I-actionStartTime-Sec":"S25 I-actionStartTime-Sec","I-actionStopTime-Sec":"S26 I-actionStopTime-Sec","I-actionTime-Sec":"S27 I-actionTime-Sec","comments":"S28 comments"};
    mongoose.models.categories.find({project:body.project,camera:body.camera},{_id:1,orderId:1,name:1,catcode:1})
        .sort({ orderId: 1 })
        .exec(function (err, catList) {
            if (err) {
                console.dir(err)
            }

            var catCodeList = {};
            var catIds = [];
            _.each(catList, function (category) {
                catIds.push(category.id);
                catCodeList[category.catcode] = category.name;
            });

            var shprProfileSubCats = {};
            var pofSubCatList = [];

            var staff_subcats = [];
            mongoose.models.subcategories.find({category: {$in:catIds},isPrimary:1,type:{$exists:true}},{_id:1,orderId:1,name:1,category:1,percentage:1,type:1})
                .populate('category','_id orderId name')
                .sort({'orderId':1})
                .exec(function (err, subcats) {
                    if (err) {
                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                    }
                    _.each(subcats, function (subcat) {
                        if(subcat.category.orderId == 1 || subcat.category.orderId == 2 || subcat.category.orderId == 4)
                        {
                            if(subcat.type && subcat.type.length>0)
                            {
                                shopperFields.push(subcat.name);
                                if(subcat.category.orderId == 1 && subcat.name && subcat.name != 'Shopper')
                                {
                                    gStaffFields.push(subcat.name);
                                    sStaffFields.push(subcat.name);
                                    cStaffFields.push(subcat.name);
                                    staff_subcats.push(subcat.name);
                                }
                            }

                            if(subcat.category.orderId == 1 || subcat.category.orderId == 2)
                            {
                                if(subcat.percentage != null  && subcat.percentage != undefined && subcat.percentage > 0)
                                {
                                    shprProfileSubCats[subcat.name] = subcat.percentage;
                                    pofSubCatList.push(subcat.name);
                                }
                            }
                        }else if(subcat.category.orderId == 3)
                        {
                            skuFields.push(subcat.name);
                        }else if(subcat.category.orderId == 5)
                        {
                            gStaffFields.push(subcat.name);
                        }else if(subcat.category.orderId == 6)
                        {
                            sStaffFields.push(subcat.name);
                        }else if(subcat.category.orderId == 7)
                        {
                            cStaffFields.push(subcat.name);
                        }
                    });
                    shopperFields.push('A-On Start');
                    shopperFields.push('Xaxis');
                    shopperFields.push('Yaxis');
                    shopperFields.push('Xendaxis');
                    shopperFields.push('Yendaxis');
                    shopperFields.push('1-Percentage');
                    shopperFields.push('1-Matched-Human-UID');
                    shopperFields.push('2-Percentage');
                    shopperFields.push('2-Matched-Human-UID');
                    shopperFields.push('3-Percentage');
                    shopperFields.push('3-Matched-Human-UID');
                    shopperFields.push('un-Matched-Comment');
                    shopperFields.push('comments');
                    shopperFields.push('comments1');
                    shopperFields.push('comments2');

                    otherFields.push('A-On-Shpr-Prof');
                    exitFields.push('A-On-Stf-Prof');

                    skuFields.push('A-On Behavr');
                    skuFields.push('V-Shpr Exit');
                    skuFields.push('C-actionStartTime-Sec');
                    skuFields.push('C-actionStopTime-Sec');
                    skuFields.push('C-actionTime-Sec');

                    skuFields.push('I-actionStartTime-Sec');
                    skuFields.push('I-actionStopTime-Sec');
                    skuFields.push('I-actionTime-Sec');

                    skuFields.push('comments');
                    skuFields.push('C-Profile Saved-Sec');

                    gStaffFields.push('A-On-G-Stf-Behavr');
                    gStaffFields.push('C-actionStartTime-Sec');
                    gStaffFields.push('C-actionStopTime-Sec');
                    gStaffFields.push('C-actionTime-Sec');

                    gStaffFields.push('I-actionStartTime-Sec');
                    gStaffFields.push('I-actionStopTime-Sec');
                    gStaffFields.push('I-actionTime-Sec');

                    gStaffFields.push('comments');

                    cStaffFields.push('A-On-C-Stf-Behavr');
                    cStaffFields.push('C-actionStartTime-Sec');
                    cStaffFields.push('C-actionStopTime-Sec');
                    cStaffFields.push('C-actionTime-Sec');

                    cStaffFields.push('I-actionStartTime-Sec');
                    cStaffFields.push('I-actionStopTime-Sec');
                    cStaffFields.push('I-actionTime-Sec');

                    cStaffFields.push('comments');

                    sStaffFields.push('A-On-S-Stf-Behavr');
                    sStaffFields.push('C-actionStartTime-Sec');
                    sStaffFields.push('C-actionStopTime-Sec');
                    sStaffFields.push('C-actionTime-Sec');

                    sStaffFields.push('I-actionStartTime-Sec');
                    sStaffFields.push('I-actionStopTime-Sec');
                    sStaffFields.push('I-actionTime-Sec');

                    sStaffFields.push('comments');

                    shopperFields = shopperFields.concat(otherFields);
                    shopperFields = shopperFields.concat(exitFields);

                    shopperFields.push('C-Profile Saved-Sec');
                    shopperFields.push('FrameNo');
                    shopperFields.push('EndFrameNo');

                    var draftEventFields = _.cloneDeep(shopperFields);
                    var uidIndex = draftEventFields.indexOf('1st-UID');
                    draftEventFields.splice(uidIndex,1);

                    mongoose.models.videos.find({camera:body.camera},{_id:0,videoId:1})
                        .sort({ videoId: 1 })
                        .exec(function (err, ordVideosList) {
                            if (err) {
                                console.dir(err)
                            }
                            var videoOrderList = [];
                            _.each(ordVideosList, function (videoObj) {
                                videoOrderList.push(videoObj.videoId);
                            });
                            mongoose.models.videos.find({videoId: {$in: body.videoId}}).exec(function (err, videos) {
                                if (err) {
                                    return res.status(500).json({error: 'Error with mongoDB connection.'});
                                }
                                var videosObjList = {};
                                var dateVideoObj = {};
                                for (var vidLen = 0; vidLen < videos.length; vidLen++) {
                                    dateVideoObj[videos[vidLen].videoId] = videos[vidLen].dateOfTheVideo;
                                    videosObjList[videos[vidLen].videoId] = videos[vidLen];
                                }

                                var contShopArr = [];
                                var prevContShopArr = [];
                                var contStfArr = [];
                                var prevContStfArr = [];
                                var existShopArr = [];
                                var prevVideoId = '';
                                var cont_vid_frm_arr = [];
                                var frame_video_com = '';

                                mongoose.models.events.find({videoId: {$in: body.videoId}, isDiscarded: 0}).sort({'videoId': 1, 'frameno': 1}).exec(function (err, events) {
                                    if (err) {

                                        console.log("Error1237:" + err)
                                        return res.status(500).json({error: 'Error with mongoDB connection.'});
                                    }

                                    var readMeTxt =
                                        "Client Name : " + clientname + "\r\n" +
                                        "Camera Code : " + cameracode + "\r\n" +
                                        "This report contains videosIds of :  " + body.videoId;
                                    var arrLen = events.length;
                                    var shopperObj = [];
                                    var skuBehaviour = [];
                                    var gStaffBehaviour = [];
                                    var cStaffBehaviour = [];
                                    var sStaffBehaviour = [];
                                    var systemValues = [];

                                    var previousObjPers = {};
                                    var preShopperProArr = {};
                                    var preHumIdPer = {};
                                    var preHumIdPresentHumId = {};
                                    var already_in_percentage = {};

                                    var HUMAN_UID_GLOBAL = '';
                                    var AUTO_VIDEOID_GLOBAL = '';
                                    var Human_UID_GLOBAL = '';
                                    var first_frame = '';
                                    var video_frame_arr = [];

                                    var already_in_shpr_obj = {};
                                    var previous_percentage_obj_arr = {};

                                    var continue_shopper_array_obj = {};
                                    var alreadyin_shopper_array_obj = {};

                                    var continue_events_arr = {};
                                    var uniqGrpObjList = {};
                                    function setMatchPercentages() {
                                        var cont_shpr_arr = [];
                                        for (var contShopperId in preHumIdPer) {

                                            var percentage = preHumIdPer[contShopperId];
                                            var currentId = preHumIdPresentHumId[contShopperId];

                                            cont_shpr_arr.push(contShopperId);

                                            var percentage_object = previous_percentage_obj_arr[currentId];

                                            delete percentage_object[contShopperId];
                                            delete previous_percentage_obj_arr[currentId];

                                            already_in_shpr_obj[currentId]['1-Percentage'] = percentage;
                                            already_in_shpr_obj[currentId]['1-Matched-Human-UID'] = contShopperId;

                                            setPercentages(contShopperId, currentId, percentage_object);

                                            if (prevContShopArr.length > 0 && already_in_shpr_obj.length > 0 && prevContShopArr.length != already_in_shpr_obj.length) {
                                                var unMatchedComment = "Already-IN Shoppers Are More than Continue Shoppers."
                                                if (prevContShopArr.length > already_in_shpr_obj.length) {
                                                    unMatchedComment = "Continue Shoppers Are More Than Already-IN Shoppers."
                                                }

                                                already_in_shpr_obj[currentId]['un-Matched-Comment'] = unMatchedComment;
                                            }


                                        }

                                        for (var already_in_shopperId in previous_percentage_obj_arr) {

                                            var percentage_object = previous_percentage_obj_arr[already_in_shopperId];

                                            delete previous_percentage_obj_arr[already_in_shopperId];

                                            var laterAppend = {};
                                            for (var i in cont_shpr_arr) {
                                                laterAppend[cont_shpr_arr[i]] = percentage_object[cont_shpr_arr[i]];
                                                delete percentage_object[cont_shpr_arr[i]];
                                            }

                                            var maxValKey = geth(percentage_object);
                                            if (percentage_object[maxValKey] > 0) {
                                                cont_shpr_arr.push(maxValKey);
                                                already_in_shpr_obj[already_in_shopperId]['1-Percentage'] = percentage_object[maxValKey];
                                                already_in_shpr_obj[already_in_shopperId]['1-Matched-Human-UID'] = maxValKey;
                                                delete percentage_object[maxValKey];
                                            }

                                            percentage_object = mergeJSON.merge(percentage_object, laterAppend);

                                            setPercentages(maxValKey, already_in_shopperId, percentage_object);
                                        }
                                    }

                                    function setPercentages(contShopperId, currentId, percentage_object) {
                                        var pre_event = continue_events_arr[contShopperId];
                                        if (pre_event != null && pre_event != undefined) {
                                            if (pre_event['1-Matched-Human-UID'] != null && pre_event['1-Matched-Human-UID'] != undefined && pre_event['1-Matched-Human-UID'] != '') {
                                                pre_event['1st-UID'] = continue_events_arr[pre_event['1-Matched-Human-UID']]['1st-UID'];
                                            } else {
                                                pre_event['1st-UID'] = contShopperId;
                                            }

                                            already_in_shpr_obj[currentId]['1st-UID'] = pre_event['1st-UID'];
                                        }

                                        var maxValKey = geth(percentage_object);
                                        if (percentage_object[maxValKey] > 0) {
                                            already_in_shpr_obj[currentId]['2-Percentage'] = percentage_object[maxValKey];
                                            already_in_shpr_obj[currentId]['2-Matched-Human-UID'] = maxValKey;

                                            delete percentage_object[maxValKey];
                                        }

                                        maxValKey = geth(percentage_object);
                                        if (percentage_object[maxValKey] > 0) {
                                            already_in_shpr_obj[currentId]['3-Percentage'] = percentage_object[maxValKey];
                                            already_in_shpr_obj[currentId]['3-Matched-Human-UID'] = maxValKey;

                                            delete percentage_object[maxValKey];
                                        }

                                        var sku_cont_obj = continue_shopper_array_obj[contShopperId];
                                        if (sku_cont_obj != null && sku_cont_obj != undefined) {
                                            for (var len = 0; len < sku_cont_obj.length; len++) {
                                                sku_cont_obj[len]['1st-UID'] = pre_event['1st-UID'];

                                                var cloneed_sku_obj = _.cloneDeep(sku_cont_obj[len]);

                                                cloneed_sku_obj['Clip-Id'] = already_in_shpr_obj[currentId]['Clip-Id'];
                                                cloneed_sku_obj['Human_UID'] = already_in_shpr_obj[currentId]['Human_UID'];
                                                cloneed_sku_obj['Hum-ClipID'] = already_in_shpr_obj[currentId]['Hum-ClipID'];
                                                cloneed_sku_obj['FrameNo'] = already_in_shpr_obj[currentId]['FrameNo'];

                                                //skuBehaviour.push(cloneed_sku_obj);
                                            }
                                        }

                                        var all_ready_in = alreadyin_shopper_array_obj[currentId];
                                        if (all_ready_in != null && all_ready_in != undefined) {
                                            for (var len = 0; len < all_ready_in.length; len++) {
                                                if (pre_event != null && pre_event != undefined) {
                                                    all_ready_in[len]['1st-UID'] = pre_event['1st-UID'];
                                                }
                                            }
                                        }
                                    }

                                    for (var len = 0; len < arrLen; len++) {
                                        var shopper = events[len]['analysis']['START'];
                                        var shopperProfile = events[len]['analysis']['SHOPPERPROFILE'];
                                        var staffProfile = events[len]['analysis']['STAFFPROFILE'];

                                        if (shopperProfile != null && shopperProfile != undefined && shopperProfile.comments) {
                                            shopperProfile['comments1'] = shopperProfile.comments;
                                        }

                                        if (staffProfile != null && staffProfile != undefined && staffProfile.comments) {
                                            staffProfile['comments2'] = staffProfile.comments;
                                        }

                                        if (!shopper) {
                                            shopper = {};
                                        }
                                        var eventId = Number(events[len].eventId);
                                        HUMAN_UID_GLOBAL = cameraId + '' + events[len].videoId + '' + eventId;
                                        HUMAN_UID_GLOBAL = Number(HUMAN_UID_GLOBAL);

                                        AUTO_VIDEOID_GLOBAL = 100000 + events[len].videoId;

                                        shopper.Human_UID = HUMAN_UID_GLOBAL;
                                        shopper['Human-UID'] = HUMAN_UID_GLOBAL;

                                        //var shopperProfileCopyObj = _.cloneDeep(shopperProfile);
                                        var shopperProfileCopyObj = shopperProfile;

                                        if (!shopperProfileCopyObj || shopperProfileCopyObj == undefined) {
                                            shopperProfileCopyObj = {};
                                        }
                                        shopperProfileCopyObj.Human_UID = HUMAN_UID_GLOBAL;

                                        shopper['Clip-Id'] = AUTO_VIDEOID_GLOBAL;

                                        var clipUserName = (events[len].name).replace("Shopper-", "Human-");
                                        shopper['Hum-ClipID'] = clipUserName;

                                        var metaDataObj = videosObjList[events[len].videoId].metaDataObj;

                                        if(metaDataObj != null && metaDataObj != undefined && metaDataObj.GFPS != null && metaDataObj.GFPS != undefined)
                                        {
                                            if(metaDataObj.FK != null && metaDataObj.FK != undefined && metaDataObj.FS != null && metaDataObj.FS != undefined)
                                            {
                                                events[len].startTime = ( events[len].frameno / metaDataObj.GFPS ) * (( metaDataObj.FK+metaDataObj.FS) /metaDataObj.FK );

                                                events[len]['endFrameNo'] = (events[len].endTime * metaDataObj.GFPS);
                                                shopper['EndFrameNo'] = events[len]['endFrameNo'];
                                                events[len].endTime = ( events[len]['endFrameNo'] / metaDataObj.GFPS ) * (( metaDataObj.FK+metaDataObj.FS) /metaDataObj.FK );
                                            }
                                        }
                                        var videoStartTime = moment(dateVideoObj[events[len].videoId]).add(events[len].startTime, 'seconds').format("MM-DD-YYYY hh:mm:ss A");

                                        shopper['C-Start'] = moment(dateVideoObj[events[len].videoId]).format("MM-DD-YYYY hh:mm:ss A");
                                        shopper['C-Event-Start'] = videoStartTime;

                                        var videoEndTime = moment(dateVideoObj[events[len].videoId]).add(events[len].endTime, 'seconds').format("MM-DD-YYYY hh:mm:ss A");
                                        shopper['C-Event-End'] = videoEndTime;

                                        shopper['DwellTime'] = moment.utc((events[len].endTime - events[len].startTime) * 1000).format('00:mm:ss');//.toString();
                                        //shopper['DwellTime'] = convertToMinSeconds(events[len].endTime-events[len].startTime);
                                        var diffSeconds = Number(moment.duration(moment(videoEndTime).diff(videoStartTime)).asSeconds());
                                        if(diffSeconds == 0 || diffSeconds =='0')
                                        {
                                            diffSeconds = 1;
                                            shopper['DwellTime'] = moment.utc((0) * 1000).format('00:mm:ss');
                                        }

                                        shopper.StartTime = events[len].startTime;
                                        shopper['C-Profile Saved-Sec'] = events[len].endTime;
                                        shopper.Xaxis = events[len].xaxis;
                                        shopper.Yaxis = events[len].yaxis;
                                        shopper.Xendaxis = events[len].xendaxis;
                                        shopper.Yendaxis = events[len].yendaxis;
                                        shopper.FrameNo = events[len].frameno;

                                        shopper.ShopperORStaff = events[len].shopperorstaff;

                                        if (prevVideoId != events[len].videoId) {
                                            var indexOfVid = videoOrderList.indexOf(events[len].videoId);
                                            if ((indexOfVid-1) >=0 && videoOrderList[indexOfVid - 1] == prevVideoId) {
                                                setMatchPercentages();
                                            }else
                                            {
                                                contShopArr = [];
                                            }

                                            already_in_shpr_obj = {};
                                            previous_percentage_obj_arr = {};
                                            already_in_percentage = {};

                                            previousObjPers = {};
                                            preShopperProArr = {};
                                            preHumIdPer = {};
                                            preHumIdPresentHumId = {};

                                            prevContShopArr = contShopArr;
                                            contShopArr = [];

                                            prevContStfArr = _.cloneDeep(contStfArr);
                                            contStfArr = [];

                                            cont_vid_frm_arr = [];
                                        }

                                        if (frame_video_com != (events[len].videoId + "###" + shopper.FrameNo)) {
                                            //prevContShopArr = contShopArr;
                                            //contShopArr = [];
                                        }

                                        prevVideoId = events[len].videoId;
                                        frame_video_com = events[len].videoId + "###" + shopper.FrameNo;

                                        if (video_frame_arr.indexOf(frame_video_com) < 0) {
                                            video_frame_arr.push(frame_video_com);
                                            cont_vid_frm_arr.push(frame_video_com);
                                        }

                                        if (shopper.Shopper && shopper.Shopper != null && shopper.Shopper != undefined && (shopper.Shopper).substr(0, 3) == 'NEW') {
                                            shopper['Shopper_UID'] = HUMAN_UID_GLOBAL;
                                            shopper.ShopperORStaff = 'SHOPPER'
                                        } else if (shopper.Shopper && shopper.Shopper != null && shopper.Shopper != undefined)// && video_frame_arr.length ==1
                                        {
                                            shopper['Shopper_UID'] = HUMAN_UID_GLOBAL;
                                            shopper.ShopperORStaff = 'SHOPPER'
                                        } else if (shopper['Staff Type'] && shopper['Staff Type'] != null && shopper['Staff Type'] != undefined && (shopper['Staff Type']).substr(0, 3) == 'NEW') {
                                            shopper['Staff_UID'] = HUMAN_UID_GLOBAL;
                                            shopper.ShopperORStaff = 'STAFF'
                                        } else if (shopper['Staff Type'] && shopper['Staff Type'] != null && shopper['Staff Type'] != undefined)// && video_frame_arr.length ==1
                                        {
                                            shopper['Staff_UID'] = HUMAN_UID_GLOBAL;
                                            shopper.ShopperORStaff = 'STAFF'
                                        }

                                        first_frame = events[len].frameno;

                                        var systemObj = {};

                                        systemObj['Clip-Id'] = AUTO_VIDEOID_GLOBAL
                                        systemObj['Clip-Id-F'] = events[len].videoId;
                                        systemObj['S3-path'] = videosObjList[events[len].videoId].bucket + '/' + videosObjList[events[len].videoId].url;
                                        systemObj['Human-UID'] = shopper.Human_UID;
                                        systemObj['ClientName'] = clientname;
                                        systemObj.CameraCode = cameracode;
                                        systemObj.EventId = events[len].eventId;
                                        systemObj.FrameNo = events[len].frameno;
                                        systemObj['C-Profile Saved-Sec'] = shopper['C-Profile Saved-Sec'];
                                        systemObj['C-Event-End'] = shopper['C-Event-End'];

                                        var xFactor = Number(events[len].originalVideoWidth) / Number(events[len].playingWidth);
                                        var yFactor = Number(events[len].originalVideoHeight) / Number(events[len].playingHeight);

                                        systemObj.Xaxis = Number(events[len].xaxis * xFactor).toFixed();
                                        systemObj.Yaxis = Number(events[len].yaxis * yFactor).toFixed();
                                        systemObj.Xendaxis = Number(events[len].xendaxis * xFactor).toFixed();
                                        systemObj.Yendaxis = Number(events[len].yendaxis * yFactor).toFixed();
                                        systemObj.x1 = Number(events[len].xaxis).toFixed();
                                        systemObj.y1 = Number(events[len].yaxis).toFixed();
                                        systemObj.x2 = Number(events[len].xendaxis).toFixed();
                                        systemObj.y2 = Number(events[len].yendaxis).toFixed();
                                        systemObj.PlayingWidth = events[len].playingWidth;
                                        systemObj.PlayingHeight = events[len].playingHeight;
                                        systemObj.OriginalVideoWidth = events[len].originalVideoWidth;
                                        systemObj.OriginalVideoHeight = events[len].originalVideoHeight;

                                        systemObj['C-Start'] = shopper['C-Start'];
                                        systemObj['C-Event-Start'] = shopper['C-Event-Start'];


                                        systemValues.push(systemObj);

                                        if(shopper.timeSpent == null || shopper.timeSpent == undefined)
                                        {
                                            shopper.timeSpent = 0;
                                        }

                                        if (shopper && shopper.timeSpent) {
                                            shopper.timeSpent = Number(shopper.timeSpent) / 1000;
                                            shopper['A-On Start'] = shopper.timeSpent;
                                            delete shopper.timeSpent;
                                        }

                                        if (!shopperProfile) {
                                            shopperProfile = {};
                                        } else if (shopperProfile.timeSpent) {
                                            shopperProfile.timeSpent = Number(shopperProfile.timeSpent) / 1000;
                                            shopperProfile['A-On-Shpr-Prof'] = shopperProfile.timeSpent;
                                            delete shopperProfile.timeSpent;
                                        }

                                        if (!staffProfile) {
                                            staffProfile = {};
                                        } else if (staffProfile.timeSpent) {
                                            if(staffProfile.timeSpent == null || staffProfile.timeSpent == undefined)
                                            {
                                                staffProfile.timeSpent = 0;
                                            }
                                            staffProfile.timeSpent = Number(staffProfile.timeSpent) / 1000;
                                            staffProfile['A-On-Stf-Prof'] = staffProfile.timeSpent;
                                            delete staffProfile.timeSpent;
                                        }

                                        if(shopperProfile != null && shopperProfile!= undefined
                                            && shopperProfile['Grp-ID-ifGroup'] != null && shopperProfile['Grp-ID-ifGroup'] != undefined)
                                        {
                                            var appendGrpVidId = events[len].videoId+"";
                                            if(appendGrpVidId.length>2)
                                            {
                                                appendGrpVidId = appendGrpVidId.substr(-3);
                                            }
                                            var uniqGrpIdVal = shopperProfile['Grp-ID-ifGroup'].substring(0, 2)+"-"+appendGrpVidId;
                                            if(shopperProfile['Grp-ID-ifGroup'].length > 2)
                                            {
                                                uniqGrpIdVal = shopperProfile['Grp-ID-ifGroup'].substring(0, 3)+"-"+appendGrpVidId;
                                            }

                                            shopperProfile['UniqGrpID'] = uniqGrpIdVal;
                                            if(uniqGrpObjList[uniqGrpIdVal] == null || uniqGrpObjList[uniqGrpIdVal] == undefined)
                                            {
                                                uniqGrpObjList[uniqGrpIdVal] = 1
                                            }else
                                            {
                                                uniqGrpObjList[uniqGrpIdVal] = uniqGrpObjList[uniqGrpIdVal] + 1;
                                            }
                                        }
                                        //var obj = Object.assign(shopper, exit, other);
                                        //shopperObj.push(obj);

                                        var mreged_json_obj = mergeJSON.merge(shopper, shopperProfile);
                                        mreged_json_obj = mergeJSON.merge(mreged_json_obj, staffProfile);
                                        shopperObj.push(mreged_json_obj);

                                        var continue_shopping_flag = false;
                                        if (_.values(staffProfile).indexOf("CONTINUE SHOPPING") > -1 || _.values(staffProfile).indexOf("CONTINUE CUTTING") > -1 || _.values(staffProfile).indexOf("NO EXIT") > -1 || _.values(staffProfile).indexOf("CONTINUE EATING OR STAYING IN STORE") > -1) {
                                            if (shopper['Shopper_UID'] && shopper['Shopper_UID'] != null && shopper['Shopper_UID'] != undefined)// && shopper.ShopperORStaff == 'SHOPPER')
                                            {
                                                //contShopArr.push(shopperProfileCopyObj);
                                                contShopArr.push(mreged_json_obj);
                                                continue_shopping_flag = true;
                                            }
                                        }

                                        var aready_in_flag = false;
                                        //cont_vid_frm_arr.length ==1 &&
                                        if (shopper.Shopper && shopper.Shopper != null && shopper.Shopper != undefined && shopper.ShopperORStaff == 'SHOPPER' && (shopper.Shopper).substr(0, 3) == 'NEW') {
                                        } else if (shopper.Shopper && shopper.Shopper != null && shopper.Shopper != undefined && shopper.ShopperORStaff == 'SHOPPER' && prevContShopArr.length > 0) {
                                            aready_in_flag = true;
                                            var perArr = [];
                                            var perObj = {};
                                            for (var cntShprLen = 0; cntShprLen < prevContShopArr.length; cntShprLen++) {
                                                var pObj = prevContShopArr[cntShprLen];
                                                if (shopper.ShopperORStaff == 'SHOPPER') {
                                                    var percentage = 0;
                                                    if (shopperProfile && shopperProfile != undefined && pObj && pObj != undefined) {
                                                        for (var checkLen = 0; checkLen < pofSubCatList.length; checkLen++) {
                                                            var subCatKeyName = pofSubCatList[checkLen];
                                                            var checkPercentage = shprProfileSubCats[subCatKeyName];
                                                            if (checkPercentage && checkPercentage != undefined && checkPercentage != null && mreged_json_obj[subCatKeyName] && pObj[subCatKeyName]) {
                                                                if (pObj['Location'] && pObj['Location'] != null && pObj['Location'] != undefined && subCatKeyName == 'Already-In Location' && mreged_json_obj[subCatKeyName] == pObj['Location']) {
                                                                    percentage = percentage + checkPercentage;
                                                                } else if (mreged_json_obj[subCatKeyName] == pObj[subCatKeyName]) {
                                                                    percentage = percentage + checkPercentage;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    perArr.push(percentage);
                                                    perObj[pObj.Human_UID] = percentage;

                                                    if ((preHumIdPer[pObj.Human_UID] == null || preHumIdPer[pObj.Human_UID] == undefined || preHumIdPer[pObj.Human_UID] < percentage)) {
                                                        if (already_in_percentage[HUMAN_UID_GLOBAL] == null || already_in_percentage[HUMAN_UID_GLOBAL] == undefined || already_in_percentage[HUMAN_UID_GLOBAL] < percentage) {
                                                            for (var contShopperId in preHumIdPer) {
                                                                if (contShopperId != pObj.Human_UID && preHumIdPresentHumId[contShopperId] == HUMAN_UID_GLOBAL) {
                                                                    delete preHumIdPer[contShopperId];
                                                                    delete preHumIdPresentHumId[contShopperId];
                                                                }
                                                            }
                                                            preHumIdPer[pObj.Human_UID] = Number(percentage);
                                                            preHumIdPresentHumId[pObj.Human_UID] = HUMAN_UID_GLOBAL;
                                                            already_in_percentage[HUMAN_UID_GLOBAL] = Number(percentage);
                                                        }
                                                    }
                                                }
                                            }

                                            previousObjPers[HUMAN_UID_GLOBAL] = _.cloneDeep(perObj);
                                            preShopperProArr[HUMAN_UID_GLOBAL] = shopperProfile;

                                            previous_percentage_obj_arr[HUMAN_UID_GLOBAL] = _.cloneDeep(perObj);
                                        } else if (shopper.ShopperORStaff == 'STAFF' && shopper['Staff Type'] != undefined && (shopper['Staff Type']).substr(0, 3) == 'NEW') {
                                            //shopper['Staff_UID'] = HUMAN_UID_GLOBAL;
                                        } else if (shopper.ShopperORStaff == 'STAFF' && shopper['Staff Type'] != undefined && cont_vid_frm_arr.length == 1 && prevContStfArr.length > 0) {
                                            var perArr = [];
                                            var perObj = {};
                                            for (var cntStfLen = 0; len < prevContStfArr.length; cntStfLen++) {
                                                var pObj = prevContShopArr[cntStfLen];
                                                if (shopper.ShopperORStaff == 'STAFF') {
                                                    var percentage = 0;
                                                    if (shopperProfile && shopperProfile != undefined && pObj && pObj != undefined) {
                                                        for (var checkLen = 0; checkLen < pofSubCatList.length; checkLen++) {
                                                            var subCatKeyName = pofSubCatList[checkLen];
                                                            var checkPercentage = shprProfileSubCats[subCatKeyName];
                                                            if (checkPercentage && checkPercentage != undefined && checkPercentage != null && mreged_json_obj[subCatKeyName] && pObj[subCatKeyName] && mreged_json_obj[subCatKeyName] == pObj[subCatKeyName]) {
                                                                percentage = percentage + checkPercentage;
                                                            }
                                                        }
                                                    }
                                                    perArr.push(percentage);
                                                    perObj[pObj.Human_UID] = percentage;

                                                    if ((preHumIdPer[pObj.Human_UID] == null || preHumIdPer[pObj.Human_UID] == undefined || preHumIdPer[pObj.Human_UID] < percentage)) {
                                                        if (already_in_percentage[HUMAN_UID_GLOBAL] == null || already_in_percentage[HUMAN_UID_GLOBAL] == undefined || already_in_percentage[HUMAN_UID_GLOBAL] < percentage) {
                                                            for (var contShopperId in preHumIdPer) {
                                                                if (contShopperId != pObj.Human_UID && preHumIdPresentHumId[contShopperId] == HUMAN_UID_GLOBAL) {
                                                                    delete preHumIdPer[contShopperId];
                                                                    delete preHumIdPresentHumId[contShopperId];
                                                                }
                                                            }
                                                            preHumIdPer[pObj.Human_UID] = Number(percentage);
                                                            preHumIdPresentHumId[pObj.Human_UID] = HUMAN_UID_GLOBAL;
                                                            already_in_percentage[HUMAN_UID_GLOBAL] = Number(percentage);
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        if (aready_in_flag && shopper.ShopperORStaff == 'SHOPPER') {
                                            already_in_shpr_obj[HUMAN_UID_GLOBAL] = mreged_json_obj;
                                        }

                                        var skuArrObjs = [];
                                        var skuBehavArr = events[len]['analysis']['SKUBEHAVIOUR'];
                                        if (skuBehavArr && skuBehavArr.length > 0) {
                                            var continuingShopper = false;
                                            var shpEntranceVal = "";
                                            for (var skuLen = 0; skuLen < skuBehavArr.length; skuLen++) {
                                                var skuObj = skuBehavArr[skuLen];
                                                if (skuObj != null && skuObj != undefined) {
                                                    skuObj['Human-UID'] = shopper.Human_UID;
                                                    skuObj['Clip-Id'] = AUTO_VIDEOID_GLOBAL;

                                                    if(skuObj['Entrance'] && skuObj['Entrance'] != null && skuObj['Entrance'] != undefined)
                                                    {
                                                        if(skuLen == 0 || shpEntranceVal == "")
                                                        {
                                                            shpEntranceVal = skuObj['Entrance'];
                                                        }else
                                                        {
                                                            //shpEntranceVal = shpEntranceVal + "," + skuObj['Entrance'];
                                                        }
                                                    }
                                                    mreged_json_obj['Entrance'] = shpEntranceVal;

                                                    skuObj['Hum-ClipID'] = clipUserName;
                                                    skuObj.FrameNo = events[len].frameno;
                                                    skuObj.ShopperORStaff = shopper.ShopperORStaff;

                                                    skuObj['C-Start'] = shopper['C-Start'];
                                                    skuObj['C-Event-Start'] = shopper['C-Event-Start'];

                                                    if(skuObj.timeSpent == null || skuObj.timeSpent ==undefined)
                                                    {
                                                        skuObj.timeSpent = 0;
                                                    }
                                                    skuObj.timeSpent = Number(skuObj.timeSpent) / 1000;
                                                    skuObj['A-On Behavr'] = skuObj.timeSpent;
                                                    skuObj['V-Shpr Exit'] = skuObj.exitTime;

                                                    skuObj['C-actionStartTime-Sec'] = skuObj.actionStartTime;
                                                    skuObj['C-actionStopTime-Sec'] = skuObj.actionStopTime;
                                                    skuObj['C-actionTime-Sec'] = skuObj.actionStopTime - skuObj.actionStartTime;

                                                    setActionTime(skuObj);
                                                    setInterActionTime(skuObj);


                                                    skuObj['C-Profile Saved-Sec'] = shopper['C-Profile Saved-Sec'];
                                                    skuObj['C-Event-End'] = shopper['C-Event-End'];

                                                    if (_.values(skuObj).indexOf("CONTINUE SHOPPING") > -1 || _.values(skuObj).indexOf("CONTINUE CUTTING") > -1 || _.values(skuObj).indexOf("NO EXIT") > -1) {
                                                        continuingShopper = true;
                                                    }

                                                    skuBehaviour.push(skuObj);
                                                    skuArrObjs.push(skuObj);

                                                    if (continue_shopping_flag || continuingShopper) {
                                                        continue_shopping_flag = true;
                                                        if (continue_shopper_array_obj[HUMAN_UID_GLOBAL] == undefined || continue_shopper_array_obj[HUMAN_UID_GLOBAL] == null) {
                                                            continue_shopper_array_obj[HUMAN_UID_GLOBAL] = [];
                                                        }
                                                        continue_shopper_array_obj[HUMAN_UID_GLOBAL].push(skuObj);
                                                    }

                                                }
                                            }

                                            if (continuingShopper) {
                                                contShopArr.push(shopperProfileCopyObj);
                                            }
                                        }

                                        var gStaffBehavArr = events[len]['analysis']['G-STAFFBEHAVIOUR'];
                                        if (gStaffBehavArr && gStaffBehavArr.length > 0) {
                                            for (var staffLen = 0; staffLen < gStaffBehavArr.length; staffLen++) {
                                                var staffObj = gStaffBehavArr[staffLen];
                                                if (staffObj != null && staffObj != undefined) {
                                                    staffObj['Human-UID'] = shopper.Human_UID;
                                                    staffObj['Clip-Id'] = AUTO_VIDEOID_GLOBAL;
                                                    staffObj['Hum-ClipID'] = clipUserName;
                                                    staffObj.FrameNo = events[len].frameno;
                                                    staffObj.ShopperORStaff = shopper.ShopperORStaff;

                                                    for (var stf_sub_cat_len = 0; stf_sub_cat_len < staff_subcats.length; stf_sub_cat_len++) {
                                                        staffObj[staff_subcats[stf_sub_cat_len]] = mreged_json_obj[staff_subcats[stf_sub_cat_len]];
                                                    }

                                                    staffObj['C-Start'] = shopper['C-Start'];
                                                    staffObj['C-Event-Start'] = shopper['C-Event-Start'];

                                                    if(staffObj.timeSpent == null || staffObj.timeSpent == undefined)
                                                    {
                                                        staffObj.timeSpent = 0;
                                                    }
                                                    staffObj.timeSpent = Number(staffObj.timeSpent) / 1000;
                                                    staffObj['A-On-G-Stf-Behavr'] = staffObj.timeSpent;

                                                    staffObj['C-actionStartTime-Sec'] = staffObj.actionStartTime;
                                                    staffObj['C-actionStopTime-Sec'] = staffObj.actionStopTime;
                                                    staffObj['C-actionTime-Sec'] = staffObj.actionStopTime - staffObj.actionStartTime;

                                                    setActionTime(staffObj);
                                                    setInterActionTime(staffObj);

                                                    staffObj['C-Profile Saved-Sec'] = shopper['C-Profile Saved-Sec'];
                                                    staffObj['C-Event-End'] = shopper['C-Event-End'];

                                                    gStaffBehaviour.push(staffObj);
                                                }
                                            }
                                        }

                                        var cStaffBehavArr = events[len]['analysis']['C-STAFFBEHAVIOUR'];
                                        if (cStaffBehavArr && cStaffBehavArr.length > 0) {
                                            for (var staffLen = 0; staffLen < cStaffBehavArr.length; staffLen++) {
                                                var staffObj = cStaffBehavArr[staffLen];
                                                if (staffObj != null && staffObj != undefined) {
                                                    staffObj['Human-UID'] = shopper.Human_UID;
                                                    staffObj['Clip-Id'] = AUTO_VIDEOID_GLOBAL;
                                                    staffObj['Hum-ClipID'] = clipUserName;
                                                    staffObj.FrameNo = events[len].frameno;
                                                    staffObj.ShopperORStaff = shopper.ShopperORStaff;

                                                    staffObj['C-Start'] = shopper['C-Start'];
                                                    staffObj['C-Event-Start'] = shopper['C-Event-Start'];

                                                    if(staffObj.timeSpent == null || staffObj.timeSpent == undefined)
                                                    {
                                                        staffObj.timeSpent = 0;
                                                    }
                                                    staffObj.timeSpent = Number(staffObj.timeSpent) / 1000;
                                                    staffObj['A-On-C-Stf-Behavr'] = staffObj.timeSpent;

                                                    for (var stf_sub_cat_len = 0; stf_sub_cat_len < staff_subcats.length; stf_sub_cat_len++) {
                                                        staffObj[staff_subcats[stf_sub_cat_len]] = mreged_json_obj[staff_subcats[stf_sub_cat_len]];
                                                    }

                                                    staffObj['C-actionStartTime-Sec'] = staffObj.actionStartTime;
                                                    staffObj['C-actionStopTime-Sec'] = staffObj.actionStopTime;
                                                    staffObj['C-actionTime-Sec'] = staffObj.actionStopTime - staffObj.actionStartTime;

                                                    setActionTime(staffObj);
                                                    setInterActionTime(staffObj);

                                                    staffObj['C-Profile Saved-Sec'] = shopper['C-Profile Saved-Sec'];
                                                    staffObj['C-Event-End'] = shopper['C-Event-End'];

                                                    cStaffBehaviour.push(staffObj);
                                                }
                                            }
                                        }

                                        var sStaffBehavArr = events[len]['analysis']['S-STAFFBEHAVIOUR'];
                                        if (sStaffBehavArr && sStaffBehavArr.length > 0) {
                                            for (var staffLen = 0; staffLen < sStaffBehavArr.length; staffLen++) {
                                                var staffObj = sStaffBehavArr[staffLen];
                                                if (staffObj != null && staffObj != undefined) {
                                                    staffObj['Human-UID'] = shopper.Human_UID;
                                                    staffObj['Clip-Id'] = AUTO_VIDEOID_GLOBAL;
                                                    staffObj['Hum-ClipID'] = clipUserName;
                                                    staffObj.FrameNo = events[len].frameno;
                                                    staffObj.ShopperORStaff = shopper.ShopperORStaff;

                                                    staffObj['C-Start'] = shopper['C-Start'];
                                                    staffObj['C-Event-Start'] = shopper['C-Event-Start'];

                                                    for (var stf_sub_cat_len = 0; stf_sub_cat_len < staff_subcats.length; stf_sub_cat_len++) {
                                                        staffObj[staff_subcats[stf_sub_cat_len]] = mreged_json_obj[staff_subcats[stf_sub_cat_len]];
                                                    }

                                                    if(staffObj.timeSpent == null || staffObj.timeSpent == undefined)
                                                    {
                                                        staffObj.timeSpent = 0;
                                                    }
                                                    staffObj.timeSpent = Number(staffObj.timeSpent) / 1000;
                                                    staffObj['A-On-S-Stf-Behavr'] = staffObj.timeSpent;

                                                    staffObj['C-actionStartTime-Sec'] = staffObj.actionStartTime;
                                                    staffObj['C-actionStopTime-Sec'] = staffObj.actionStopTime;
                                                    staffObj['C-actionTime-Sec'] = staffObj.actionStopTime - staffObj.actionStartTime;

                                                    setActionTime(staffObj);
                                                    setInterActionTime(staffObj);

                                                    staffObj['C-Profile Saved-Sec'] = shopper['C-Profile Saved-Sec'];
                                                    staffObj['C-Event-End'] = shopper['C-Event-End'];

                                                    if (_.values(staffObj).indexOf("CONTINUE SHOPPING") > -1 || _.values(staffObj).indexOf("CONTINUE CUTTING") > -1 || _.values(staffObj).indexOf("NO EXIT") > -1) {
                                                        continue_shopping_flag = true;
                                                    }

                                                    sStaffBehaviour.push(staffObj);
                                                }
                                            }
                                        }

                                        if (continue_shopping_flag || aready_in_flag) {
                                            //contShopArr.push(mreged_json_obj);
                                            continue_events_arr[HUMAN_UID_GLOBAL] = mreged_json_obj;

                                            if (continue_shopper_array_obj[HUMAN_UID_GLOBAL] == undefined || continue_shopper_array_obj[HUMAN_UID_GLOBAL] == null) {
                                                continue_shopper_array_obj[HUMAN_UID_GLOBAL] = [];
                                                continue_shopper_array_obj[HUMAN_UID_GLOBAL] = skuArrObjs;
                                            }
                                        }

                                        if (aready_in_flag) {
                                            alreadyin_shopper_array_obj[HUMAN_UID_GLOBAL] = [];
                                            alreadyin_shopper_array_obj[HUMAN_UID_GLOBAL] = skuArrObjs;
                                        }
                                    }

                                    setMatchPercentages();
                                    for(var objShpLen = 0; objShpLen<shopperObj.length; objShpLen++)
                                    {
                                        if(shopperObj[objShpLen]['UniqGrpID'] != null && shopperObj[objShpLen]['UniqGrpID'] != undefined)
                                        {
                                            shopperObj[objShpLen]["GroupOf"] = uniqGrpObjList[shopperObj[objShpLen]['UniqGrpID']];
                                        }
                                    }


                                    var systemFields1 = ['e11Human-UID', 'e121st-UID', 'e13Clip-Id', 'Clip-Id-F', 'C-Start', 'C-Event-Start', 'C-Event-End', 'C-Profile Saved-Sec', 'ClientName', 'CameraCode', 'EventId', 'FrameNo', 'Xaxis', 'Yaxis', 'Xendaxis', 'Yendaxis', 'x1', 'y1', 'x2', 'y2', 'PlayingWidth', 'PlayingHeight', 'OriginalVideoWidth', 'OriginalVideoHeight', 'S3-path'];
                                    var files_prefix_name = clientname + '_' + cameracode + '_';
                                    var drafteventscsv = json2csv({ data: shopperObj, fields: draftEventFields });
                                    var finaleventscsv = json2csv({ data: shopperObj, fields: shopperFields });
                                    var skucsv = json2csv({ data: skuBehaviour, fields: skuFields });
                                    var gstaffcsv = json2csv({ data: gStaffBehaviour, fields: gStaffFields });
                                    var cstaffcsv = json2csv({ data: cStaffBehaviour, fields: cStaffFields });
                                    var sstaffcsv = json2csv({ data: sStaffBehaviour, fields: sStaffFields });
                                    var systemcsv = json2csv({ data: systemValues, fields: systemFields });
                                    fs.writeFile('draftevents.csv', drafteventscsv, function (err) {
                                        if (err) throw err;
                                        fs.writeFile('finalevents.csv', finaleventscsv, function (err) {
                                            if (err) throw err;
                                            var dataArray = [];
                                            csv.fromPath("finalevents.csv")
                                                .on("data", function(data){
                                                    dataArray.push(data);
                                                })
                                                .on("end", function(){
                                                    for(var len=0;len<dataArray[0].length;len++)
                                                    {
                                                        if(finalEventsReplaceObj[dataArray[0][len]] != null && finalEventsReplaceObj[dataArray[0][len]] != undefined)
                                                        {
                                                            dataArray[0][len] = finalEventsReplaceObj[dataArray[0][len]];
                                                        }
                                                    }
                                                    var result = json2csv({data: dataArray, hasCSVColumnTitle:false});
                                                    fs.writeFileSync("finalevents.csv", result);
                                                });
                                            fs.writeFile('Behaviour.csv', skucsv, function (err) {
                                                if (err) throw err;
                                                var dataBehavArray = [];
                                                csv.fromPath("Behaviour.csv")
                                                    .on("data", function(data){
                                                        dataBehavArray.push(data);
                                                    })
                                                    .on("end", function(){
                                                        for(var len=0;len<dataBehavArray[0].length;len++)
                                                        {
                                                            if(behaviourReplaceObj[dataBehavArray[0][len]] != null && behaviourReplaceObj[dataBehavArray[0][len]] != undefined)
                                                            {
                                                                dataBehavArray[0][len] = behaviourReplaceObj[dataBehavArray[0][len]];
                                                            }
                                                        }
                                                        var result = json2csv({ data: dataBehavArray, hasCSVColumnTitle:false});
                                                        fs.writeFileSync("Behaviour.csv", result);
                                                    });
                                                fs.writeFile('gstaffevents.csv', gstaffcsv, function (err) {
                                                    if (err) throw err;
                                                    var gStaffBehavArray = [];
                                                    csv.fromPath("gstaffevents.csv")
                                                        .on("data", function(data){
                                                            gStaffBehavArray.push(data);
                                                        })
                                                        .on("end", function(){
                                                            for(var len=0;len<gStaffBehavArray[0].length;len++)
                                                            {
                                                                if(gStaffReplaceObj[gStaffBehavArray[0][len]] != null && gStaffReplaceObj[gStaffBehavArray[0][len]] != undefined)
                                                                {
                                                                    gStaffBehavArray[0][len] = gStaffReplaceObj[gStaffBehavArray[0][len]];
                                                                }
                                                            }
                                                            var result = json2csv({ data: gStaffBehavArray, hasCSVColumnTitle:false});
                                                            fs.writeFileSync("gstaffevents.csv", result);
                                                        });
                                                    fs.writeFile('cstaffevents.csv', cstaffcsv, function (err) {
                                                        if (err) throw err;
                                                        var cStaffBehavArray = [];
                                                        csv.fromPath("cstaffevents.csv")
                                                            .on("data", function(data){
                                                                cStaffBehavArray.push(data);
                                                            })
                                                            .on("end", function(){
                                                                for(var len=0;len<cStaffBehavArray[0].length;len++)
                                                                {
                                                                    if(cStaffReplaceObj[cStaffBehavArray[0][len]] != null && cStaffReplaceObj[cStaffBehavArray[0][len]] != undefined)
                                                                    {
                                                                        cStaffBehavArray[0][len] = cStaffReplaceObj[cStaffBehavArray[0][len]];
                                                                    }
                                                                }
                                                                var result = json2csv({ data: cStaffBehavArray, hasCSVColumnTitle:false});
                                                                fs.writeFileSync("cstaffevents.csv", result);
                                                            });
                                                        fs.writeFile('sstaffevents.csv', sstaffcsv, function (err) {
                                                            if (err) throw err;
                                                            var sStaffBehavArray = [];
                                                            csv.fromPath("sstaffevents.csv")
                                                                .on("data", function(data){
                                                                    sStaffBehavArray.push(data);
                                                                })
                                                                .on("end", function(){
                                                                    for(var len=0;len<sStaffBehavArray[0].length;len++)
                                                                    {
                                                                        if(sStaffReplaceObj[sStaffBehavArray[0][len]] != null && sStaffReplaceObj[sStaffBehavArray[0][len]] != undefined)
                                                                        {
                                                                            sStaffBehavArray[0][len] = sStaffReplaceObj[sStaffBehavArray[0][len]];
                                                                        }
                                                                    }
                                                                    var result = json2csv({ data: sStaffBehavArray, hasCSVColumnTitle:false});
                                                                    fs.writeFileSync("sstaffevents.csv", result);
                                                                });
                                                            fs.writeFile('systemfile.csv', systemcsv, function (err) {
                                                                if (err) throw err;
                                                                fs.writeFile('README.TXT', readMeTxt, function (err) {
                                                                    if (err) throw err;
                                                                    res.zip([
                                                                        { path: 'draftevents.csv', name: files_prefix_name + 'Draft-Events.csv' },
                                                                        { path: 'finalevents.csv', name: files_prefix_name + 'Final-Events.csv' },
                                                                        { path: 'Behaviour.csv', name: files_prefix_name + 'Shpr-Behavior.csv' },
                                                                        { path: 'gstaffevents.csv', name: files_prefix_name + catCodeList['G-STAFFBEHAVIOUR'] + '.csv' },
                                                                        { path: 'cstaffevents.csv', name: files_prefix_name + catCodeList['C-STAFFBEHAVIOUR'] + '.csv' },
                                                                        { path: 'sstaffevents.csv', name: files_prefix_name + catCodeList['S-STAFFBEHAVIOUR'] + '.csv' },
                                                                        { path: 'systemfile.csv', name: files_prefix_name + 'System-File.csv' },
                                                                        { path: 'README.TXT', name: 'README.TXT' }
                                                                    ]);
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                });
        });

    function convertToMinSeconds(time)
    {
        var minutes = "0" + Math.floor(time / 60);
        var seconds = "0" + (time - minutes * 60);
        return minutes.substr(-2) + ":" + seconds.substr(-2)+":000";
    }

    function setInterActionTime(interObj)
    {
        if(interObj.interActionStartTime == null || interObj.interActionStartTime ==  undefined || checkWithNone(interObj.InterActionStart))
        {
            interObj.interActionStartTime = 0;
            interObj.interActionStopTime = 0;
        }

        if(interObj.interActionStopTime == null || interObj.interActionStopTime == undefined || checkWithNone(interObj.InterActionStopContinue))
        {
            interObj.interActionStartTime = 0;
            interObj.interActionStopTime = 0;
        }

        interObj['I-actionStartTime-Sec']  = interObj.interActionStartTime;
        interObj['I-actionStopTime-Sec'] = interObj.interActionStopTime;
        interObj['I-actionTime-Sec'] = interObj.interActionStopTime - interObj.interActionStartTime;
    }

    function checkWithNone(userValue)
    {
        if(userValue == null || userValue == undefined  || userValue.startsWith("ZNONEE") || userValue.startsWith("NO ACTION") || userValue.startsWith("NONE") || userValue.startsWith("NOT APPLICABLE"))
        {
            return true;
        }
        return false;
    }

    function setActionTime(interObj)
    {
        if(interObj.actionStartTime == null || interObj.actionStartTime ==  undefined || checkWithNone(interObj.ActionStart))
        {
            interObj.actionStartTime = 0;
            interObj.actionStopTime = 0;
        }

        if(interObj.actionStopTime == null || interObj.actionStopTime == undefined || checkWithNone(interObj.ActionStopContinue))
        {
            interObj.actionStartTime = 0;
            interObj.actionStopTime = 0;
        }

        interObj['C-actionStartTime-Sec']  = interObj.actionStartTime;
        interObj['C-actionStopTime-Sec'] = interObj.actionStopTime;
        interObj['C-actionTime-Sec'] = interObj.actionStopTime - interObj.actionStartTime;
    }

    function geth(o){
        var vals = [];
        for(var i in o){
            vals.push(o[i]);
        }

        var max = Math.max.apply(null, vals);

        for(var i in o){
            if(o[i] == max){
                return i;
            }
        }
    }
};

//{ path: 'gstaffevents.csv', name: files_prefix_name+catCodeList['G-STAFFBEHAVIOUR']+'.csv' },
//{ path: 'cstaffevents.csv', name: files_prefix_name+catCodeList['C-STAFFBEHAVIOUR']+'.csv' },
//{ path: 'sstaffevents.csv', name: files_prefix_name+catCodeList['S-STAFFBEHAVIOUR']+'.csv' },

