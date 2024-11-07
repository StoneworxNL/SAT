const fs = require("fs");
const config = require("config");
var jspath = require('jspath');
const { resolve } = require("path");
const exp = require("constants");
const { microflows, Annotation, JavaScriptSerializer, xmlschemas } = require("mendixmodelsdk");

var wc = require('../mxworkingcopy');
const Entity = require("./Entity");
const AnalysisModule = require("./AnalysisModule");
const DomainCollector = require("./DomainCollector");
const SecurityCollector = require("./SecurityCollector");
const { log } = require("console");

class Menu {
    constructor(moduleName, document, caption, actionType, action) {
        this.module = moduleName;
        this.document = document;
        this.caption = caption;
        this.actionType = actionType;
        this.action = action;
    }
}

class Page {
    constructor(moduleName, pageName, documentation) {
        this.module = moduleName,
        this.documentation = documentation;
        this.name = pageName;
        this.allowedRoles = [];
        this.buttons = [];
    }
}
const SquatModule = require("../MxModel/Module");
const SquatEntity = require("../MxModel/Entity");
const SquatMicroflow = require("../MxModel/Microflow");
const SquatFolder = require("../MxModel/Folder");
const SquatMenu = require("../MxModel/Menu");
const SquatPage = require("../MxModel/Page");

class MxModel {
    constructor() {
        this.security = {},
        this.modules = [];
        this.entities = [];
        this.microflows = [];
        this.folders = {};
        this.menus = [];
        this.pages = [];
    }
}

