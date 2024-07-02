const fs = require("fs");
const config = require("config");
const AnalysisModule = require("./AnalysisModule");
const { resolve } = require("path");
const { microflows, Annotation, JavaScriptSerializer, xmlschemas } = require("mendixmodelsdk");
var wc = require('../mxworkingcopy');
const exp = require("constants");
const { notDeepEqual } = require("assert");

class Entity {
    constructor(moduleName, entityName, documentation) {
        this.module = moduleName,
            this.documentation = documentation;
        this.name = entityName;
        this.attrs = [];
    }
}

class Menu {
    constructor(moduleName, document, caption, actionType, action) {
        this.module = moduleName;
        this.document = document;
        this.caption = caption;
        this.actionType = actionType;
        this.action = action;
    }
}

module.exports = class ModelQuality extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
        this.security = {};
        //this.entities = [];
        this.rules = [];
        this.domains = [];
        this.menus = [];
        this.errorCodes = {}

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

        this.collectSecurity(promises);
        this.collectMicroflows(promises);
        this.collectRules(promises);
        this.collectDomainModels(promises);
        this.collectMenus(promises);

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
            } else {
                this.reports.push({ type: 'app', document: checkModule.level, errors: errors });
            }
        }

    }

    report = function (fName) {
        let reports = this.reports;

        if (fName) {
            try {
                fs.writeFileSync(fName + '_analysis.csv', 'Module;Microflow;Code;Description\n');
            } catch (err) {
                console.error(err);
            }
        }
        reports.forEach(item => {
            let theDocument = item.document;
            item.errors.forEach((err) => {
                if (fName) {
                    try {
                        switch (item.type) {
                            case 'app':
                                fs.appendFileSync(fName + '_analysis.csv', 'APP;' + theDocument + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            case 'domainmodel':
                                let [domainModel, entityName, mfPrefix] = this.nameParts(theDocument)
                                fs.appendFileSync(fName + '_analysis.csv', domainModel + ';' + entityName + ';' + err.code + ';' + this.errorCodes[err.code] + '\n');
                                break;
                            case 'microflow':
                                let moduleName = this.getModuleName(theDocument);
                                fs.appendFileSync(fName + '_analysis.csv', moduleName + ';' + theDocument.name + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                break;
                            case 'menu':
                                    let menuName = item.document;
                                    fs.appendFileSync(fName + '_analysis.csv', 'Menu' + ';' + theDocument + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                                    break;
                            default:
                                console.log('Cannot determine: ' + item.type);
                        }
                        // if (typeof theDocument === 'string') {//not a real microflow ;-)
                        //     if (theDocument ==='domainmodel'){
                        //     } else {
                        //         fs.appendFileSync(fName + '_analysis.csv', 'APP;' + theDocument + ';' + err.code + ';' + this.errorCodes[err.code] + ';' + (err.comment || '')  + '\n');
                        //     }
                        // } else {
                        // }
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
        if (document instanceof Entity) {
            //console.log('Entity: '+JSON.stringify(document, null, 2));
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

    collectSecurity = function (promises) {
        let securities = this.model.allProjectSecurities();
        securities.forEach((securityIF) => {
            promises.push(new Promise((resolve, reject) => {
                if (securityIF.structureTypeName === 'Security$ProjectSecurity') {
                    securityIF.load().then((security) => {
                        this.security.enableDemoUsers = security.enableDemoUsers;
                        resolve();
                    })
                } else resolve();
            }))
        });
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

    collectDomainModels(promises) {
        let domains = this.findAllDomainModels();
        domains.forEach((domainIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = this.getModuleName(domainIF);
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    domainIF.load().then((domain) => {
                        //this.entities.push(...domain.entities);
                        let domainEntities = this.parseDomain(domain);
                        this.domains.push(...domainEntities);
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


    parseMicroflow = function (mf, parentMF) {
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            if (json['$Type'] === 'Microflows$Annotation') {
                let action_type = 'Annotation';
                this.updateHierarchy(mf, action_type, parentMF, null, { 'caption': json['caption'] });
            }
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                let action_type = 'LoopAction';
                this.updateHierarchy(parentMF || mf, action_type, parentMF);
                this.parseMicroflow(obj, parentMF || mf);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                let subMF = null;
                let complexity = 0;
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
                }
                this.updateHierarchy(mf, action_type, parentMF, subMF, { 'complexity': complexity });
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let action_type = 'StartEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let action_type = 'EndEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                let action_type = 'ExclusiveSplit';
                let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                let complexity = this.checkExpressionComplexity(condition);
                this.updateHierarchy(mf, action_type, parentMF, null, { 'caption': json['caption'], 'complexity': complexity });
            } else if (json['$Type'] === 'Microflows$ExclusiveMerge') {
                let action_type = 'ExclusiveMerge';
                this.updateHierarchy(mf, action_type, parentMF, null, { 'id': json['$ID'] });
            }
        });
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

    updateHierarchy = function (microflow, action, parentMicroflow, subMF, data) {
        let microflowName = '';
        let actions; let subMFs; let annotations;
        if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) { //working on top level or nested (looped) MF?
            microflowName = parentMicroflow.qualifiedName
        } else { microflowName = microflow.qualifiedName };
        let microflowData = this.hierarchy[microflowName];              //fetch existing info
        if (microflowData) {                                            //retrieve
            actions = microflowData.actions;
            subMFs = microflowData.subMFs;
            annotations = microflowData.annotations;
        } else {                                                        //or add new
            if (!this.hierarchy[microflowName]) {
                let mfToAdd = microflow;
                if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) {
                    mfToAdd = parentMicroflow;
                }
                this.hierarchy[microflowName] = { mf: mfToAdd };
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
    }


    parseRule = function (mf) {
        this.parseMicroflow(mf, null);
    }

    parseDomain = function (domain) {
        //console.log(JSON.stringify(domain, null, 2));
        let entities = domain.entities;
        let domainEntities = [];
        entities.forEach((entity) => {
            let moduleName = this.getModuleName(entity);
            let attributes = entity.attributes;
            let entityData = new Entity(moduleName, entity.name, entity.documentation || '')

            attributes.forEach((attribute) => {
                entityData.attrs.push(attribute.name);
            })
            domainEntities.push(entityData);
        })
        return domainEntities;
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
            if (subItems.length > 0){
                console.log("GOING SUB FOR: "+caption);
                this.parseMenuItems(subItems, module, document);
            }
        })
    }
}