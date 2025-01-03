
const CheckModule = require("./CheckModule");

module.exports = class IllegalShowPage extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "IP1": "Show Page action outside of ACT",
            "IP2": "Close Page action outside of ACT"
        };
    }

    check = function (model, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);  
        if (!this.mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (!allowedPrefixes.includes(this.mfPrefix)) {
                let mfActions = microflow.actions;
                let showPage = mfActions.find((action) => {
                    return action.type == 'Microflows$ShowFormAction' || action.type == 'Microflows$ShowHomePageAction'
                })
                if (showPage) {
                    this.addErrors("IP1", ignoreRuleAnnotations);
                }
                let closePage = mfActions.find((action) => {
                    return (action.type == 'Microflows$CloseFormAction')
                })
                if (closePage) {
                    this.addErrors("IP2", ignoreRuleAnnotations);
                }
            }

        }
        return this.errors;
    }
}

