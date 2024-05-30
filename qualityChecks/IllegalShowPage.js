
const CheckModule = require("./CheckModule");

module.exports = class IllegalShowPage extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "IP1": "Show Page action outside of ACT",
            "IP2": "Close Page action outside of ACT"
        };
        console.log(options);
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        let errors = [];
        this.parseMFName(microflow);

        if (!this.mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (!allowedPrefixes.includes(this.mfPrefix)) {
                let mfActions = mfQuality.hierarchy[microflow].actions;
                let showPage = mfActions.find((action) => {
                    return action.type == 'Microflows$ShowPageAction'
                })
                if (showPage) {
                    errors.push("IP1");
                }
                let closePage = mfActions.find((action) => {
                    return (action.type == 'Microflows$CloseFormAction')
                })
                if (closePage) {
                    errors.push("IP2");
                }
            }

        }
        return errors;
    }


    getErrorCodes() {
        return this.errorCodes;
    }
}

