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
        //this.filterMarketplace();
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

    parseMxMicroflow(mf) {
        let [returnType, returnEntity] = this.getReturnTypeEntity(mf);
        let microflow = new SquatMicroflow(mf.container.id, mf.name, returnType, returnEntity);
        if (mf.flows) {
            let flowsJSON = JSON.parse(JSON.stringify(mf.flows, null, 2));
            let flows = flowsJSON.map((flow) => {
                return {
                    origin: flow.origin, destination: flow.destination,
                    isErrorHandler: flow.isErrorHandler,
                    flowValue: ((flow.caseValue && flow.caseValue.value) ? flow.caseValue.value == 'true' : false)
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
                    if (json['action']['commit'].includes('Yes')) {
                        commit = true;
                    }
                    if (action_type === 'Microflows$CreateObjectAction') {
                        action_type = 'Microflows$CreateChangeAction';
                    } else {
                        action_type = 'Microflows$ChangeAction';
                    }
                    let actionData = new ExpressionAction(action_type, actionId, commit, complexity);
                    actionData.variableName = json['action']['outputVariableName'] ? json['action']['outputVariableName'] : json['action']['changeVariableName'];
                    microflowData.addAction(actionData);
                } else if (action_type=== 'Microflows$CommitAction'){
                    let commitVariable = json['action']['commitVariableName'];
                    let actionData = new Action(action_type, actionId, commitVariable);
                    microflowData.addAction(actionData);

                } else if (action_type === 'Microflows$RetrieveAction') {
                    let returnValue = action.action.outputVariableName;
                    let actionData = new Action(action_type, actionId, returnValue);
                    microflowData.addAction(actionData);
                } else if (action_type === 'Microflows$JavaActionCallAction') {
                    let errorHandling = json['action']['errorHandlingType'];
                    let javaActionName = json['action']['javaAction'];
                    let actionData = new JavaAction(action_type, actionId, errorHandling, javaActionName);
                    microflowData.addAction(actionData);
                } else {
                    //console.log(action_type);
                    switch (action_type) {
                        case 'Microflows$ShowPageAction':
                            action_type = 'Microflows$ShowFormAction';
                            break;
                        case 'Microflows$ListOperationAction':
                            action_type = 'Microflows$ListOperationsAction';
                            break;
                        case 'Microflows$AggregateListAction':
                            action_type = 'Microflows$AggregateAction';
                            break;
                        default:
                            break;

                    }
                    let actionData = new Action(action_type, actionId);
                    microflowData.addAction(actionData);
                }
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let returnValue = action.returnValue.replace(/^\$/, "");
                let actionData = new Action(actionType, actionId, returnValue);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                complexity = this.checkExpressionComplexity(condition);
                let caption = json['caption'];
                let actionData = new ExpressionAction(actionType, actionId, false, complexity, caption, condition);
                microflowData.addAction(actionData);
            } else if (json['$Type'] === 'Microflows$ExclusiveMerge') {
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            } else {
                switch (actionType) {
                    case 'Microflows$MicroflowParameterObject':
                        actionType = 'Microflows$MicroflowParameter';
                        break;
                    case 'Microflows$ListOperationAction':
                        actionType = 'Microflows$ListOperationsAction';
                        break;
                    default:
                        break;
                }
                let actionData = new Action(actionType, actionId);
                microflowData.addAction(actionData);
            }
        });
    }

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

}