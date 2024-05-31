const CheckModule = require("./CheckModule");

module.exports = class NamingConvention extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "NC1": "format: [PRE]_[Entity(s)]_description",
            "NC2": "Prefix must be allowed",
            "NC3": "entity must exist ",
            "NC4": "entity must exist in same module"
        };
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        this.parseMFName(microflow);
        let mfNameParts = this.microflowName.split('_');
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        let errors = [];
        if (mfNameParts.length < 3) {
            this.addErrors(errors, "NC1", ignoreRuleAnnotations);
        } else {
            let mfPrefix = this.mfPrefix;
            let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
            if (!pfFound) {  
                this.addErrors(errors, "NC2", ignoreRuleAnnotations); 
            }
            let mfEntityName = mfNameParts[1];
            let entityForMF = mfQuality.entities.find((entity) => {
                let entityName = mfQuality.getDocumentName(entity);
                return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
            })
            if (entityForMF) {
                let entityModule = mfQuality.getModuleName(entityForMF);
                if (entityModule != this.moduleName) {
                    this.addErrors(errors, "NC4", ignoreRuleAnnotations);
                }

            } else {
                this.addErrors(errors, "NC3", ignoreRuleAnnotations);
            }
        }
        return errors;
    }

}