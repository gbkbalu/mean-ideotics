var events = require('../controllers/events');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

	app.post('/api/event', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.newEvent);

	app.get('/api/events', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.getEvents);
	app.get('/api/event/:eventId', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.getEventByEventId);
	app.get('/api/events/videoId/:videoId', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.getEventsByVideoId);

    app.post('/api/events/getEventsByVideoPagination', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.getEventsByVideoPagination);

	app.put('/api/event/update', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.updateEvent);

    app.post('/api/removeEventById', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.removeEventByEventId);
    app.post('/api/events/getEventsByVideoForHeatMap', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), events.getEventsByVideoForHeatMap);

    app.get('/api/convertEvents/shopperprofile', events.convertCsvEventsToNestedEvent);

    app.post('/api/events/saveEventsFromCSVWithForm', helper.canAccessRoute(['admin']),events.saveEventsFromCSVWithForm);

    app.post('/api/events/getEventListByVideo', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),events.getEventListByVideo);
    app.post('/api/events/getAllShoppersByStartTime', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),events.getAllShoppersByStartTime);
};
