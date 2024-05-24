const fs = require("fs");
const config = require("config");
const AnalysisModule = require("./AnalysisModule");
const { resolve } = require("path");
const { microflows, Annotation, JavaScriptSerializer, xmlschemas } = require("mendixmodelsdk");
var wc = require('../mxworkingcopy');
const exp = require("constants");

module.exports = class MicroflowQuality extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
        this.entities = [];
        this.rules = [];
        this.cxMaxActions = 25;
        this.cxMaxComplexity = 30;
        this.cxLoopCount = 4;
        this.cxExclusiveSplit = 5;
        this.cxObjectAction = 2;
        this.cxVariableAction = 1;
        this.cxMaxObjectExpression = 3;
        this.cxMaxVariableExpression = 5;

        this.errorCodes = {}

        const checks = config.get("checks");
        let checksFolder = config.get("checksFolder");
        this.checkFunctions = [];
        checks.forEach((check)=> {
            console.log("CHECK TO DO: "+check.fnc);
            let moduleName = checksFolder+check.fnc;
            let fnc = require(moduleName);
            Object.assign(this.errorCodes, fnc.registerCodes());
            this.checkFunctions.push(fnc);
        });

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
        // this.rules = this.findAllRules();
        // this.rules.forEach((ruleIF) => {            
        //     promises.push(new Promise((resolve, reject) => {
        //         let moduleName = this.getModuleName(ruleIF);
        //         let excludeThis = false;
        //         if (this.excludes) {
        //             excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
        //         }
        //         if (!excludeThis) {
        //             ruleIF.load().then((rule) => {
        //                // RULES PARSING MOET IETS ANDERS DAN MF's => json[$Type] is direct Exclusive split
        //                 this.parseMicroflow(rule);
        //                 resolve();
        //             });
        //         } else { resolve() };
        //     }))
        // });
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
                this.updateHierarchy(mf, action_type, parentMF, subMF, {'complexity': complexity});
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
                this.updateHierarchy(mf, action_type, parentMF, null, {'caption': json['caption'], 'complexity': complexity});
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
        let actions; let subMFs;
        if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) { //working on top level or nested (looped) MF?
            microflowName = parentMicroflow.qualifiedName
        } else { microflowName = microflow.qualifiedName };
        let microflowData = this.hierarchy[microflowName];              //fetch existing info
        if (microflowData) {                                            //update
            actions = microflowData.actions;
            subMFs = microflowData.subMFs;
        } else {                                                        //or add new
            if (!this.hierarchy[microflowName]) {
                let mfToAdd = microflow;
                if (!(microflow && microflow.qualifiedName) && parentMicroflow && parentMicroflow.name) {
                    mfToAdd = parentMicroflow;
                }
                this.hierarchy[microflowName] = { mf: mfToAdd };
            }
        }
        let actionInfo = {'type': action};
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

    analyse = function () {
        console.log("===================================ANALYSE ==============================\n");
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
                    this.checkFunctions.forEach((fnc)=>{
                        this.executeCheck(fnc.check.bind(this), microflow);
                    })
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
                fs.writeFileSync(fName + '_analysis.csv', 'Microflow;Code;Description\n');
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
   
}