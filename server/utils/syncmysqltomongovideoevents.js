/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var EventBus = require('./EventBus');
var mongoose = require('mongoose');
var helper = require('../utils/helper');
var  _ = require('lodash');
var maxRowsPerTrans = 10000;


// /**
//  * event handler after creating new account
//  */

// EventBus.onSeries('SyncMongoToMysqlSubmittedVideos.SyncEventTblMongoToMysql', function (next) {

//     mongoose.models.videos.find({status:2 }, function (err, videos) {
//         if (err) {
//             return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
//         } else {
//             if(videos.length>0)
//             {
//                 _.each(videos, function (video) {
//                     console.log(video.videoId);
//                     EventBus.emit('getEventCountAndSyncMongoToMysqlVideoEvents', video.videoId);
//                 });

//             }
//             //next();
//         }
//     });
// });

// EventBus.onSeries('SyncVideoEvents', function (videoId,next) {

//     poolConnection.getConnection(function(err,poolDbConn){
//         if(err)
//         {}
//         else
//         {
//             poolDbConn.query("update ideocap_input set isDataSynced=1 where VideoID in ("+videoId+")", function(err,results) {
//                 if (err)
//                     console.log(err);

//                 if(results && results.affectedRows && results.affectedRows>0)
//                 {
//                     mongoose.models.events.remove({videoId:videoId}, function (err) {});//added newly

//                     var totalNumberOfRows = results.affectedRows;
//                     var startRows = 0;
//                     while(totalNumberOfRows>0)
//                     {
//                         EventBus.emit('SavePartialVideoEvents',videoId,startRows);
//                         startRows = startRows + maxRowsPerTrans;
//                         totalNumberOfRows = totalNumberOfRows - maxRowsPerTrans;
//                     }
//                 }
//                 poolDbConn.release();
//                 next();
//             });
//         }
//     })
// });

// EventBus.onSeries('SavePartialVideoEvents', function (videoId,startRows,next) {

//     var arrObj = [];
//     poolConnection.getConnection(function(err,poolDbConn){
//         if(err)
//         {}
//         else
//         {
//             poolDbConn.query("select * from ideocap_input where VideoID in ("+videoId+")  order by ShopperID limit "+startRows+","+maxRowsPerTrans, function(err,results) {
//                 if (err)
//                     console.log(err);
//                 if(results && results.length>0)
//                 {
//                     for(var resLen = 0 ;resLen< results.length; resLen++)
//                     {
//                         var event = {};
//                         event.eventId = results[resLen].EventID;
//                         event.name = 'SHOPPER-'+results[resLen].ShopperID;
//                         event.videoId = results[resLen].VideoID;
//                         event.startTime = results[resLen].start_time;
//                         event.endTime = results[resLen].end_time;

//                         event.analysis = {"Shopper Profile":{Age:results[resLen].Age,Gender:results[resLen].Gender}};
//                         event.bkpanalysis = {startTime:results[resLen].start_time,endTime:results[resLen].end_time,Age:results[resLen].Age,Gender:results[resLen].Gender};

//                         arrObj.push(event);
//                     }
//                 }
//                 mongoose.models.events.create(arrObj, function (err)
//                 {});

//                 poolDbConn.release();
//             });
//         }
//     })
// });

// EventBus.onSeries('getEventCountAndSyncMongoToMysqlVideoEvents', function (videoId,next) {

//     console.log(videoId)
//     mongoose.models.events.count({ videoId: videoId })
//         .exec(function (err, eventsCount) {
//             if (err) {
//                 return res.status(500).json({error: 'Error with mongoDB connection.'});
//             }
//             var skipVal = 0 ;
//             var totalNumberOfRows = eventsCount;
//             console.log(totalNumberOfRows)
//             while(totalNumberOfRows>0)
//             {
//                 var obj = {videoId:videoId,skipValue:skipVal++};
//                 //EventBus.emit('SyncVideoEventsMongoToMysql', obj);
//                 totalNumberOfRows = totalNumberOfRows - (2000);
//             }
//             next();
//         });
// });

// EventBus.onSeries('SyncMogoToMysqlByVideoIdEvents', function (obj,next) {

