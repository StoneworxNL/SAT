const CheckModule = require("./CheckModule");

module.exports = class MissingPermissions extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "PM1": "Microflow of this type should contain permissions"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);        
        let permissionPrefixes = this.options.permissionPrefixes;

        if (!this.mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (permissionPrefixes.includes(this.mfPrefix)) {
                let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
                let mfAllowedRoles = mfQuality.hierarchy[microflow].mf.allowedModuleRoles;
                if (!mfAllowedRoles || mfAllowedRoles.length < 1) {
                    this.addErrors(errors, "PM1", ignoreRuleAnnotations);
                }
            }

        }
        return errors;
    }

}