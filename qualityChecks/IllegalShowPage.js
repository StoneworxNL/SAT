
const CheckModule = require("./CheckModule");

module.exports = class IllegalShowPage extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "IP1": "Show Page action outside of ACT",
            "IP2": "Close Page action outside of ACT"
        };
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        let errors = [];
        this.parseMFName(microflow);
        if (!this.mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (!allowedPrefixes.includes(this.mfPrefix)) {
                let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
                let mfActions = mfQuality.hierarchy[microflow].actions;
                let showPage = mfActions.find((action) => {
                    return action.type == 'Microflows$ShowPageAction'
                })
                if (showPage) {
                    this.addErrors(errors, "IP1", ignoreRuleAnnotations);
                }
                let closePage = mfActions.find((action) => {
                    return (action.type == 'Microflows$CloseFormAction')
                })
                if (closePage) {
                    this.addErrors(errors, "IP2", ignoreRuleAnnotations);
                }
            }

        }
        return errors;
    }
}

