const CheckModule = require("./CheckModule");

module.exports = class DomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DM1": "Attribute name should not starts with the entity name",
            "DM2": "Attribute name should not contain underscores '_'"
        };
        this.level = 'domainmodel';
    }

    check = function (mfQuality, entity) {
        let errors = [];

        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(entity);
        entity.attrs.forEach(attr => {
            if (attr.startsWith(entity.name)) {
                this.addErrors(errors, "DM1", ignoreRuleAnnotations, `${entity.name}.${attr}`);
            }
            if (attr.includes('_')) {
                this.addErrors(errors, "DM2", ignoreRuleAnnotations, `${entity.name}.${attr}`);
            }
        })
        return errors;
    }
}