const CheckModule = require("./CheckModule");

module.exports = class IllegalObjectActions extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "OA1": "Commit object not allowed in a microflow with this prefix",
            "OA2": "Create or Change object not allowed in a microflow with this prefix"
        };
    }

    check = function (model, microflow) {
        let prefixesNotAllowed = this.options.PrefixesNotAllowed;
        this.setup(model, microflow);
        if (!this.module.fromAppStore) {
            let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();
            let mfActions = microflow.actions;
            if (prefixesNotAllowed.includes(this.mfPrefix)) {
                let commit = mfActions.find((action) => {
                    return action.type == 'Microflows$CommitAction'
                })
                let createOrChange = mfActions.find((action) => {
                    return action.type == 'Microflows$CreateAction' || action.type == 'Microflows$ChangeAction' || action.type == 'Microflows$CreateChangeAction'
                })
                if (commit) {
                    this.addErrors("OA1", ignoreRuleAnnotations);
                } else if (createOrChange) {
                    this.addErrors("OA2", ignoreRuleAnnotations);
                }
            }
        }
        return this.errors;
    }
}