//     var skipVal = 0 ;
//     var totalNumberOfRows = obj.eventsCount;
//     while(totalNumberOfRows>0)
//     {
//         var obj = {videoId:obj.videoId,skipValue:skipVal++};
//         //EventBus.emit('SyncVideoEventsMongoToMysql', obj);
//         totalNumberOfRows = totalNumberOfRows - (2000);
//     }
//     next();
// });

// EventBus.onSeries('SyncVideoEventsMongoToMysql', function (obj,next) {

//     mongoose.models.videos.findOne({ videoId: obj.videoId }, function (err, video) {
//         if (err) {
//             return res.status(500).json({ success: false, error: 'Error with mongoDB connection.' });
//         }

//         if(obj.skipValue == 0)
//         {
//             /*poolConnection.getConnection(function(err,poolDbConn){
//                 if(err)
//                 {}
//                 else
//                 {
//                     poolDbConn.query('delete from event where ?', {videoId: obj.videoId}, function(err) {
//                         if (err)
//                             console.log(err);
//                         poolDbConn.release();
//                     });
//                 }
//             })

//             poolConnection.getConnection(function(err,poolDbConn){
//                 if(err)
//                 {}
//                 else
//                 {
//                     poolDbConn.query('delete from event_sku where ?', {videoId: obj.videoId}, function(err) {
//                         if (err)
//                             console.log(err);
//                         poolDbConn.release();
//                     });
//                 }
//             })

//             poolConnection.getConnection(function(err,poolDbConn){
//                 if(err)
//                 {}
//                 else
//                 {
//                     poolDbConn.query('delete from event_staff where ?', {videoId: obj.videoId}, function(err) {
//                         if (err)
//                             console.log(err);
//                         poolDbConn.release();
//                     });
//                 }
//             })*/
//         }


//         mongoose.models.events.find({ videoId: obj.videoId })
//             .skip((obj.skipValue)*2000)
//             .limit(2000)
//             .exec(function (err, events) {
//                 if (err) {
//                     return res.status(500).json({error: 'Error with mongoDB connection.'});
//                 }
//                 var values = [];
//                 var skuRecordsList = [];
//                 var staffRecordsList = [];
//                 _.each(events, function (event) {
//                     var rec = [];
//                     rec.push(event.eventId);
//                     rec.push(event.videoId);
//                     rec.push(event.startTime);
//                     rec.push(event.endTime);
//                     rec.push(event.isConverted);
//                     rec.push(event.isDiscarded);
//                     rec.push(event.isAnalysed);
//                     //rec.push(event.name);
//                     rec.push('Shopper-'+(event.eventId));
//                     rec.push(event.dateCreated);
//                     var notesByAgent = '';

//                     if(event.comments != undefined && event.comments != null)
//                         notesByAgent = event.comments;

//                     if(event && event.analysis && event.analysis["Shopper Profile"])
//                     {
//                         rec.push(event.analysis["Shopper Profile"].Gender);
//                         rec.push(event.analysis["Shopper Profile"].Ethnicity);
//                         rec.push(event.analysis["Shopper Profile"].Dress);
//                         rec.push(event.analysis["Shopper Profile"].Color);
//                         rec.push(event.analysis["Shopper Profile"].Age);
//                         rec.push(event.analysis["Shopper Profile"].Profile);
//                         rec.push(event.analysis["Shopper Profile"].ENTRANCE)

//                         //rec.push(event.analysis["Shopper Profile"]['Staff Type']);
//                         if(event.analysis["Shopper Profile"]['Staff Type'])
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Staff Type']);
//                         }else
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['If Staff: Select Type']);
//                         }
//                         rec.push(event.analysis["Shopper Profile"]['If Shopper, Select:']);

//                         if(event.analysis["Shopper Profile"]['Shopper Class'])
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Shopper Class']);
//                         }else
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Group']);
//                         }
//                         rec.push(event.analysis["Shopper Profile"]['Special']);
//                         rec.push(event.analysis["Shopper Profile"]['Color of Top']);
//                         rec.push(event.analysis["Shopper Profile"]['Pattern of Top']);
//                         //rec.push(event.analysis["Shopper Profile"]['Group']);

