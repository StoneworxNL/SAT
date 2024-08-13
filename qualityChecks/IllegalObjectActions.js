const CheckModule = require("./CheckModule");

module.exports = class IllegalObjectActions extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "OA1": "Commit object not allowed in a microflow with this prefix",
            "OA2": "Create or Change object not allowed in a microflow with this prefix"
        };
    }

    check = function (mfQuality, microflow) {
        let prefixesNotAllowed = this.options.PrefixesNotAllowed;
        this.parseMFName(microflow);
        let errors = [];
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        if (prefixesNotAllowed.includes(this.mfPrefix)) {
            let commit = mfActions.find((action) => {
                return action.type == 'Microflows$CommitAction'
            })
            let createOrChange = mfActions.find((action) => {
                return action.type == 'Microflows$CreateObjectAction' || action.type == 'Microflows$ChangeObjectAction'
            })
            if (commit) {
                this.addErrors(errors, "OA1", ignoreRuleAnnotations);
            } else if (createOrChange) {
                this.addErrors(errors, "OA2", ignoreRuleAnnotations);
            }
        }
        return errors;
    }
}
