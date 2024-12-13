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
const ModuleCollector = require("./ModuleCollector");
const FolderCollector = require("./FolderCollector");
const MenuCollector = require("./MenuCollector");
const PageCollector = require("./PageCollector");

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

const MxModel = require("../MxModel/MxModel");
const SquatModule = require("../MxModel/Module");
const SquatEntity = require("../MxModel/Entity");
const SquatMicroflow = require("../MxModel/Microflow");
const { Action, JavaAction, ExpressionAction } = require('../MxModel/Action');
const SquatFolder = require("../MxModel/Folder");
const SquatMenu = require("../MxModel/Menu");
const SquatPage = require("../MxModel/Page");

module.exports = class ModelQuality extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.MxModel = new MxModel();
        /*        this.microflows_by_name;
                this.security = {};
                this.rules = [];
                this.domains = [];
                this.errorCodes = {}
                */
        this.pages = [];
        this.menus = [];
        this.securityCollector = new SecurityCollector(this);
        this.domainCollector = new DomainCollector(this);
        this.moduleCollector = new ModuleCollector(this);
        this.folderCollector = new FolderCollector(this);
        this.menuCollector = new MenuCollector(this);
        this.pageCollector = new PageCollector(this);
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
        this.moduleCollector.collect(promises);
        this.collectMicroflows(promises);
        this.collectRules(promises);
        this.domainCollector.collect(promises, this.domains);
        this.folderCollector.collect(promises);
        this.menuCollector.collect(promises);
        this.pageCollector.collect(promises);

        return Promise.all(promises).then(() => {
            resolve()
        });
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
                        //                        this.parseMicroflow(microflow);
                        this.parseMxMicroflow(microflow);
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

    // collectPages(promises) {
    //     let pages = this.findAllPages();
    //     pages.forEach((pageIF) => {
    //         promises.push(new Promise((resolve, reject) => {
    //             let moduleName = this.getModuleName(pageIF);
    //             let excludeThis = false;
    //             if (this.excludes) {
    //                 excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
    //             }
    //             if (!excludeThis) {
    //                 pageIF.load().then((page) => {
    //                     this.parsePage(page, moduleName, pageIF.name);
    //                     resolve();
    //                 });
    //             } else { resolve() };
    //         }))
    //     });
    // }

    parseMxMicroflow(mf) {
        let [returnType, returnEntity] = this.getReturnTypeEntity(mf);
        let microflow = new SquatMicroflow(mf.container.id, mf.name, returnType, returnEntity);
        if (mf.flows) {
            let flowsJSON = JSON.parse(JSON.stringify(mf.flows, null, 2));
            let flows = flowsJSON.map((flow) => {
                return {
                    origin: flow.origin, originIndex: flow.originConnectionIndex
                    , desitination: flow.destination, destinationIndex: flow.destinationConnectionIndex,
                    value: ((flow.caseValue && flow.caseValue.value) ? flow.caseValue.value : '')
                }
            })
            microflow.flows = flows;
        } else { microflow.flows = [] }
        this.parseMFActions(mf, microflow);
        let allowedRoles = mf['allowedModuleRoles'];
        if (allowedRoles && allowedRoles.length > 0) {
            microflow.roles = allowedRoles.flatMap(allowedRole => allowedRole.qualifiedName);
        }
        this.MxModel.microflows.push(microflow);
    }

    parseMFActions(mf, microflowData) {
        let actions = mf.objectCollection.objects;

        actions.forEach(action => {
            let json = action.toJSON();
            let actionId = json['$ID'];
            let actionType = json['$Type'];
            let complexity = 0;
            if (actionType === 'Microflows$Annotation') {
                let annotation = json['caption'];
                microflowData.addAnnotation(annotation);
            }
            if (actionType === 'Microflows$LoopedActivity') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
                this.parseMFActions(action, microflowData);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                let subMF = null;
                let commit = false;
                if (action_type === 'Microflows$MicroflowCallAction') {
                    let actionData = new Action(action_type, actionId);
                    microflowData.addAction(actionData);
                    subMF = json['action']['microflowCall']['microflow'];
                    microflowData.addSubMicroflow(subMF);
                } else if (action_type === 'Microflows$CreateVariableAction') {
                    complexity = this.checkExpressionComplexity(json['action']['initialValue']);
                    let caption = json['caption'];
                    let actionData = new ExpressionAction(action_type, actionId, false, complexity, caption);
                    microflowData.addAction(actionData);
                } else if (action_type === 'Microflows$ChangeVariableAction') {
                    complexity = this.checkExpressionComplexity(json['action']['value']);
                    let caption = json['caption'];
                    let actionData = new ExpressionAction(action_type, actionId, false, complexity, caption);
                    microflowData.addAction(actionData);
                } else if (action_type === 'Microflows$CreateObjectAction' || action_type === 'Microflows$ChangeObjectAction') {
                    json['action']['items'].forEach((item) => {
                        let count = this.checkExpressionComplexity(item['value']);
                        if (count > complexity) { complexity = count };
                    })
                    if (json['action']['commit'] === 'Yes') {
                        commit = true;
                    }
                    let actionData = new ExpressionAction(action_type, actionId, commit, complexity);
                    microflowData.addAction(actionData);
                } else {
                    let actionData = new Action(action_type, actionId);
                    microflowData.addAction(actionData);
                }
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                complexity = this.checkExpressionComplexity(condition);
                let caption = json['caption'];
                let actionData = new ExpressionAction(actionType, actionId, false, complexity, caption);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$ExclusiveMerge') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            }
        });
    }

    /*    parseMicroflow = function (mf, parentMF) {
            let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
            let returnType = mf.microflowReturnType;
            let mfReturnType = ''; let mfReturnEntity = '';
            if (returnType && returnType.structureTypeName) {
                mfReturnType = returnType.structureTypeName;
                if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType') {
                    if (returnType.entity) {
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
                    this.updateHierarchy(parentMF || mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId });
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
                    this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId });
                } else if (json['$Type'] === 'Microflows$EndEvent') {
                    let action_type = 'EndEvent';
                    this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId });
                } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                    let action_type = 'ExclusiveSplit';
                    let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                    let complexity = this.checkExpressionComplexity(condition);
                    this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId, 'caption': json['caption'], 'complexity': complexity });
                } else if (json['$Type'] === 'Microflows$ExclusiveMerge') {
                    let action_type = 'ExclusiveMerge';
                    this.updateHierarchy(mf, action_type, parentMF, null, mfReturnType, mfReturnEntity, { 'id': actionId, });
                }
            });
            let microflowName = this.getMicroflowName(mf, parentMF);
            let microflowData = this.hierarchy[microflowName];
            if (mf.flows) {
                let flowsJSON = JSON.parse(JSON.stringify(mf.flows, null, 2));
                let flows = flowsJSON.map((flow) => {
                    return {
                        origin: flow.origin, originIndex: flow.originConnectionIndex
                        , desitination: flow.destination, destinationIndex: flow.destinationConnectionIndex,
                        value: ((flow.caseValue && flow.caseValue.value) ? flow.caseValue.value : '')
                    }
                })
                microflowData.flows = flows;
            } else { microflowData.flows = [] }
        }
    
            updateHierarchy = function (microflow, action, parentMicroflow, subMF, mfReturnType, mfReturnEntity, data) {
            let actions; let subMFs; let annotations; let returnType; let returnEntity;
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
                    this.hierarchy[microflowName] = { mf: mfToAdd, returnType: returnType, returnEntity: returnEntity };
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
    
    */
    getReturnTypeEntity(mf) {
        let returnType = mf.microflowReturnType;
        let mfReturnType = ''; let mfReturnEntity = '';
        if (returnType && returnType.structureTypeName) {
            mfReturnType = returnType.structureTypeName;
            if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType') {
                if (returnType.entity) {
                    mfReturnEntity = returnType.entity.qualifiedName;
                } else {
                    mfReturnEntity = returnType.toJSON().entity;
                }
            }
        };
        return [mfReturnType, mfReturnEntity];
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


    getMicroflowName = function (microflow, parentMicroflow) {
        let microflowName = '';
        if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) { //working on top level or nested (looped) MF?
            microflowName = parentMicroflow.qualifiedName
        } else { microflowName = microflow.qualifiedName };
        return microflowName;
    }

    parseRule = function (mf) {
        this.parseMxMicroflow(mf);
    }

    // parsePage = function (page, module, pageName) {
    //     let thePage = new Page(module, pageName, page.documentation);
    //     let json = JSON.parse(JSON.stringify(page));
    //     const footerButtons = jspath.apply('..footerWidgets{.$Type==="Pages$ActionButton"}', json);
    //     const buttons = jspath.apply("..widgets{.$Type==='Pages$ActionButton'}", json);
    //     let allowedRoles = jspath.apply('.allowedRoles', json);
    //     thePage.allowedRoles = allowedRoles;
    //     footerButtons.forEach((button) => {
    //         thePage.buttons.push({ type: button.action.$Type })
    //     })
    //     buttons.forEach((button) => {
    //         thePage.buttons.push({ type: button.action.$Type })
    //     })
    //     this.pages.push(thePage);
    // }
}