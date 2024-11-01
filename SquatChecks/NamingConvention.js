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
        this.setup(model, microflow);        
        if (!this.module.fromAppStore){
            let mfNameParts = this.microflowName.split('_');
            let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();
            let mfPrefix = this.mfPrefix;
            let isExceptionPrefix = this.exceptionPrefixes.find((prefix) => prefix == mfPrefix);
            if (!isExceptionPrefix) {
                if ((mfPrefix === 'VAL' &&  mfNameParts.length < 2) || mfNameParts.length < 3) {
                    this.addErrors("NC1", ignoreRuleAnnotations);
                } else {
                    
                    let pfFound = this.allowedPrefixes.find((prefix) => prefix == mfPrefix);
                    if (!pfFound) {
                        this.addErrors("NC2", ignoreRuleAnnotations);
                    }
                    let mfEntityName = mfNameParts[1];
                    let entitiesForMF = model.entities.filter((entity) => {
                        let entityName = entity.name;
                        return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
                    })
                    if (entitiesForMF && entitiesForMF.length > 0) { //one or more entities with same name found
                        let entityForMFInModule = entitiesForMF.find((entity) => {
                            return this.module.id === entity.moduleID;
                        })
                        if (!entityForMFInModule || entityForMFInModule.length == 0) {
                            this.addErrors("NC4", ignoreRuleAnnotations);
                        }
                    } else {
                        this.addErrors("NC3", ignoreRuleAnnotations);
                    }
                }
            } 
        }
        return this.errors;
    }

}