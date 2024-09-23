const CheckModule = require("./CheckModule");

module.exports = class NamingConvention extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "NC1": "format: [PRE]_[Entity(s)]_description",
            "NC2": "Prefix must be allowed",
            "NC3": "Entity must exist ",
            "NC4": "Entity must exist in same module"
        };
    }

    check = function (model, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        let exceptionPrefixes = this.options.exceptionPrefixes;
        this.parseMFName(microflow.name);
        let module = model.getModule(microflow.moduleID);
        this.moduleName = module.name;
        let errors = [];
        if (!module.fromAppStore){
            let mfNameParts = this.microflowName.split('_');
            let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
            let mfPrefix = this.mfPrefix;
            let isExceptionPrefix = exceptionPrefixes.find((prefix) => prefix == mfPrefix);
            if (!isExceptionPrefix) {
                if ((mfPrefix === 'VAL' &&  mfNameParts.length < 2) || mfNameParts.length < 3) {
                    this.addErrors(errors, "NC1", ignoreRuleAnnotations);
                } else {
                    
                    let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
                    if (!pfFound) {
                        this.addErrors(errors, "NC2", ignoreRuleAnnotations);
                    }
                    let mfEntityName = mfNameParts[1];
                    let entitiesForMF = model.entities.filter((entity) => {
                        let entityName = entity.name;
                        return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
                    })
                    if (entitiesForMF && entitiesForMF.length > 0) { //one or more entities with same name found
                        let entityForMFInModule = entitiesForMF.find((entity) => {
                            return module.id === entity.moduleID;
                        })
                        if (!entityForMFInModule || entityForMFInModule.length == 0) {
                            this.addErrors(errors, "NC4", ignoreRuleAnnotations);
                        }
                    } else {
                        this.addErrors(errors, "NC3", ignoreRuleAnnotations);
                    }
                }
            } 
        }
        return errors;
    }

}