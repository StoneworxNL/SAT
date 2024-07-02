const CheckModule = require("./CheckModule");

module.exports = class DomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DM1": "Attribute name that starts with entity"
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
        })
        return errors;
    }
}