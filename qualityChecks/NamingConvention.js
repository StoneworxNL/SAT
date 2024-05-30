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
        let errors = [];
        if (mfNameParts.length < 3) {
            errors.push("NC1");
        } else {
            let mfPrefix = this.mfPrefix;
            let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
            if (!pfFound) { errors.push("NC2"); }
            let mfEntityName = mfNameParts[1];
            let entityForMF = mfQuality.entities.find((entity) => {
                let entityName = mfQuality.getDocumentName(entity);
                return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
            })
            if (entityForMF) {
                let entityModule = mfQuality.getModuleName(entityForMF);
                if (entityModule != this.moduleName) {
                    errors.push("NC4");
                }

            } else {
                errors.push("NC3");
            }
        }
        return errors;
    }
    
}