const CheckModule = require("./CheckModule");

module.exports = class RestCall extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "RC1": "Rest calls only allowed within a CRS Microflow"
        };
    }


    check = function (model, microflow) {        
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);
        let mfActions = microflow.actions;
        let restAction = mfActions.find(mfAction => mfAction.type === 'Microflows$RestCallAction')
        if (restAction && this.mfPrefix != 'CRS'){
            this.addErrors("RC1", ignoreRuleAnnotations);
        }

        return this.errors;
    }

}

