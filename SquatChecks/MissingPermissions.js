const CheckModule = require("./CheckModule");

module.exports = class MissingPermissions extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "PM1": "Microflow of this type should contain permissions"
        };
    }

    check = function (model, microflow) {
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        let permissionPrefixes = this.options.permissionPrefixes;
        this.setup(model, microflow);
        if (!this.mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (permissionPrefixes.includes(this.mfPrefix)) {
                let mfAllowedRoles = microflow.roles;
                if (!mfAllowedRoles || mfAllowedRoles.length < 1) {
                    this.addErrors("PM1", ignoreRuleAnnotations);
                }
            }

        }
        return this.errors;
    }

}