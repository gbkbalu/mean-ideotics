var  vCategories= require('../controllers/categories');
var helper = require('../utils/helper');

module.exports = exports = function (options) {
	'use strict';

	var app = options.app;

	app.post('/api/category/update', helper.canAccessRoute(['admin']), vCategories.updateCategory);
    app.get('/api/category/getCategoriesList', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCategories.getCategoriesList);
    app.post('/api/category/getCategoriesListByProject', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCategories.getCategoriesListByProject);
    app.post('/api/category/getCategoriesListByFilter', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCategories.getCategoriesListByFilter);
    app.post('/api/category/copyCategoriesAndSubCatsByFilter', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCategories.copyCategoriesAndSubCatsByFilter);
    app.post('/api/category/saveModifiedChanges', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vCategories.saveModifiedChanges);

    app.post('/api/category/getCatsAndUpdateSucatsSeqsByProject',helper.canAccessRoute(['admin']), vCategories.getCatsAndUpdateSucatsSeqsByProject);
};