//                         if(event.analysis["Shopper Profile"]['Shopper Class'])
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Shopper Class']);
//                         }else
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Group']);
//                         }

//                         if(event.analysis["Shopper Profile"]['Hair Colour'])
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Hair Colour']);
//                         }else
//                         {
//                             rec.push(event.analysis["Shopper Profile"]['Hair / Head Cover']);
//                         }
//                         rec.push(event.analysis["Shopper Profile"]['Height']);
//                         rec.push(event.analysis["Shopper Profile"]['Shape']);
//                         var timespentbyagent = event.analysis["Shopper Profile"]['timeSpent'];
//                         if(validateValue(timespentbyagent))
//                         {
//                             rec.push(timespentbyagent);
//                         }else
//                         {
//                             rec.push(0);
//                         }

//                         if(event.analysis["Shopper Profile"]['comments'] != undefined && event.analysis["Shopper Profile"]['comments'] != null)
//                             notesByAgent = event.analysis["Shopper Profile"]['comments'];
//                     }else
//                     {
//                         rec = insertNulls(rec, 18);
//                     }

//                     if(event && event.analysis && event.analysis["Others"])
//                     {
//                         var eventOthersTime = event.analysis["Others"].time;
//                         if(eventOthersTime !== null && eventOthersTime !== undefined && eventOthersTime !== 'undefined' && eventOthersTime !== '')
//                         {
//                             rec.push(event.analysis["Others"].time);
//                         }else
//                         {
//                             rec.push(0);
//                         }
//                         //rec.push(event.analysis["Others"].time);
//                         rec.push(event.analysis["Others"].Others);
//                         rec.push(event.analysis["Others"].Stocks);
//                         rec.push(event.analysis["Others"].Group);
//                         var timespentbyagent = event.analysis["Others"]['timeSpent'];
//                         if(validateValue(timespentbyagent))
//                         {
//                             rec.push(timespentbyagent);
//                         }else
//                         {
//                             rec.push(0);
//                         }
//                         if(event.analysis["Others"]['comments'] != undefined && event.analysis["Others"]['comments'] != null)
//                             notesByAgent = notesByAgent +event.analysis["Others"]['comments'];

//                     }else
//                     {
//                         rec = insertNulls(rec, 5);
//                     }

//                     if(event && event.analysis && event.analysis["Exit Path"])
//                     {
//                         var exitPathTime = event.analysis["Exit Path"].time;
//                         if(exitPathTime !== null && exitPathTime !== undefined && exitPathTime !== 'undefined' && exitPathTime !== '')
//                         {
//                             rec.push(event.analysis["Exit Path"].time);
//                         }else
//                         {
//                             rec.push(0);
//                         }

//                         rec.push(event.analysis["Exit Path"].Path);
//                         rec.push(event.analysis["Exit Path"].Entrance);
//                         rec.push(event.analysis["Exit Path"].Exit);
//                         var timespentbyagent = event.analysis["Exit Path"]['timeSpent'];
//                         if(validateValue(timespentbyagent))
//                         {
//                             rec.push(timespentbyagent);
//                         }else
//                         {
//                             rec.push(0);
//                         }
//                         if(event.analysis["Exit Path"]['comments'] != undefined && event.analysis["Exit Path"]['comments'] != null)
//                             notesByAgent = notesByAgent +event.analysis["Exit Path"]['comments'];

//                         rec.push(notesByAgent);

//                     }else if(event && event.analysis && event.analysis["Path"])
//                     {
//                         var exitPathTime = event.analysis["Path"].time;
//                         if(exitPathTime !== null && exitPathTime !== undefined && exitPathTime !== 'undefined' && exitPathTime !== '')
//                         {
//                             rec.push(event.analysis["Path"].time);
//                         }else
//                         {
//                             rec.push(0);
//                         }
//                         rec = insertNulls(rec, 1);
//                         rec.push(event.analysis["Path"].Entrance);
//                         rec.push(event.analysis["Path"].Exit);
//                         var timespentbyagent = event.analysis["Path"].timeSpent;
//                         if(validateValue(timespentbyagent))
//                         {
//                             rec.push(timespentbyagent);
//                         }else
//                         {
//                             rec.push(0);
//                         }
//                         if(event.analysis["Path"]['comments'] != undefined && event.analysis["Path"]['comments'] != null)
//                             notesByAgent = notesByAgent +event.analysis["Path"]['comments'];