module.exports = class ModelQuality extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.MxModel = new MxModel();
        this.microflows_by_name;
        this.security = {};
        this.rules = [];
        this.domains = [];
        this.menus = [];
        this.errorCodes = {}
        this.pages = [];
        this.domainCollector = new DomainCollector(this);
        this.securityCollector = new SecurityCollector(this);

        const checks = config.get("checks");
        let checksFolder = config.get("checksFolder");
        this.checkModules = [];
        checks.forEach((check) => {
            let moduleName = checksFolder + check.fnc;
            let CheckModule = require(moduleName);
            let checkMod = new CheckModule(check.options);
            Object.assign(this.errorCodes, checkMod.getErrorCodes());
            this.checkModules.push(checkMod);
        });

    }

    collect = function (model, branch, workingCopy) {
        this.model = model;
        this.branch = branch;
        this.workingCopy = workingCopy;
        this.filterMarketplace();
        if (!this.model) {
            return
        }
        var promises = [];

        this.securityCollector.collect(promises);
        this.collectMicroflows(promises);
        this.collectRules(promises);
        this.domainCollector.collect(promises, this.domains);
        this.collectMenus(promises);
        this.collectPages(promises);

        return Promise.all(promises).then(() => {
            resolve()
        });
    }


    analyse = function () {
        console.log("===================================ANALYSIS ==============================\n");
        let dms = this.model.allDomainModels();
        let dmPromises = [];
        return new Promise((resolve, reject) => {
            this.checkModules.forEach((checkModule) => {
                if (checkModule.level === 'security') {
                    this.executeCheck(checkModule, this.model);
                } else if (checkModule.level === 'domainmodel') {
                    this.domains.forEach(entity => {
                        this.executeCheck(checkModule, entity);
                    })
                } else if (checkModule.level === 'menu') {
                    this.menus.forEach(menu => {
                        this.executeCheck(checkModule, menu);
                    })
                } else if (checkModule.level === 'page') {
                    this.pages.forEach(page => {
                        this.executeCheck(checkModule, page);
                    })
                }
            })

            Object.keys(this.hierarchy).forEach((microflow) => {
                if (microflow && microflow != 'undefined') {
                    this.checkModules.forEach((checkModule) => {
                        if (checkModule.level === 'microflow') {
                            this.executeCheck(checkModule, microflow);
                        }
                    })
                }
            })
            resolve();
        })
    }

    executeCheck = function (checkModule, document) {
        let errors = checkModule.check(this, document);
        if (errors && errors.length > 0) {
            if (checkModule.level === 'microflow') {
                let mf = this.hierarchy[document];
                this.reports.push({ type: 'microflow', document: mf.mf, errors: errors });
            } else if (checkModule.level === 'domainmodel') {
                this.reports.push({ type: 'domainmodel', document: document.module + '.' + document.name, errors: errors });
            } else if (checkModule.level === 'menu') {
                this.reports.push({ type: 'menu', document: document.module + '.' + document.document, errors: errors });
            } else if (checkModule.level === 'page') {
                this.reports.push({ type: 'page', document: document.module + '.' + document.name, errors: errors });
            } else {
                this.reports.push({ type: 'app', document: checkModule.level, errors: errors });
            }
        }

    }

    report = function (nickName) {
        let reports = this.reports;
        var now = new Date();
        let dateTimeString = this.getDateTimeString();

        let folder = config.get("outputFolder")||'./';
        this.reportFile = `${folder}/${nickName}_${this.branch}_${dateTimeString}.csv`;
        console.log("Writing to "+this.reportFile);
        if (nickName) {
            try {
                fs.writeFileSync(this.reportFile, 'Module;Microflow;Code;Description;Info\n');
            } catch (err) {
                console.error(err);
            }
        }
        reports.forEach(item => {
            let theDocument = item.document;
            item.errors.forEach((err) => {
                if (nickName) {
                    try {
                        switch (item.type) {
                            case 'app':
                                fs.appendFileSync(this.reportFile, 'APP;' + theDocument + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            case 'domainmodel':
                                let [domainModel, entityName, mfPrefix] = this.nameParts(theDocument)
                                fs.appendFileSync(this.reportFile, domainModel + ';' + entityName + ';' + err.code + ';' + this.errorCodes[err.code]+ ';' + (err.comment || '')  + '\n');
                                break;
                            case 'microflow':
                                let moduleName = this.getModuleName(theDocument);
                                fs.appendFileSync(this.reportFile, moduleName + ';' + theDocument.name + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            case 'menu':
                                let menuName = item.document;
                                fs.appendFileSync(this.reportFile, 'Menu' + ';' + theDocument + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            case 'page':
                                let [pageModuleName, pageName] = theDocument.split('.');
                                fs.appendFileSync(this.reportFile, pageModuleName  + ';' + pageName + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            default:
                                console.log('Cannot determine: ' + item.type);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    console.log(moduleName + ';' + theDocument.name + ';' + err.code + ';' + this.errorCodes[err.code]);
                }
            })
        })
    }

    getIgnoreRuleAnnotations = function (document) {
        let ignoreRuleAnnotations = [];
        if (document instanceof Entity || document instanceof Page) {
            let documentation = document.documentation;
            let ignoreRuleAnnotation = documentation.match(/^@SAT-([A-Z]{2}\d): .*/);
            if (ignoreRuleAnnotation) {
                return [ignoreRuleAnnotation[1]];
            }
            return [];
        } else {
            let mfActions = this.hierarchy[document].actions;
            ignoreRuleAnnotations = mfActions.flatMap((action) => {
                if (action.type === 'Annotation') {
                    let ignoreRuleAnnotation = action.caption.match(/^@SAT-([A-Z]{2}\d): .*/);
                    if (ignoreRuleAnnotation) {
                        return ignoreRuleAnnotation[1];
                    }
                    return [];
                }
                return [];
            })
        }
        return ignoreRuleAnnotations;
    }

    collectMicroflows(promises) {
        this.microflows = this.findAllMicroflows();
        this.microflows.forEach((microflowIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = this.getModuleName(microflowIF);
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    microflowIF.load().then((microflow) => {
                        this.parseMicroflow(microflow);
                        resolve();
                    })
                        .catch((err) => { console.log(err) })
                } else { resolve() };
            }))
        });
    }

    collectRules(promises) {
        this.rules = this.findAllRules();
        this.rules.forEach((ruleIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = this.getModuleName(ruleIF);
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    ruleIF.load().then((rule) => {
                        this.parseRule(rule);
                        resolve();
                    });
                } else { resolve() };
            }))
        });
    }

    collectMenus(promises) {
        let menus = this.model.allMenuDocuments();
        let navigations = this.model.allNavigationDocuments();
        navigations.forEach(navigationIF => {
            promises.push(new Promise((resolve, reject) => {
                navigationIF.load().then((navigation) => {
                    let profiles = navigation.profiles;
                    profiles.forEach(profile => {
                        let menuItems = profile.menuItemCollection.items;
                        this.parseMenuItems(menuItems, 'Navigation', profile.name);
                    })
                    resolve();
                });
            }))
        });
        menus.forEach((menuIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = this.getModuleName(menuIF);
                let menuName = menuIF.name;
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    menuIF.load().then((menu) => {
                        let menuItems = menu.itemCollection.items;
                        this.parseMenuItems(menuItems, moduleName, menuName);
                        resolve();
                    });
                } else { resolve() };
            }))
        });
    }

    collectPages(promises) {
        let pages = this.findAllPages();
        pages.forEach((pageIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = this.getModuleName(pageIF);
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    pageIF.load().then((page) => {
                        this.parsePage(page, moduleName, pageIF.name);
                        resolve();
                    });
                } else { resolve() };
            }))
        });
    }


    parseMicroflow = function (mf, parentMF) {
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        let returnType = mf.microflowReturnType;
        let mfReturnType = '';let mfReturnEntity = '';
        if (returnType && returnType.structureTypeName){
            mfReturnType = returnType.structureTypeName;
            if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType' ){
                if(returnType.entity){
                    mfReturnEntity = returnType.entity.name;
                } else {
                    mfReturnEntity = returnType.toJSON().entity;
                }
            }
        };
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            let actionId = json['$ID'];
            if (json['$Type'] === 'Microflows$Annotation') {
                let action_type = 'Annotation';
                this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId, 'caption': json['caption'] });
            }
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                let action_type = 'LoopAction';
                this.updateHierarchy(parentMF || mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId});
                this.parseMicroflow(obj, parentMF || mf);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                let subMF = null;
                let complexity = 0;
                let commit = false;
                if (action_type === 'Microflows$MicroflowCallAction') {
                    subMF = json['action']['microflowCall']['microflow'];
                } else if (action_type === 'Microflows$CreateVariableAction') {
                    complexity = this.checkExpressionComplexity(json['action']['initialValue']);
                } else if (action_type === 'Microflows$ChangeVariableAction') {
                    complexity = this.checkExpressionComplexity(json['action']['value']);
                } else if (action_type === 'Microflows$CreateObjectAction' || action_type === 'Microflows$ChangeObjectAction') {
                    json['action']['items'].forEach((item) => {
                        let count = this.checkExpressionComplexity(item['value']);
                        if (count > complexity) { complexity = count };
                    })
                    if (json['action']['commit'] === 'Yes') {
                        commit = true;
                    }
                }
                this.updateHierarchy(mf, action_type, parentMF, subMF, mfReturnType, mfReturnEntity, { 'id': actionId, 'complexity': complexity, 'commit': commit });
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let action_type = 'StartEvent';
                this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId});
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let action_type = 'EndEvent';
                this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId});
            } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {                
                let action_type = 'ExclusiveSplit';
                let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                let complexity = this.checkExpressionComplexity(condition);
                this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, {'id': actionId, 'caption': json['caption'], 'complexity': complexity });
            } else if (json['$Type'] === 'Microflows$ExclusiveMerge') {
                let action_type = 'ExclusiveMerge';
                this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId, });
            }
        });
        let microflowName = this.getMicroflowName(mf, parentMF);
        let microflowData = this.hierarchy[microflowName];
        if (mf.flows){
            let flowsJSON = JSON.parse(JSON.stringify(mf.flows, null, 2));
            let flows = flowsJSON.map((flow)=>{
                return {origin: flow.origin, originIndex: flow.originConnectionIndex
                    , desitination: flow.destination, destinationIndex: flow.destinationConnectionIndex, 
                    value: ((flow.caseValue && flow.caseValue.value)? flow.caseValue.value:'')
                }
            })
            microflowData.flows = flows;
        } else { microflowData.flows = []}
    }

    checkExpressionComplexity(expression) {
        let result = 0;
        let regex = /(if(\s|\()|and(\s|\()|or(\s|\()|not(\s|\())/g;
        let matches = expression.match(regex) || [];
        if (matches.length > 0) {
            result = matches.length;
        }
        return result;
    }


    getMicroflowName = function(microflow, parentMicroflow){
        let microflowName = '';
        if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) { //working on top level or nested (looped) MF?
            microflowName = parentMicroflow.qualifiedName
        } else { microflowName = microflow.qualifiedName };
        return  microflowName;             
    }

    updateHierarchy = function (microflow, action, parentMicroflow, subMF, mfReturnType, mfReturnEntity, data) {
        let actions; let subMFs; let annotations;let returnType;let returnEntity;
        let microflowName = this.getMicroflowName(microflow, parentMicroflow);
        let microflowData = this.hierarchy[microflowName];  //fetch existing info
        if (microflowData) {                                            //retrieve
            actions = microflowData.actions;
            subMFs = microflowData.subMFs;
            annotations = microflowData.annotations;
            returnType = microflowData.returnType;
            returnEntity = microflowData.returnEntity;
        } else {                                                        //or add new
            if (!this.hierarchy[microflowName]) {
                let mfToAdd = microflow;
                if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) {
                    mfToAdd = parentMicroflow;
                }
                this.hierarchy[microflowName] = { mf: mfToAdd, returnType: returnType, returnEntity: returnEntity};
            }
        }
        let actionInfo = { 'type': action };
        Object.assign(actionInfo, data);
        if (actions) {                                                  //update or create actions
            actions.push(actionInfo);
        } else {
            this.hierarchy[microflowName].actions = [actionInfo];
        }
        if (subMF && subMFs) {                                          //update or create sub microflows
            subMFs.push(subMF);
        } else {
            if (subMF) {
                this.hierarchy[microflowName].subMFs = [subMF];
            }
        }
        if (returnType) {                                                  //update or create actions
            returnType = mfReturnType;
        } else {
            this.hierarchy[microflowName].returnType = mfReturnType;
        }
        if (returnEntity) {                                                  //update or create actions
            returnEntity = mfReturnEntity;
        } else {
            this.hierarchy[microflowName].returnEntity = mfReturnEntity;
        }
    }


    parseRule = function (mf) {
        this.parseMicroflow(mf, null);
    }

    parseMenuItems = function (menuItems, module, document) {
        menuItems.forEach(menuItem => {
            let itemJSON = menuItem.toJSON();
            let menu;
            let caption = itemJSON.caption.translations[0].text;
            switch (itemJSON.action.$Type) {
                case 'Pages$PageClientAction':
                    let page = itemJSON.action.pageSettings.page;
                    menu = new Menu(module, document, caption, 'page', page)
                    this.menus.push(menu);
                    break
                case 'Pages$MicroflowClientAction':
                    let microflow = itemJSON.action.microflowSettings.microflow;
                    menu = new Menu(module, document, caption, 'microflow', microflow);
                    this.menus.push(menu);
                    break
                default:

            }
            let subItems = menuItem.items;
            if (subItems.length > 0) {
                this.parseMenuItems(subItems, module, document);
            }
        })
    }

    parsePage = function (page, module, pageName) {
        let thePage = new Page(module, pageName, page.documentation);
        let json = JSON.parse(JSON.stringify(page));
        const footerButtons = jspath.apply('..footerWidgets{.$Type==="Pages$ActionButton"}', json);
        const buttons = jspath.apply("..widgets{.$Type==='Pages$ActionButton'}", json);
        let allowedRoles = jspath.apply('.allowedRoles', json);
        thePage.allowedRoles = allowedRoles;
        footerButtons.forEach((button) => {
            thePage.buttons.push({ type: button.action.$Type })
        })
        buttons.forEach((button) => {
            thePage.buttons.push({ type: button.action.$Type })
        })
        this.pages.push(thePage);

    }
}