const fs = require("fs");
const AnalysisModule = require("./AnalysisModule");
const { resolve } = require("path");
const { domainmodels } = require("mendixmodelsdk");

module.exports = class AnalysisSequenceDiagram extends AnalysisModule {
    constructor(excludes, prefixes, outFileName) {
        super(excludes, prefixes, outFileName);
        this.microflows_by_name;
        this.entities = [];
    }

    analyse = function (model, microflowname) {
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
                    //console.log("GO Parse: " + microflowIF.qualifiedName);
                    microflowIF.load().then((microflow) => {
                        var nestedMicroflows = this.parseMicroflow(microflow);
                        resolve(nestedMicroflows);
                    });
                } else { resolve() };
            }))
        });
        return Promise.all(promises).then(() => {
            resolve()
        });
    }

    parseMicroflow = function (mf, parentMF) {
        var nestedMicroflows = [];
        let mfObjects = mf ? mf.objectCollection.objects : parentMF.objectCollection.objects;
        mfObjects.forEach((obj) => {
            let json = obj.toJSON();
            if (json['$Type'] === 'Microflows$LoopedActivity') {
                let nestedFromThis = this.parseMicroflow(obj, mf);
                nestedMicroflows.push(...nestedFromThis);
            }
            else if (json['$Type'] === 'Microflows$ActionActivity') {
                let action_type = json['action']['$Type'];
                this.updateHierarchy(mf.qualifiedName, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$StartEvent') {
                let action_type = 'StartEvent';
                this.updateHierarchy(mf.qualifiedName, action_type, parentMF);
            } else if (json['$Type'] === 'Microflows$EndEvent') {
                let action_type = 'EndEvent';
                this.updateHierarchy(mf.qualifiedName, action_type, parentMF);
            }
        });
        return nestedMicroflows;
    }

    updateHierarchy = function (caller, action, parent) {
        if (!caller && parent && parent.name) { caller = parent.qualifiedName };
        let actions = this.hierarchy[caller];
        let hit;
        if (actions) {
            actions.push(action);
        } else {
            this.hierarchy[caller] = [action];
        }
    }

    report = function () {
        console.log("REPORT==============================");
        //console.log(JSON.stringify(this.hierarchy, null, 2));
        let dms = this.model.allDomainModels();
        let dmPromises = [];

        dms.forEach((dm) => {
            let dmPromise = dm.load();
            dmPromises.push(dmPromise);
        })
        Promise.all(dmPromises).then((domainModels) => {
            domainModels.forEach(domainModel => {
                this.entities.push(...domainModel.entities);
            })
            Object.keys(this.hierarchy).forEach((microflow) => {
                if (microflow && microflow != 'undefined') {
                    this.namingConvention(microflow);
                    this.illegalShowPage(microflow);        
                }
            })
        })
    }

    namingConvention = function (microflow) {
        // NC1: format: [PRE]_[Entity(s)]_description
        // NC2: Prefix must be allowed
        // NC3: entity must exist 
        // NC4: entity must exist in same module
        let allowedPrefixes = ['ACT', 'SUB', 'CRS', 'SCH', 'RET', 'CTL', 'TRN', 'OPR', 'VAL', 'FNC'];
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
        if (errors.length > 0) {
            console.log(microflow + ": " + errors);
        }
    }

    illegalShowPage = function (microflow) {
        // IP1: Show Page action outside of ACT
        // IP2: Close Page action outside of ACT
        let allowedPrefixes = ['ACT'];
        let [moduleName, microflowName] = microflow.split('.');
        let mfNameParts = microflowName.split('_');
        let errors = [];

        if (mfNameParts.length < 2) { //No Prefix, should be reported in naming conventions
        } else {
            let mfPrefix = mfNameParts[0];
            if (mfPrefix != 'ACT') {
                let mfActions = this.hierarchy[microflow];
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
        if (errors.length > 0) {
            console.log(microflow + ": " + errors);
        }
    }
}