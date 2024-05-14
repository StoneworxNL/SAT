const fs = require("fs");
const AnalysisModule = require("./AnalysisModule");
const { resolve } = require("path");
const { microflows, Annotation, JavaScriptSerializer } = require("mendixmodelsdk");
var wc = require('../mxworkingcopy');
const exp = require("constants");

module.exports = class MicroflowQuality extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
        this.entities = [];
        this.cxMaxActions = 25;
        this.cxMaxComplexity = 30;
        this.cxLoopCount = 4;
        this.cxExclusiveSplit = 5;
        this.cxObjectAction = 2;
        this.cxVariableAction = 1;
        this.cxMaxObjectExpression = 3;
        this.cxMaxVariableExpression = 5;

        this.errorCodes = {
            "NC1": "format: [PRE]_[Entity(s)]_description",
            "NC2": "Prefix must be allowed",
            "NC3": "entity must exist ",
            "NC4": "entity must exist in same module",
            "IP1": "Show Page action outside of ACT",
            "IP2": "Close Page action outside of ACT",
            "CM1": "Commit not on correct hierarchy level(ACT or one level down)",
            "PM1": "Microflow of this type should contain permissions",
            "EH1": "Java Action without custom error handling",
            "CX1": "Too many actions in a single microflow",
            "CX2": "Too complex microflow",
            "CX3": "Too complex expression in Create/ Change Object",
            "CX4": "Too complex expression in Create / Change Variable"
        }
    }

    collect = function (model, branch, workingCopy, microflowname) {
        this.model = model;
        this.branch = branch;
        this.workingCopy = workingCopy;
        this.filterMarketplace();
        if (!this.model || !microflowname) {
            return
        }
        if (this.hierarchy[microflowname]) {
            return;
        }
        this.microflows = this.findAllMicroflows();
        var promises = [];
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
                    });
                } else { resolve() };
            }))
        });
        return Promise.all(promises).then(() => {
            resolve()
        });
    }

    parseMicroflow = function (mf, parentMF) {
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            if (json['$Type']==='Microflows$Annotation'){
                //console.log(json['caption']);
                //Could store annotations on the microflow hierarchy, to check whether error codes have been handled.
            }
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                let action_type = 'LoopAction';
                this.updateHierarchy(parentMF || mf, action_type, parentMF);
                this.parseMicroflow(obj, parentMF || mf);
            }            
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                let subMF = null;
                if (action_type === 'Microflows$MicroflowCallAction') {
                    subMF = json['action']['microflowCall']['microflow'];
                } else if (action_type === 'Microflows$CreateVariableAction') {
                    action_type += '_' + this.checkExpressionComplexity(json['action']['initialValue']);
                } else if (action_type === 'Microflows$ChangeVariableAction') {
                    action_type += '_' + this.checkExpressionComplexity(json['action'][['value']]);
                } else if (action_type === 'Microflows$CreateObjectAction' || action_type === 'Microflows$ChangeObjectAction') {
                    let maxCount = 0;
                    json['action']['items'].forEach((item) => {
                        let count = this.checkExpressionComplexity(item['value']);
                        if (count > maxCount) { maxCount = count };
                    })
                    action_type += '_' + maxCount;
                }
                this.updateHierarchy(mf, action_type, parentMF, subMF);
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let action_type = 'StartEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let action_type = 'EndEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$ExclusiveSplit') {
                let action_type = 'ExclusiveSplit';
                let condition = json.splitCondition.expression ? json.splitCondition.expression : '';
                action_type += '_' + this.checkExpressionComplexity(condition);
                this.updateHierarchy(mf, action_type, parentMF);
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

    updateHierarchy = function (microflow, action, parentMicroflow, subMF) {
        let microflowName = '';
        let actions; let subMFs;
        if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) {
            microflowName = parentMicroflow.qualifiedName
        } else { microflowName = microflow.qualifiedName };
        let microflowData = this.hierarchy[microflowName];
        if (microflowData) {
            actions = microflowData.actions;
            subMFs = microflowData.subMFs;
        } else {
            if (!this.hierarchy[microflowName]) {
                let mfToAdd = microflow;
                if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) {
                    mfToAdd = parentMicroflow;
                }
                this.hierarchy[microflowName] = { mf: mfToAdd };
            }
        }
        if (actions) {
            actions.push(action);
        } else {
            this.hierarchy[microflowName].actions = [action];
        }
        if (subMF && subMFs) {
            subMFs.push(subMF);
        } else {
            if (subMF) {
                this.hierarchy[microflowName].subMFs = [subMF];
            }
        }
    }

    analyse = function () {
        console.log("ANALYSE==============================");
        //console.log(JSON.stringify(this.hierarchy, null, 2));
        let dms = this.model.allDomainModels();
        let dmPromises = [];

        dms.forEach((dm) => {
            let dmPromise = dm.load();
            dmPromises.push(dmPromise);
        })
        return Promise.all(dmPromises).then((domainModels) => {
            domainModels.forEach(domainModel => {
                this.entities.push(...domainModel.entities);
            })
            Object.keys(this.hierarchy).forEach((microflow) => {
                if (microflow && microflow != 'undefined') {
                    this.executeCheck(this.namingConvention.bind(this), microflow);
                    this.executeCheck(this.illegalShowPage.bind(this), microflow);
                    this.executeCheck(this.illegalCommit.bind(this), microflow);
                    this.executeCheck(this.missingPermissions.bind(this), microflow);
                    this.executeCheck(this.errorHandling.bind(this), microflow);
                    this.executeCheck(this.tooComplexMicroflow.bind(this), microflow);
                }
            })
            resolve();
        })
    }
    executeCheck = function (validation, microflow) {
        let errors = validation(microflow);
        if (errors && errors.length > 0) {
            let mf = this.hierarchy[microflow];
            this.reports.push({ microflow: mf.mf, errors: errors });
        }

    }

    report = function (fName) {
        let reports = this.reports;
        if (fName) {
            try {
                fs.writeFileSync(fName + '_analysis.csv', '');
            } catch (err) {
                console.error(err);
            }
        }
        reports.forEach(item => {
            let theMicroflow = item.microflow;
            item.errors.forEach((err) => {
                if (fName) {
                    try {
                        fs.appendFileSync(fName + '_analysis.csv', theMicroflow.qualifiedName + ';' + err + ';' + this.errorCodes[err]+'\n');
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    console.log(theMicroflow.qualifiedName + ';' + err + ';' + this.errorCodes[err]);
                }
            })
        })

    }

    namingConvention = function (microflow) {
        // NC1: format: [PRE]_[Entity(s)]_description
        // NC2: Prefix must be allowed
        // NC3: entity must exist 
        // NC4: entity must exist in same module
        let allowedPrefixes = ['ACT', 'SUB', 'CRS', 'SCH', 'OCH', 'DS', 'VAL', 'RET', 'CTL', 'TRN', 'OPR', 'FNC'];
        let [moduleName, microflowName] = microflow.split('.');
        let mfNameParts = microflowName.split('_');
        let errors = [];
        if (mfNameParts.length < 3) {
            errors.push("NC1");
        } else {
            let mfPrefix = mfNameParts[0];
            let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
            if (!pfFound) { errors.push("NC2"); }
            let mfEntityName = mfNameParts[1];
            let mfDescription = mfNameParts[2];
            let entityForMF = this.entities.find((entity) => {
                let entityModule = this.getModuleName(entity);
                let entityName = this.getDocumentName(entity);
                return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
            })
            if (entityForMF) {
                let entityModule = this.getModuleName(entityForMF);
                let entityName = this.getDocumentName(entityForMF);
                if (entityModule != moduleName) {
                    errors.push("NC4");
                }

            } else {
                errors.push("NC3");
            }
        }
        return errors;
    }

    illegalShowPage = function (microflow) {
        // IP1: Show Page action outside of ACT
        // IP2: Close Page action outside of ACT
        let allowedPrefixes = ['ACT'];
        let errors = [];
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

        if (!mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (!allowedPrefixes.includes(mfPrefix)) {
                let mfActions = this.hierarchy[microflow].actions;
                let showPage = mfActions.find((action) => {
                    return action == 'Microflows$ShowPageAction'
                })
                if (showPage) {
                    errors.push("IP1");
                }
                let closePage = mfActions.find((action) => {
                    return (action == 'Microflows$CloseFormAction')
                })
                if (closePage) {
                    errors.push("IP2");
                }
            }

        }
        return errors;
    }

    illegalCommit = function (microflow) {
        //CM1: Commit not on correct hierarchy level (ACT or one level down)
        let allowedPrefixes = ['ACT'];
        let errors = [];
        let mfActions = this.hierarchy[microflow].actions;
        let commit = mfActions.find((action) => {
            return action == 'Microflows$CommitAction'
        })
        if (commit) {
            let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

            if (!allowedPrefixes.includes(mfPrefix)) {  //if commit not in ACT: is must be in SUB that is called from ACT only
                let allMFs = Object.keys(this.hierarchy);
                let subMFName = allMFs.find((mfName) => {
                    let mfData = this.hierarchy[mfName];
                    let subMFs = mfData.subMFs;
                    if (subMFs) {
                        let callingMF = subMFs.find((subMF) => {
                            return subMF === microflow
                        }
                        );
                        return callingMF != null;
                    } else return false;
                })
                if (subMFName) {
                    let [subModule, subMF, subMFPrefix] = this.nameParts(subMFName);
                    if (subMFPrefix !== 'ACT') {
                        //console.log(`${microflow} called from ${subMFName}`);
                        errors.push("CM1");
                    }
                }
            }
        }
        return errors;
    }


    missingPermissions = function (microflow) {
        // PM1: Microflow of this type should contain permissions
        let permissionPrefixes = ['ACT', 'OCH', 'OEN', 'OLE', 'DS'];
        let errors = [];
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

        if (!mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (permissionPrefixes.includes(mfPrefix)) {
                let mfAllowedRoles = this.hierarchy[microflow].mf.allowedModuleRoles;
                if (!mfAllowedRoles || mfAllowedRoles.length < 1) {
                    errors.push("PM1");
                }
            }

        }
        return errors;
    }

    errorHandling = function (microflow) {
        // EH1: Java Action without custom error handling
        let errors = [];
        let mfActions = this.hierarchy[microflow].actions;
        let java = mfActions.find((action) => {
            return action == 'Microflows$JavaActionCallAction'
        })
        if (java) {
            let mf = this.hierarchy[microflow].mf;
            let mfObjects = mf.objectCollection.objects;
            mfObjects.forEach((mfObject) => {
                if (mfObject.structureTypeName === 'Microflows$ActionActivity') {
                    let json = mfObject.toJSON();
                    if (json.action.$Type === 'Microflows$JavaActionCallAction') {
                        let errorHandling = json.action.errorHandlingType;
                        if (!(errorHandling.startsWith('Custom'))) {
                            errors.push("EH1");
                        }

                    }
                }
            })
        }
        return errors;
    }

    tooComplexMicroflow = function (microflow) {
        // CX1: Too many actions in a single microflow
        // CX2: Too complex microflow
        // CX3: Too complex expression in Create/Change Object
        // CX4: Too complex expression in Create/Change Variable
        let errors = [];
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);
        let mfActions = this.hierarchy[microflow].actions;
        if (mfActions.length > this.cxMaxActions) {
            errors.push("CX1");
        }
        let complexity = 0;
        mfActions.forEach((mfAction) => {
            if (mfAction === 'LoopAction') {
                complexity += this.cxLoopCount;
            } else if (mfAction.startsWith('ExclusiveSplit')) {
                complexity += this.cxExclusiveSplit;
            } else if (mfAction.startsWith('Microflows$CreateObjectAction') || mfAction.startsWith('Microflows$ChangeObjectAction')) {
                complexity += this.cxObjectAction;
                let parts = mfAction.split('_');
                let expressionCX = parts[1];
                if (expressionCX > this.cxMaxObjectExpression) {
                    errors.push("CX3");
                }
            } else if (mfAction.startsWith('Microflows$CreateVariableAction') || mfAction.startsWith('Microflows$ChangeVariableAction')) {
                complexity += this.cxVariableAction;
                let parts = mfAction.split('_');
                let expressionCX = parts[1];
                if (expressionCX > this.cxMaxVariableExpression) {
                    errors.push("CX4");
                }
            } else {
                complexity++
            }
        }
        )
        if (complexity > this.cxMaxComplexity) {
            errors.push("CX2");
        }

        return errors;
    }
}