//                         rec.push(notesByAgent);
//                     }else
//                     {
//                         rec = insertNulls(rec, 6);
//                     }

//                     rec.push(event.xaxis);
//                     rec.push(event.yaxis);
//                     rec.push(event.xendaxis);
//                     rec.push(event.yendaxis);

//                     var skuBehaviour = null;

//                     if(event && event.analysis && event.analysis["SKU Behaviour"])
//                     {
//                         skuBehaviour = event.analysis["SKU Behaviour"];
//                     }

//                     if(skuBehaviour && skuBehaviour.length>0)
//                     {
//                         var skuLen = skuBehaviour.length;


//                         for(var arrLen = 0;arrLen<skuLen;arrLen++)
//                         {
//                             var skuRec = [];
//                             skuRec.push(event.eventId);
//                             skuRec.push(event.videoId);
//                             if(skuBehaviour[arrLen].time)
//                             {
//                                 skuRec.push(Number(skuBehaviour[arrLen].time));
//                             }else
//                             {
//                                 skuRec.push(Number(0));
//                             }

//                             skuRec.push(skuBehaviour[arrLen]['Location / Shelf']);
//                             skuRec.push(skuBehaviour[arrLen].Action);
//                             skuRec.push(skuBehaviour[arrLen].Decision);
//                             skuRec.push(skuBehaviour[arrLen].Interaction);
//                             if(skuBehaviour[arrLen]['Stock Position'])
//                             {
//                                 skuRec.push(skuBehaviour[arrLen]['Stock Position']);
//                             }else if(skuBehaviour[arrLen]['Shopper Location'])
//                             {
//                                 skuRec.push(skuBehaviour[arrLen]['Shopper Location']);
//                             }else
//                             {
//                                 skuRec.push(skuBehaviour[arrLen]['Tables Availability']);
//                             }

//                             skuRec.push(skuBehaviour[arrLen]['Aisle Number']);
//                             var timespentbyagent = skuBehaviour[arrLen]['timeSpent'];
//                             if(validateValue(timespentbyagent))
//                             {
//                                 skuRec.push(timespentbyagent);
//                             }else
//                             {
//                                 skuRec.push(0);
//                             }
//                             skuRec.push(skuBehaviour[arrLen]['comments']);

//                             skuRecordsList.push(skuRec);
//                         }

//                     }

//                     var staffBehaviour = null;
//                     if(event && event.analysis && event.analysis["Staff behaviour"])
//                     {
//                         staffBehaviour = event.analysis["Staff behaviour"];
//                     }

//                     if(staffBehaviour)
//                     {
//                         var staffLen = staffBehaviour.length;

//                         if(staffBehaviour.length>0)
//                         {
//                             for(var arrLen = 0;arrLen<staffLen;arrLen++)
//                             {
//                                 var staffRec = [];
//                                 staffRec.push(event.eventId);
//                                 staffRec.push(event.videoId);
//                                 if(staffBehaviour[arrLen].time)
//                                 {
//                                     staffRec.push(Number(staffBehaviour[arrLen].time));
//                                 }else
//                                 {
//                                     staffRec.push(Number(0));
//                                 }

//                                 staffRec.push(staffBehaviour[arrLen]['Stf-Gender']);
//                                 staffRec.push(staffBehaviour[arrLen]['Appearance']);
//                                 staffRec.push(staffBehaviour[arrLen]['Location / Shelf']);
//                                 if(staffBehaviour[arrLen]['Action-Staff'])
//                                 {
//                                     staffRec.push(staffBehaviour[arrLen]['Action-Staff']);
//                                 }else
//                                 {
//                                     staffRec.push(staffBehaviour[arrLen]['Action-Start']);
//                                 }
//                                 if(staffBehaviour[arrLen]['Start-Stop'])
//                                 {
//                                     staffRec.push(staffBehaviour[arrLen]['Start-Stop']);
//                                 }else
//                                 {
//                                     staffRec.push(staffBehaviour[arrLen]['Action Stop/Continue']);
//                                 }

