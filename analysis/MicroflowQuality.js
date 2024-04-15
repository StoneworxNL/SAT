const fs = require("fs");
const AnalysisModule = require("./AnalysisModule");
const { resolve } = require("path");
const { microflows, Annotation, JavaScriptSerializer } = require("mendixmodelsdk");
var wc = require('../mxworkingcopy');

module.exports = class AnalysisSequenceDiagram extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
        this.entities = [];
    }

    collect = function (model, microflowname) {
        this.model = model;
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
        // if (mf.name == 'SUB_Test_illegal_close'){
        //     console.log("PARSING IT");
        //     console.log(JavaScriptSerializer.serializeToJs(mf));
        // }
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                this.parseMicroflow(obj, mf);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                let subMF = null;
                if (json['action']['$Type'] === 'Microflows$MicroflowCallAction') {
                    subMF = json['action']['microflowCall']['microflow'];
                }
                this.updateHierarchy(mf, action_type, parentMF, subMF);
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let action_type = 'StartEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let action_type = 'EndEvent';
                this.updateHierarchy(mf, action_type, parentMF);
            }
        });
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
            if (!this.hierarchy[microflowName]){
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
        console.log("REPORT==============================");
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
                    let reports = this.reports;
                    let errors = this.namingConvention(microflow);
                    if (errors && errors.length > 0) {
                        let mf = this.hierarchy[microflow];
                        reports.push({ microflow: mf.mf, errors: errors });
                    }
                    errors = this.illegalShowPage(microflow);
                    if (errors && errors.length > 0) {
                        let mf = this.hierarchy[microflow];
                        reports.push({ microflow: mf.mf, errors: errors });
                    }
                    errors = this.illegalCommit(microflow);
                    if (errors && errors.length > 0) {
                        let mf = this.hierarchy[microflow];
                        reports.push({ microflow: mf.mf, errors: errors });
                    }

                }
            })
            resolve();
        })
    }

    report = function () {
        let reports = this.reports;
        reports.forEach(item => {
            let theMicroflow = item.microflow;
            console.log(theMicroflow.qualifiedName + ' ' + item.errors);
            let annotation = microflows.Annotation.create(this.model);
            annotation.relativeMiddlePoint = { "x": 227, "y": 72 };
            annotation.size = { "width": 230, "height": 50 };
            annotation.caption = item.errors;
            let collection = microflows.MicroflowObjectCollection.create(this.model);
            collection.objects.push(annotation);
        })
        //console.log(JSON.stringify(this.hierarchy, null , 2));
        //        this.model.flushChanges();
        //       wc.commitWorkingCopy(this.appID, this.model);
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
            errors.push("NC1: Microflow name does not follow pattern [PRE]_[Entity]_description");
        } else {
            let mfPrefix = mfNameParts[0];
            let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
            if (!pfFound) { errors.push("NC2: Microflow prefix not allowed"); }
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
                    errors.push("NC4: MF not in correct module");
                }

            } else {
                errors.push("NC3: MF without existing entity name");
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
                    errors.push("IP1: Show Page action outside of ACT");
                }
                let closePage = mfActions.find((action) => {
                    return (action == 'Microflows$CloseFormAction')
                })
                if (closePage) {
                    errors.push("IP2: Close Page action outside of ACT");
                }
            }

        }
        return errors;
        // if (errors.length > 0) {
        //     console.log(microflow + ": " + errors.join(':'));
        // }
    }

    illegalCommit = function (microflow) {
        let mfActions = this.hierarchy[microflow].actions;
        let allowedPrefixes = ['ACT'];
        let errors = [];
        let commit = mfActions.find((action) => {
            return action == 'Microflows$CommitAction'
        })
        if (commit) {
            let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

            if (!allowedPrefixes.includes(mfPrefix)) {  //if commit not in ACT: is must be in SUB that is called from ACT only
                let allMFs = Object.keys(this.hierarchy);
                let subMFName = allMFs.find((mfName)=> {
                    let mfData = this.hierarchy[mfName];
                    let subMFs = mfData.subMFs;
                    if (subMFs){
                        let callingMF = subMFs.find((subMF) => {
                            return subMF === microflow}
                        );
                        return callingMF != null;
                    } else return false;
                })
                if (subMFName){
                    let [subModule, subMF, subMFPrefix] = this.nameParts(subMFName);
                    if (subMFPrefix !== 'ACT'){
                        //console.log(`${microflow} called from ${subMFName}`);
                        errors.push("CM1: Commit not on correct hierarchy level (ACT or one level down)");
                    }                   
                }
            }
        }
        return errors;
    }

    
}