const CheckModule = require("./CheckModule");

module.exports = class MissinCaptions extends CheckModule {    
    constructor(options) {
        super(options);

        this.errorCodes = {
            "MC1": "Missing caption for Exclusive split"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);
        let mfActions = mfQuality.hierarchy[microflow].actions;

        mfActions.forEach((mfAction) => {
            if (mfAction.type.startsWith('ExclusiveSplit')) {
                let caption = mfAction.caption.trim();
                if (!caption || caption.length == 0) {
                    errors.push("MC1");
                }
            }
        })
        return errors;
    }

}