//                                 staffRec.push(staffBehaviour[arrLen]['Colour of Top']);
//                                 staffRec.push(staffBehaviour[arrLen]['Stf-Pattern of Top']);
//                                 staffRec.push(staffBehaviour[arrLen]['Stf-Dress']);

//                                 var timespentbyagent = staffBehaviour[arrLen]['timeSpent'];
//                                 if(validateValue(timespentbyagent))
//                                 {
//                                     staffRec.push(timespentbyagent);
//                                 }else
//                                 {
//                                     staffRec.push(0);
//                                 }
//                                 staffRec.push(staffBehaviour[arrLen]['comments']);
//                                 staffRec.push(staffBehaviour[arrLen]['actionStartTime']);
//                                 staffRec.push(staffBehaviour[arrLen]['actionStopTime']);

//                                 staffRecordsList.push(staffRec);
//                             }
//                         }else
//                         {
//                             var staffRec = [];
//                             staffRec.push(event.eventId);
//                             staffRec.push(event.videoId);
//                             if(staffBehaviour.time)
//                             {
//                                 staffRec.push(Number(staffBehaviour.time));
//                             }else
//                             {
//                                 staffRec.push(Number(0));
//                             }

//                             staffRec.push(staffBehaviour['Stf-Gender']);
//                             staffRec.push(staffBehaviour['Appearance']);
//                             staffRec.push(staffBehaviour['Location / Shelf']);

//                             if(staffBehaviour['Action-Staff'])
//                             {
//                                 staffRec.push(staffBehaviour['Action-Staff']);
//                             }else
//                             {
//                                 staffRec.push(staffBehaviour['Action-Start']);
//                             }
//                             if(staffBehaviour['Start-Stop'])
//                             {
//                                 staffRec.push(staffBehaviour['Start-Stop']);
//                             }else
//                             {
//                                 staffRec.push(staffBehaviour['Action Stop/Continue']);
//                             }

//                             staffRec.push(staffBehaviour['Colour of Top']);
//                             staffRec.push(staffBehaviour['Stf-Pattern of Top']);
//                             staffRec.push(staffBehaviour['Stf-Dress']);

//                             var timespentbyagent = staffBehaviour['timeSpent'];
//                             if(validateValue(timespentbyagent))
//                             {
//                                 staffRec.push(timespentbyagent);
//                             }else
//                             {
//                                 staffRec.push(0);
//                             }
//                             staffRec.push(staffBehaviour['comments']);
//                             staffRec.push(staffBehaviour['actionStartTime']);
//                             staffRec.push(staffBehaviour['actionStopTime']);
//                             staffRecordsList.push(staffRec);
//                         }
//                     }

//                     values.push(rec);
//                 });

//                 if(values && values.length>0)
//                 {
//                     //EventBus.emit('SaveMongoToMysqlEventPartial',values);
//                 }

//                 if(skuRecordsList && skuRecordsList.length>0)
//                 {
//                     //EventBus.emit('SaveMongoToMysqlEventSkuPartial',skuRecordsList);
//                 }

//                 if(staffRecordsList && staffRecordsList.length>0)
//                 {
//                     //EventBus.emit('SaveMongoToMysqlEventStaffPartial',staffRecordsList);
//                 }



//                 next();
//             });
//     });

// });

// function validateValue(timespentbyagent)
// {
//     if(timespentbyagent != undefined && timespentbyagent != null && timespentbyagent != '')
//     {
//         return true;
//     }

//     return false;
// }

// EventBus.onSeries('SaveMongoToMysqlEventPartial', function (eventPartialValues,next) {
//     poolConnection.getConnection(function(err,poolDbConn){
//         if(err)
//         {
//             console.log(err)
//         }
//         else
//         {
//             poolDbConn.query(insertEventsSql, [eventPartialValues], function(err) {
//                 if (err)
//                     console.log(err);
//                 poolDbConn.release();
//                 next();
//             });
//         }
//     })
// });

