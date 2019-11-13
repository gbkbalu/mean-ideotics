/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var EventBus = require('./EventBus');
var mongoose = require('mongoose');
var nodeMailer = require('nodemailer');
var fs = require('fs');
var json2csv = require('json2csv');

var videoFields = ['Video Id','Project','Camera','FileName','URL','VideoDate','Assigned On','Submitted On','Agent Id','Analyzing Time','Clip Status'];
EventBus.onSeries('Videos.calculateAgentsTimeOnUnderProcessingVideos', function (next) {
    mongoose.models.videos.find({ status: 1 },{videoId:1}, function (err, videosList) {
        if (err) {
        }
        videosList.forEach(function(selectedVideo) {
            mongoose.models.events.find({ videoId: selectedVideo.videoId, analysis:{$exists:true} },{_id:0,analysis:1,totalTimeSpent:1,isDiscarded:1})
                .exec(function (err, eventsList) {
                    if (err) {
                    }
                    var totalTimeSpent = 0;
                    var discardedTimeSpent = 0;
                    eventsList.forEach(function(eventObj) {
                        var eventTimeSpent = exports.calculateTotalTimeSpent(eventObj);
                        totalTimeSpent = totalTimeSpent + eventTimeSpent;
                        if(eventObj.isDiscarded == 1)
                        {
                            discardedTimeSpent = discardedTimeSpent + eventTimeSpent;
                        }
                    });

                    var spentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent);
                    var discSpentTimeHHmmss = exports.convertToHHmmss(discardedTimeSpent);
                    var netSpentTimeHHmmss = exports.convertToHHmmss(totalTimeSpent-discardedTimeSpent);
                    mongoose.models.videos.update({videoId: selectedVideo.videoId}, {$set: {totalTimeSpent: totalTimeSpent,spentTime:spentTimeHHmmss, discardedTime:discSpentTimeHHmmss, netTime:netSpentTimeHHmmss}}, function (err) {
                    });
                });
        });
    });
});

EventBus.onSeries('Videos.prepareReportAndSendMail', function (next) {
    var videoObjList = [];
    mongoose.models.videos.find({ status: 1 }, function (err, videosList) {
        if (err) {
        }
        videosList.forEach(function(selectedVideo) {
            videoObjList.push(exports.convertToVideoObj(selectedVideo));
        });

        if(videoObjList.length>0)
        {
            var processingvideostime = json2csv({ data: videoObjList, fields: videoFields });
            fs.writeFile('processingvideostime.csv', processingvideostime, function (err) {
                if (err) throw err;
            });
            EventBus.emit('Videos.forwardMailReports');
        }
    });
});

EventBus.onSeries('Videos.forwardMailReports', function (next) {
    var transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'sigmaxesdnbhd@gmail.com',
            pass: 'sigmaxe@sri'
        }
    });
    var mailOptions = {
        attachments: [
            {
                filename: 'processingvideostime.csv',
                path: 'processingvideostime.csv'
            }],
        from: 'sigmaxesdnbhd@gmail.com', // sender address
        to: "bala@sigmax-e.com,redwan.noaman@gmail.com", // list of receivers
        subject: "Agents Processing Time For Under Processing Videos", // Subject line
        text: "Agents Processing Time For Under Processing Videos", // plain text body
        html: '<b>Hi Sir,<br> Please find the attachment for agents processing time for "Under Processing" videos.</b>'// html body

    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

});

exports.convertToVideoObj= function(currentVideo)
{
    var videoObj = {'Video Id':currentVideo.videoId,
        'Project':currentVideo.client,
        'Camera':currentVideo.cameraId,'FileName':currentVideo.name,
        'URL':currentVideo.url,'VideoDate':currentVideo.dateOfTheVideo,
        'Assigned On':currentVideo.assignedDate,'Submitted On':currentVideo.submittedDate,
        'Agent Id':currentVideo.userId,'Analyzing Time':currentVideo.spentTime,
        'Clip Status':'Under Processing'};


    return videoObj;
}

var categories   = ['START','SHOPPERPROFILE', 'SKUBEHAVIOUR','STAFFPROFILE','G-STAFFBEHAVIOUR','S-STAFFBEHAVIOUR','C-STAFFBEHAVIOUR'];

exports.convertToHHmmss= function(totalTimeSpent)
{
    var hours = ("0"+Math.floor(totalTimeSpent/3600)).slice(-2);
    var minutes = ("0"+Math.floor((totalTimeSpent%3600)/60)).slice(-2);
    var seconds = ("0"+Math.floor((totalTimeSpent%3600)%60)).slice(-2);

    return (hours+":"+minutes+":"+seconds);
}

exports.calculateTotalTimeSpent = function(obj)
{
    var totalTimeSpent = 0;
    if(obj == null || obj == undefined || obj.analysis == null || obj.analysis == undefined)
    {
        return totalTimeSpent;
    }

    for(var catLen =0;catLen<categories.length;catLen++)
    {
        var catObj = obj.analysis[categories[catLen]];
        if(catObj != null && catObj != undefined)
        {
            if(catLen == 0 || catLen == 1 || catLen == 3)
            {
                if(catObj && catObj != null && catObj != undefined && catObj.timeSpent && catObj.timeSpent != null && catObj.timeSpent != undefined)
                {
                    totalTimeSpent = totalTimeSpent + catObj.timeSpent;
                }
            }else
            {
                for(var subListLen =0;subListLen<catObj.length;subListLen++)
                {
                    if(catObj[subListLen] && catObj[subListLen] != null && catObj[subListLen] != undefined &&  catObj[subListLen].timeSpent && catObj[subListLen].timeSpent != null && catObj[subListLen].timeSpent != undefined) {
                        totalTimeSpent = totalTimeSpent + catObj[subListLen].timeSpent;
                    }
                }
            }
        }
    }
    return totalTimeSpent;
}
