var  vOptions= require('../controllers/options');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

	app.post('/api/option', helper.canAccessRoute(['admin']),vOptions.newOption);

	app.get('/api/options', helper.canAccessRoute(['admin','agent']), vOptions.getOptions);
	app.get('/api/options/category/:category', helper.canAccessRoute(['admin','agent']), vOptions.getOptionsByCategoryName);
	app.get('/api/options/subcategory/:subcategory', helper.canAccessRoute(['admin','agent']), vOptions.getOptionsBySubCategoryName);
	app.get('/api/options/categories/:categoryName', helper.canAccessRoute(['admin','agent']), vOptions.getOptionsForCategory);

    app.put('/api/category/update', helper.canAccessRoute(['admin','agent']), vOptions.updateOption);

	app.put('/api/option/update', helper.canAccessRoute(['admin','agent']), vOptions.updateOption);

    app.post('/api/options/catList/getListOfImage', helper.canAccessRoute(['admin','agent']),vOptions.getListOfImages);
    app.get('/api/options/getListOfSubCats', helper.canAccessRoute(['admin','agent']), vOptions.getListOfSubCats);
    app.get('/api/options/getCategoriesList', helper.canAccessRoute(['admin','agent']), vOptions.getCategoriesList);

};
