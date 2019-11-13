'use strict';
angular
    .module('ideotics')
    .controller('TrackingController', TrackingController);

TrackingController.$inject = ['$rootScope','CamerasService','CategoryService','SubCategoryService','IconsService','ProjectsService'];
function TrackingController($rootScope,CamerasService,CategoryService,SubCategoryService,IconsService,ProjectsService) {
    // window.dashboard === false, terminate polling
    window.dashboard = false;
    $rootScope.setHeaderglobal(19);

    var vm = this;
    vm.dataOptionAdd = false;
    vm.flagRemOption = false;
    vm.flagAddOption = false;
    vm.flagAddSubCat = false;
    vm.flagShowCatsList = true;

    $rootScope.isUpdated = false;

    vm.users = [];

    vm.OPTION = "OPTION";

    vm.categoriesList = ['Shopper Profile', 'SKU Behaviour', 'Others', 'Exit Path'];
    vm.categoriesDataList = [];

    vm.idSelectedVote = null;
    vm.currentCategory = '';
    vm['category'] ={};

    vm.subCatOptToAddList = [];
    vm.category = {option: '0'};
    vm.subcategory = {option: '0'};

    vm.selectedMessages = [];
    vm.selectedCatIndexVal = 0;
    vm.categoriesCodesList = [];
    vm.copyOfCatCodesList = [];
    vm.getCategoriesList = function()
    {
        vm.selectedMessages = [];
        vm.categoriesCodesList = [];
        CategoryService
            .getCategoriesListByFilter({camera:vm.selectCameraName})
            .success(function(data, status) {
                vm.categoriesDataList = (data);
                for(var len=0;len<data.length;len++)
                {
                    if(data[len].isMandatory == 1)
                    {
                        vm.selectedMessages[len] = true;
                    }else
                    {
                        vm.selectedMessages[len] = false;
                    }

                    vm.categoriesCodesList.push({code:data[len].catcode,value:data[len].category,_id:data[len]._id});
                }

                if(data.length>0)
                {
                    vm.selectedCategory(0);
                }
            }).error(function(err, status) {
            });
    }

    vm.saveParmFlag = false;
    vm.saveParameters = function()
    {
        if(!vm.saveParmFlag) {
            vm.saveParmFlag = true;
            $rootScope.loadingAndBlockUI("Saving Parameters");
            $rootScope.isUpdated = false;
            CategoryService
                .saveModifiedChanges({camera: vm.selectCameraName})
                .success(function (data, status) {
                    vm.enableEdit();
                }).error(function (err, status) {
                });
        }
    }

    vm.changeCamera = function(currentCamera)
    {
        if($rootScope.isUpdated)
        {
            vm.selectCameraName = currentCamera;
            $rootScope.askForConfirmation();
        }else {
            vm.resetAll();
        }
    }

    vm.selectProjectName='0';
    vm.projects = [];
    vm.arrayOfProjects =
    vm.getProjectsList = function()
    {
        var filterObj = {};
        ProjectsService
            .getAllProjects(filterObj)
            .success(function(data, status) {
                vm.projects = data;

                var defaultProject = '0';
                if(data.length>0)
                {
                    for(var len=0;len<data.length;len++)
                    {
                        if(data[len].isbase && data[len].isbase === true)
                        {
                            defaultProject = String(data[len]._id);
                            break;
                        }
                    }
                    defaultProject = String(data[0]._id);
                }

                var dummyVal = {clientsId: 0, clientcode: 'Project Name'};
                vm.projects.splice(0,0, dummyVal);
                vm.selectProjectName = defaultProject;
                vm.getCamerasListByProject();
            }).error(function(err, status) {
                console.log(err);
                console.log(status);
            });
    }

    var dummyVal = {_id: 0, cameracode: 'Camera Name'};
    vm.cameras = [];
    vm.cameras.push(dummyVal);
    vm.selectCameraName='0';
    vm.getCamerasListByProject = function(currentSelectedProject)
    {
        if($rootScope.isUpdated)
        {
            vm.selectProjectName = currentSelectedProject;
            $rootScope.askForConfirmation();
        }else
        {
            vm.resetAll();
            vm.selectCameraName='0';
            vm.cameras = [];
            vm.cameras.push(dummyVal);
            if(vm.selectProjectName !== undefined && vm.selectProjectName !== null && vm.selectProjectName!= '0')
            {
                CamerasService
                    .getCamerasListByProject(vm.selectProjectName)
                    .success(function(data, status) {
                        vm.cameras = data;
                        var defaultCamera = '0';
                        if(data.length>0)
                        {
                            defaultCamera = String(data[0]._id);
                        }
                        vm.selectCameraName = defaultCamera;
                        vm.cameras.splice(0,0, dummyVal);

                        //vm.filterByProject();
                    }).error(function(err, status) {
                        console.log(err);
                    });
            }
        }
    }

    vm.doConfirm = function(msg, yesFn, noFn) {
        var doConfirmBox = $("#confirmBox");
        doConfirmBox.find(".message").text(msg);
        doConfirmBox.find(".yes,.no").unbind().click(function () {
            doConfirmBox.hide();
        });
        doConfirmBox.find(".yes").click(yesFn);
        doConfirmBox.find(".no").click(noFn);
        doConfirmBox.show();
    }

    vm.showEdit = false;
    vm.enableCatEdit = false;

    vm.filterByProject = function() {
        if($rootScope.isUpdated)
        {
            $rootScope.askForConfirmation();
        }else
        {
            vm.resetAll();
            if(vm.selectCameraName != undefined && vm.selectCameraName != null && vm.selectCameraName != '0')
            {
                vm.showEdit = true;
                vm.getCategoriesList();
            }
        }
    }

    vm.resetAll = function()
    {
        vm.showEdit = false;
        vm.categoriesDataList = [];
        vm.selectedMessages = [];
        vm.selectedCatIndexVal = 0;
        vm.categoriesCodesList = [];
        vm.copyOfCatCodesList = [];

        vm.enableCatEdit = false;

        if(vm.enableCatEdit)
        {
            vm.editTextMsg = "Disable Edit";
        }else
        {
            vm.editTextMsg = "Enable Edit";
        }

        vm.idSelectedVote = null;
        vm.currentCategory = '';
        vm.OPTION = "OPTION";
        vm.showAddEditIcon = false;
        vm.flagEditOptionAdd = false;

        vm.subCategoryOptionsList = [];
        vm.idSelectedSubCat = null;
        vm.idSelectedOption = null;
        vm.idSelOptToAdd = null;
        vm.dataOptionAdd = false;

        vm.flagRemOption = false;
        vm.flagAddOption = false;

        vm.flagAddSubCat = false;
        vm.flagShowSubCatsList = true;
    }


    vm.editTextMsg = "Enable Edit";
    vm.enableEdit = function()
    {
        vm.saveParmFlag = false;
        if($rootScope.isUpdated)
        {
            $rootScope.askForConfirmation()
        }else
        {
            vm.enableCatEdit = !vm.enableCatEdit;
            if(vm.enableCatEdit)
            {
                $rootScope.loadingAndBlockUI("Loading For Edit Camera");
                vm.copyCurrentStateCats();
                vm.editTextMsg = "Disable Edit";
            }else
            {
                $rootScope.loadingAndBlockUI("Loading Data");
                vm.editTextMsg = "Enable Edit";
                vm.selectedCategory(vm.selectedCatIndexVal);
            }
        }
    }

    vm.copyCurrentStateCats = function()
    {
        CategoryService
            .copyCategoriesAndSubCatsByFilter({camera:vm.selectCameraName})
            .success(function(data, status) {
                vm.selectedCategory(vm.selectedCatIndexVal);
            }).error(function(err, status) {
            });
    }

    vm.selectedCatCode = '';
    vm.status = true;
    vm.selectedCategory = function(index)
    {
        vm.selectedCatIndexVal = index;
        vm.idSelectedVote = index;
        vm.currentCategory = vm.categoriesList[index];
        vm.OPTION = "OPTION";
        vm.showAddEditIcon = false;
        vm.flagEditOptionAdd = false;
        vm.flagEditCateRelativeOption = false;
        vm.category.option = vm.categoriesDataList[vm.idSelectedVote].isMandatory;
        vm.category.isHidden = vm.categoriesDataList[vm.idSelectedVote].isHidden;
        vm.category.isMandatory = vm.categoriesDataList[vm.idSelectedVote].isMandatory;

        vm.copyOfCatCodesList = angular.copy(vm.categoriesCodesList);

        if(vm.copyOfCatCodesList.length>0)
        {
            for(var catLen = 0;catLen<vm.categoriesCodesList.length;catLen++)
            {
                if(vm.categoriesDataList[vm.idSelectedVote].catcode == vm.categoriesCodesList[catLen].code)
                {
                    vm.copyOfCatCodesList.splice(catLen, 1);
                    break;
                }
            }
        }
        vm.selectedCatCode = vm.categoriesDataList[index].catcode;
        /*SubCategoryService
            .getSubCategoriesByCat(vm.categoriesDataList[index]._id)
            .success(function(data, status) {
                vm['category'][vm.categoriesList[index]] = data;

                var namesList = [];
                for(var len=0 ;len<data.length;len++)
                {
                    var subCatOption = data[len].type;
                    if(data[len] && subCatOption && subCatOption.length>0)
                    {
                        for(var typeLen=0 ;typeLen<subCatOption.length;typeLen++)
                        {
                            namesList.push(subCatOption[typeLen].icon.name);
                        }
                    }
                }
                IconsService
                    .getListOfIcons(namesList)
                    .success(function(data, status) {
                        vm.subCatOptToAddList =data;
                    }).error(function(err, status) {
                });

            }).error(function(err, status) {
        });*/

        if(vm.enableCatEdit)
        {
            SubCategoryService
                .getSubCategoriesByFilter(vm.categoriesDataList[index]._id,0)
                .success(function(data, status) {
                    $rootScope.stopLoadingBlockUI();
                    vm.getListOfIconsData(data);
                }).error(function(err, status) {
                });
        }else
        {
            SubCategoryService
                .getSubCategoriesByCat(vm.categoriesDataList[index]._id)
                .success(function(data, status) {
                    $rootScope.stopLoadingBlockUI();
                    vm.getListOfIconsData(data);
                }).error(function(err, status) {
                });
        }
        $rootScope.stopLoadingBlockUI();
        vm.subCategoryOptionsList = [];
        vm.idSelectedSubCat = null;
        vm.idSelectedOption = null;
        vm.idSelOptToAdd = null;
        vm.dataOptionAdd = false;

        vm.flagRemOption = false;
        vm.flagAddOption = false;

        vm.flagAddSubCat = true;
        vm.flagShowSubCatsList = true;
    }

    vm.getListOfIconsData = function(data)
    {
        vm['category'][vm.categoriesList[vm.selectedCatIndexVal]] = data;

        var namesList = [];
        for(var len=0 ;len<data.length;len++)
        {
            var subCatOption = data[len].type;
            if(data[len] && subCatOption && subCatOption.length>0)
            {
                for(var typeLen=0 ;typeLen<subCatOption.length;typeLen++)
                {
                    namesList.push(subCatOption[typeLen].icon.name);
                }
            }
        }
        IconsService
            .getListOfIcons(namesList)
            .success(function(data, status) {
                vm.subCatOptToAddList =data;
            }).error(function(err, status) {
            });
    }

    vm.flagShowSubCatsList = true;
    vm.flagIsSubCatEdit = false;
    vm.addNewSubCat = function(type)
    {
        vm.subCatNameText = '';
        vm.flagIsSubCatEdit = false;
        vm.subcategory.option = '0';
        vm.subcategory.isMandatory = false;
        vm.subcategory.isHidden = false;
        vm.subcategory.reference = '0';
        vm.subcategory.category = '0';
        vm.subcategory.percentage = '0';

        if(type === 'new')
        {
            vm.idSelectedSubCat = null;
            vm.OPTION = 'Option';
        }else
        {
            vm.subcategory.option = vm['category'][vm.currentCategory][vm.idSelectedSubCat].isMandatory;
            vm.subCatNameText = vm['category'][vm.currentCategory][vm.idSelectedSubCat].subCategory;
            vm.subcategory.isMandatory = vm['category'][vm.currentCategory][vm.idSelectedSubCat].isMandatory;
            vm.subcategory.isHidden = vm['category'][vm.currentCategory][vm.idSelectedSubCat].isHidden;
            vm.subcategory.reference = vm['category'][vm.currentCategory][vm.idSelectedSubCat].refcatcode;
            vm.subcategory.category = vm['category'][vm.currentCategory][vm.idSelectedSubCat].category._id;
            vm.subcategory.percentage = vm['category'][vm.currentCategory][vm.idSelectedSubCat].percentage;
            vm.flagIsSubCatEdit = true;

            if(vm.subcategory.percentage == undefined || vm.subcategory.percentage == null)
            {
                vm.subcategory.percentage = 0;
            }
            if(vm.subcategory.reference == null || vm.subcategory.reference == undefined)
            {
                vm.subcategory.reference = '0';
            }
        }

        vm.errorMessages = '';

        vm.flagShowSubCatsList = false;

        vm.subCategoryOptionsList = [];

        vm.idSelectedOption = null;
        vm.idSelOptToAdd = null;
        vm.dataOptionAdd = false;

        vm.flagRemOption = false;
        vm.flagAddOption = false;

        vm.flagAddSubCat = false;
    }
    //vm.selectedCategory(0);

    vm.subCategoryOptionsList = [];
    vm.idSelectedSubCat = null;
    vm.subCatMandatory = false;

    vm.selectedSubCategory = function(index)
    {
        vm.idSelectedSubCat = index;
        vm.subCategoryOptionsList = vm['category'][vm.currentCategory][index].type;
        vm.OPTION = vm['category'][vm.currentCategory][index].subCategory;

        vm.subCatSelectedOption = vm['category'][vm.currentCategory][index];
        vm.subcategory.isMandatory = vm.subCatSelectedOption.isMandatory;
        vm.subcategory.isHidden = vm.subCatSelectedOption.isHidden;
        vm.category.isMandatory = vm.categoriesDataList[vm.idSelectedVote].isMandatory;
        vm.subcategory.reference = vm.subCatSelectedOption.refcatcode;

        vm.subCatMandatory = false;

        if(vm.subCatSelectedOption.isMandatory)
        {
            vm.subCatMandatory = true;
        }

        vm.idSelectedOption = null;
        vm.dataOptionAdd = true;

        vm.flagRemOption = false;
        vm.flagAddOption = false;

        vm.showAddEditIcon = false;
        vm.flagEditOptionAdd = false;
        vm.idSelOptToAdd = null;
        vm.flagEditCateRelativeOption = false;
    }

    vm.idSelectedOption = null;
    vm.selectedOptionToRemove = function(index)
    {
        vm.idSelectedOption = index;
        vm.flagRemOption = true;
    }

    vm.removeExistingOption = function()
    {
        vm.flagRemOption = false;
        if(vm.idSelectedOption!==null && vm.idSelectedOption !== undefined)
        {
            vm.subCatOptToAddList.push(vm.subCategoryOptionsList[vm.idSelectedOption].icon);

            vm.subCategoryOptionsList.splice(vm.idSelectedOption,1);
            vm.idSelectedOption = null;

            vm.updateTypesOfSubCat();
        }else
        {
            showNotificationMessage('Please Select the option to remove.',errorType.error);
        }
    }

    vm.moveUpOrDownOption = function(valueUpOrDown)
    {
        var temp = vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[vm.idSelectedOption];
        vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[vm.idSelectedOption] = vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[vm.idSelectedOption+valueUpOrDown];
        vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[vm.idSelectedOption+valueUpOrDown] = temp;

        vm.updateTypesOfSubCat();

        vm.idSelectedOption = null;
        vm.flagRemOption = false;
    }

    vm.moveUpOrDownSubCats = function(valueUpOrDown)
    {
        var temp = vm['category'][vm.currentCategory][vm.idSelectedSubCat];
        vm['category'][vm.currentCategory][vm.idSelectedSubCat] = vm['category'][vm.currentCategory][vm.idSelectedSubCat+valueUpOrDown];
        vm['category'][vm.currentCategory][vm.idSelectedSubCat+valueUpOrDown] = temp;

        var subCatIdList = [vm['category'][vm.currentCategory][vm.idSelectedSubCat]._id,vm['category'][vm.currentCategory][vm.idSelectedSubCat+valueUpOrDown]._id];
        var orderIdsList = [vm.idSelectedSubCat,vm.idSelectedSubCat+valueUpOrDown];

        SubCategoryService
            .updateOrderOfSubCats(vm['category'][vm.currentCategory][vm.idSelectedSubCat]._id,vm.idSelectedSubCat)
            .success(function(data, status) {
            }).error(function(err, status) {
            });

        SubCategoryService
            .updateOrderOfSubCats(vm['category'][vm.currentCategory][vm.idSelectedSubCat+valueUpOrDown]._id,vm.idSelectedSubCat+valueUpOrDown)
            .success(function(data, status) {
            }).error(function(err, status) {
            });

        vm.subCategoryOptionsList = [];
        vm.idSelectedSubCat = null;
        vm.idSelectedOption = null;
        vm.idSelOptToAdd = null;
        vm.dataOptionAdd = false;

        vm.flagRemOption = false;
        vm.flagAddOption = false;

        vm.flagAddSubCat = true;
        vm.flagShowSubCatsList = true;
        vm.OPTION = "OPTION";
    }

    vm.idSelOptToAdd = null;
    vm.selectedOptionToAdd = function(index)
    {
        vm.showAddEditIcon = true;
        vm.idSelOptToAdd = index;
        vm.flagAddOption = true;
    }

    vm.addNewOptionToSubCat = function()
    {
        vm.flagAddOption = false;
        vm.showAddEditIcon = false;
        if(vm.idSelOptToAdd !== null && vm.idSelOptToAdd !== undefined)
        {
            vm.subCategoryOptionsList.push({icon:vm.subCatOptToAddList[vm.idSelOptToAdd],refcatcode:'0'});
            vm.subCatOptToAddList.splice(vm.idSelOptToAdd,1);

            vm.updateTypesOfSubCat();
            vm.idSelOptToAdd = null;
        }else
        {
            showNotificationMessage('Please Select the option to Add.',errorType.error);
        }
    }

    vm.flagEditCateRelativeOption = false;
    vm.refIconCatCodeRel = '0';
    vm.alreadyIn = false;
    vm.isDefault = false;
    vm.editIconCatRelOption = function ()
    {
        vm.refIconCatCodeRel = vm.subCategoryOptionsList[vm.idSelectedOption].refcatcode;
        vm.alreadyIn = vm.subCategoryOptionsList[vm.idSelectedOption].alreadyIn;
        vm.isDefault = vm.subCategoryOptionsList[vm.idSelectedOption].isDefault;
        vm.flagEditCateRelativeOption = true;
    }

    vm.closeDataEntryRelCatValue = function ()
    {
        vm.refIconCatCodeRel = '0';
        vm.alreadyIn = false;
        vm.isDefault = false;
        vm.flagEditCateRelativeOption = false;
    }

    vm.onInputChange = function()
    {
        console.log(vm.isDefault)
    }

    vm.saveDataEntryRelCatValue = function ()
    {
        if(vm.isDefault)
        {
            for(var typeLen=0; typeLen<vm['category'][vm.currentCategory][vm.idSelectedSubCat].type.length;typeLen++)
            {
                vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[typeLen].isDefault = false;
            }
        }

        vm.subCategoryOptionsList[vm.idSelectedOption].refcatcode = vm.refIconCatCodeRel;
        vm.subCategoryOptionsList[vm.idSelectedOption].alreadyIn = vm.alreadyIn;
        vm.subCategoryOptionsList[vm.idSelectedOption].isDefault = vm.isDefault;
        vm.flagEditCateRelativeOption = false;
        vm.updateTypesOfSubCat();
    }

    vm.updateTypesOfSubCat = function()
    {
        var subCatSelectedId = vm['category'][vm.currentCategory][vm.idSelectedSubCat]._id;

        var typesList = [];
        for(var typeLen=0; typeLen<vm['category'][vm.currentCategory][vm.idSelectedSubCat].type.length;typeLen++)
        {
            typesList.push({icon:vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[typeLen].icon._id, refcatcode:vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[typeLen].refcatcode, alreadyIn:vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[typeLen].alreadyIn, isDefault:vm['category'][vm.currentCategory][vm.idSelectedSubCat].type[typeLen].isDefault});
        }

        SubCategoryService
            .addTypeToSubCat(subCatSelectedId,typesList)
            .success(function(data, status) {
                vm.selectedSubCategory(vm.idSelectedSubCat);
            }).error(function(err, status) {
            });
    }

    vm.changeCheckboxValueSubCat = function()
    {
        vm.subCatNameText = vm.subCatSelectedOption.name;
        vm.saveSubCategory();
    }

    vm.subCatNameText = '';
    vm.errorMessages = '';
    vm.saveSubCategory = function()
    {
        $rootScope.isUpdated = true;

        var subCatText = vm.subCatNameText.trim();
        if(subCatText.length>=3)
        {
            if(vm.idSelectedSubCat === null)
            {
                SubCategoryService
                    .saveSubCategory(subCatText, vm.categoriesDataList[vm.idSelectedVote]._id, vm['category'][vm.currentCategory].length,vm.selectProjectName,vm.subcategory.isMandatory,vm.subcategory.reference,vm.selectCameraName,vm.subcategory.isHidden)
                    .success(function (data, status) {
                        if (data && data.error)
                        {
                            vm.errorMessages = data.error;
                        } else
                        {
                            vm.flagShowSubCatsList = true;
                            vm.subCatNameText = '';
                            vm['category'][vm.currentCategory].push(data);
                        }
                    }).error(function (err, status) {
                });
            }else
            {
                var selectedCategoryId = vm.categoriesDataList[vm.idSelectedVote]._id;
                if(vm.subcategory.category && vm.subcategory.category != null && vm.subcategory.category != undefined && vm.subcategory.category != '0')
                {
                    selectedCategoryId = vm.subcategory.category;
                }
                SubCategoryService
                    .updateSubCategory(vm['category'][vm.currentCategory][vm.idSelectedSubCat]._id,subCatText,vm.subcategory.isMandatory,vm.subcategory.reference, selectedCategoryId,vm.selectCameraName,vm.subcategory.isHidden,vm.subcategory.percentage)
                    .success(function (data, status) {
                        if (data && data.error)
                        {
                            vm.errorMessages = data.error;
                        } else
                        {
                            vm.flagShowSubCatsList = true;
                            vm.subCatNameText = '';
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].isMandatory = vm.subcategory.isMandatory;
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].isHidden = vm.subcategory.isHidden;
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].name = subCatText;
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].subCategory = subCatText;
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].refcatcode = vm.subcategory.reference;
                            vm['category'][vm.currentCategory][vm.idSelectedSubCat].percentage = vm.subcategory.percentage;
                        }
                    }).error(function (err, status) {
                });
            }

        }else
        {
            vm.errorMessages = "Sub Category Name should be atleast 3 chars";
        }
    }

    vm.closeDataEntrySubCats = function() {
        vm.flagShowSubCatsList = true;
        vm.subCatNameText = '';
    }

    vm.deleteSubCategory = function()
    {
        vm.doConfirm("The Following Group is going to Delete. Do you want to continue?", function yes() {
            SubCategoryService
                .removeSubCategory(vm['category'][vm.currentCategory][vm.idSelectedSubCat]._id)
                .success(function (data, status) {
                    if (data && data.error)
                    {
                        vm.errorMessages = data.error;
                    } else
                    {
                        vm.flagShowSubCatsList = true;
                        vm.subCatNameText = '';
                        vm['category'][vm.currentCategory].splice(vm.idSelectedSubCat,1);
                    }
                }).error(function (err, status) {
            });
        }, function no() {
            // do nothing
        });
    }


    vm.catNameText = '';

    vm.editCategory = function()
    {
        vm.errorMessages = '';
        vm.flagShowCatsList = false;
        vm.catNameText = vm.categoriesDataList[vm.idSelectedVote].name;
        vm.category.option = vm.categoriesDataList[vm.idSelectedVote].isMandatory;
        vm.category.isHidden = vm.categoriesDataList[vm.idSelectedVote].isHidden;
        vm.category.isMandatory = vm.categoriesDataList[vm.idSelectedVote].isMandatory;
    }

    vm.changeCheckboxValue = function(id,obj)
    {
        vm.category.isMandatory = vm.selectedMessages[id];
        vm.idSelectedVote = id;
        vm.errorMessages = '';
        vm.catNameText = obj.category;
        vm.updateCategory();
    }

    vm.updateCategory = function()
    {
        var catText = vm.catNameText.trim();
        vm.selectedMessages[vm.idSelectedVote] = vm.category.isMandatory;
        if(catText.length>=3)
        {
            CategoryService
                .updateCategory(vm.categoriesDataList[vm.idSelectedVote]._id,catText,vm.category.isMandatory,vm.category.isHidden,vm.selectProjectName, vm.selectCameraName)
                .success(function(data, status) {
                    if(data && data.error)
                    {
                        vm.errorMessages = data.error;
                    }else
                    {
                        vm.categoriesDataList[vm.idSelectedVote] = data;
                        vm.flagShowSubCatsList = true;
                        vm.subCatNameText = '';

                        vm.catNameText = '';
                        vm.flagShowCatsList = true;
                    }
                }).error(function(err, status) {
            });
        }else
        {
            vm.errorMessages = "Category Name should be atleast 3 chars";
        }
    }

    vm.closeDataEntryCats = function()
    {
        vm.catNameText = '';
        vm.flagShowCatsList = true;
    }

    vm.flagEditOptionAdd = false;
    vm.showAddEditIcon = false;
    vm.editIconValue = '';

    vm.editIconValueOption = function()
    {
        vm.showAddEditIcon = false;
        vm.flagAddOption = false;

        vm.flagEditOptionAdd = true;
        vm.editIconValue = vm.subCatOptToAddList[vm.idSelOptToAdd].name;
        vm.imageUrl = vm.subCatOptToAddList[vm.idSelOptToAdd].imageUrl;
        vm.errorMessages ='';

        vm.iconUrl= '';
    }

    vm.addIconValueOption = function()
    {
        vm.showAddEditIcon = false;
        vm.flagAddOption = false;
        vm.idSelOptToAdd = null;

        vm.flagEditOptionAdd = true;
        vm.editIconValue = '';
        vm.errorMessages ='';
        vm.iconUrl = '';
        $('#myImg').attr('src', vm.orgImageUrl);
    }

    vm.closeDataEntryValue = function()
    {
        vm.showAddEditIcon = true;
        vm.flagEditOptionAdd = false;
        vm.editIconValue = '';
        vm.errorMessages = '';

        if(vm.idSelOptToAdd === null)
        {
            vm.showAddEditIcon = false;
        }
    }

    vm.orgImageUrl = "/assets/img/upload-icon.png";
    vm.imageUrl = "/assets/img/upload-icon.png";
    vm.iconUrl = '';

    vm.saveIconValue = function()
    {
        var iconVal = vm.editIconValue.trim();
        if(iconVal.length>=2)
        {
            iconVal = iconVal.toUpperCase();
            if(vm.idSelOptToAdd === null)
            {
                if(vm.iconUrl !== '')
                {
                    IconsService
                        .saveIcon(vm.iconUrl,iconVal)
                        .success(function(data, status) {
                            if(data && data.error)
                            {
                                vm.errorMessages = data.error;
                            }else
                            {
                                vm.subCatOptToAddList.push(data);

                                vm.flagEditOptionAdd = false;
                                vm.editIconValue = '';
                                vm.showAddEditIcon = true;
                                vm.iconUrl = '';
                            }
                        }).error(function(err, status) {
                    });
                }else
                {
                    showNotificationMessage('Please select Upload Icon to save.',errorType.error);
                }
            }else
            {
                var dataValObj = {_id: vm.subCatOptToAddList[vm.idSelOptToAdd]._id,name:iconVal,iconUrl: vm.iconUrl};
                IconsService
                    .updateIcon(dataValObj)
                    .success(function(data, status) {
                        if(data && data.error)
                        {
                            vm.errorMessages = data.error;
                        }else
                        {
                            vm.subCatOptToAddList[vm.idSelOptToAdd].name = iconVal;
                            vm.flagEditOptionAdd = false;
                            vm.editIconValue = '';
                            vm.showAddEditIcon = true;
                            vm.iconUrl = '';
                        }
                    }).error(function(err, status) {
                });
            }
        }else
        {
            vm.errorMessages = "Icon Name should be atleast 2 chars";
        }
    }

    vm.deleteIcon = function()
    {
        IconsService
            .removeIcon(vm.subCatOptToAddList[vm.idSelOptToAdd]._id)
            .success(function(data, status)
            {
                if(data && data.success)
                {
                    vm.subCatOptToAddList.splice(vm.idSelOptToAdd,1);

                    vm.flagEditOptionAdd = false;
                    vm.editIconValue = '';
                    vm.showAddEditIcon = true;
                    vm.iconUrl = '';
                    vm.idSelOptToAdd = null;
                }
            }).error(function(err, status) {
        });
    }

    $(function () {
        $(":file").change(function () {
            if (this.files && this.files[0]) {
                var reader = new FileReader();
                reader.onload = imageIsLoaded;
                reader.readAsDataURL(this.files[0]);
            }
        });
    });

    function imageIsLoaded(e) {
        $('#myImg').attr('src', e.target.result);
        vm.iconUrl = e.target.result;

        var iconVal = vm.editIconValue.trim();
        if(iconVal.length>=2) {
            if (vm.idSelOptToAdd !== null)
            {
                var dataValObj = {_id: vm.subCatOptToAddList[vm.idSelOptToAdd]._id, iconUrl: vm.iconUrl};
            }
        }
    };

}

