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

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        let exceptionPrefixes = this.options.exceptionPrefixes;
        this.parseMFName(microflow);
        let mfNameParts = this.microflowName.split('_');
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        let errors = [];
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
                let entityForMF = mfQuality.domains.find((entity) => {
                    let entityName = entity.name;
                    return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
                })
                if (entityForMF) {
                    let entityModule = entityForMF.module;
                    if (entityModule != this.moduleName) {
                        this.addErrors(errors, "NC4", ignoreRuleAnnotations);
                    }

                } else {
                    this.addErrors(errors, "NC3", ignoreRuleAnnotations);
                }
            }
        } 
        return errors;
    }

}