let mongoose = require('mongoose'),
    _ = require('lodash')

exports.getObjectListByVideo = (req, res) => {

    let video_id = req.body.videoId;
    let frame_no = req.body.frame_no;
    let frame_cnt = req.body.buff_request_size;
    let from_idx = frame_no;

    mongoose.models.data_collections.find({
            video_id,
            frame_id: {
                $gte: from_idx
            }
        }).sort({ frame_id: 1 })
        .limit(frame_cnt)
        .exec((err, events) => {

            if (err) {
                return res.status(500).json({ error: 'Error with mongoDB connection.' });
            }
            let eventsList = [];
            _.each(events, (event) => {
                eventsList.push(event);
            });
            return res.status(200).json(eventsList);
        });
};