// EventBus.onSeries('SaveMongoToMysqlEventSkuPartial', function (skuEventPartialValues,next) {
//     poolConnection.getConnection(function(err,poolDbConn){
//         if(err)
//         {
//             console.log(err)
//         }
//         else
//         {
//             poolDbConn.query(insertEventSkusSql, [skuEventPartialValues], function(err) {
//                 if (err)
//                     console.log(err);
//                 poolDbConn.release();
//                 next();
//             });
//         }
//     })
// });

// EventBus.onSeries('SaveMongoToMysqlEventStaffPartial', function (staffEventPartialValues,next) {
//     poolConnection.getConnection(function(err,poolDbConn){
//         if(err)
//         {
//             console.log(err)
//         }
//         else
//         {
//             poolDbConn.query(insertEventStaffsSql, [staffEventPartialValues], function(err) {
//                 if (err)
//                     console.log(err);
//                 poolDbConn.release();
//                 next();
//             });
//         }
//     })
// });

EventBus.onSeries('SaveEventsFromCSVWithForm', function (body,next) {
    console.log('Received')
    var frameWidth = 1280;
    var frameHeight = 720;

    if(body.frameWidth && body.frameWidth != undefined && body.frameWidth != '0')
    {
        frameWidth = body.frameWidth;
    }
    if(body.frameHeight && body.frameHeight != undefined && body.frameHeight != '0')
    {
        frameHeight = body.frameHeight;
    }
    var csvData = body.csvData;
    var bodyObjEventRecords = [];
    var maxItemId = 1;

    for(var len=0;len<csvData.length;len++)
    {
        var bodyRec = csvData[len];

        bodyRec['videoId'] = body.videoId;
        bodyRec['eventId'] = maxItemId;
        bodyRec['name'] = 'Shopper-'+bodyRec['humanid'];
        bodyRec['width'] =  Number(bodyRec['xendaxis']) - bodyRec['xaxis'];
        bodyRec['height'] =  Number(bodyRec['yendaxis']) - bodyRec['yaxis'];
        bodyRec['originalcoords'] =  {xaxis:bodyRec['xaxis'],yaxis:bodyRec['yaxis'],xendaxis:bodyRec['xendaxis'],yendaxis:bodyRec['yendaxis']};
        bodyRec['docIsModified'] = true;
        bodyRec['isFrame'] = true;
        bodyRec['comments'] = "";
        bodyRec['isAnalysed'] = 0;
        bodyRec['isConverted'] = 0;
        bodyRec['isDiscarded'] =  0;
        bodyRec['endTime'] = 0;
        bodyRec['capscan'] = 's';

        if(bodyRec['startTime'] != null && bodyRec['startTime'] != undefined && bodyRec['startTime']>=0)
        {
            bodyRec['startTime'] = Number(bodyRec['startTime']);
        }

        bodyRec['xaxis'] = Math.round((Number(bodyRec['xaxis'])*777)/frameWidth); //(oldval*newwidth/oldwidth)
        bodyRec['yaxis'] = Math.round((Number(bodyRec['yaxis'])*579)/frameHeight);
        bodyRec['xendaxis'] = Math.round((Number(bodyRec['xendaxis'])*777)/frameWidth);
        bodyRec['yendaxis'] = Math.round((Number(bodyRec['yendaxis'])*579)/frameHeight);
        bodyRec['playingWidth'] = 777;
        bodyRec['playingHeight'] = 579;
        bodyRec['width'] =  Number(bodyRec['xendaxis']) - bodyRec['xaxis'];
        bodyRec['height'] =  Number(bodyRec['yendaxis']) - bodyRec['yaxis'];
        bodyRec['humanid'] =  Number(bodyRec['humanid']);
        bodyRec['frameno'] =  Number(bodyRec['frameno']);

        bodyObjEventRecords.push(bodyRec);

        if(bodyObjEventRecords.length == 100)
        {
            EventBus.emit('SavePartialEvents', bodyObjEventRecords);
            bodyObjEventRecords = [];
        }
        maxItemId++;
    }
    EventBus.emit('SavePartialEvents', bodyObjEventRecords);
    next();
});

EventBus.onSeries('SavePartialEvents', function (obj,next) {

    mongoose.models.events.collection.insert(obj, function (err)
    {
        next();
    });

});

function insertNulls(record, size)
{
    for(var len=0;len<size;len++)
    {
        record.push('');
    }
    return record;
}




