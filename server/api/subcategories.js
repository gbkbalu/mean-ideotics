var  vSubcategory= require('../controllers/subcategories');
var helper = require('../utils/helper');

module.exports = exports = function (subcategories) {
	'use strict';

	var app = subcategories.app;

	app.post('/api/subcategory', helper.canAccessRoute(['admin']),vSubcategory.newSubCategory);
    app.post('/api/subcategory/updateSubcategory', helper.canAccessRoute(['admin']),vSubcategory.updateSubCategory);
    app.get('/api/subcategory/byCat/:categoryId', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vSubcategory.getListOfSubCatsByCat);
    app.post('/api/subcategory/getAllSubCategoriesByCategory', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']), vSubcategory.getAllSubCategoriesByCategory);
    app.post('/api/subcategory/addTypeToSubCat', helper.canAccessRoute(['admin']),vSubcategory.updateSubCategory);
    app.post('/api/subcategory/updateOrderOfSubCats', helper.canAccessRoute(['admin']),vSubcategory.updateOrderOfSubCats);

    app.post('/api/subcategory/getSubCategoriesByFilter', helper.canAccessRoute(['admin','agent','reviewer','superreviewer']),vSubcategory.getSubCategoriesByFilter);

    app.post('/api/subcategory/removeSubCategory', helper.canAccessRoute(['admin']),vSubcategory.deleteSubCatById);
};
