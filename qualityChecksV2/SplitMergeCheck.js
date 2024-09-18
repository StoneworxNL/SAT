const CheckModule = require("./CheckModule");

module.exports = class SplitMergeCheck extends CheckModule {    
    constructor(options) {
        super(options);

        this.errorCodes = {
            "SM1": "Missing caption for Exclusive split"
            ,"SM2": "Useless merge action"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        mfActions.forEach((mfAction) => {
            if (mfAction.type.startsWith('ExclusiveSplit')) {
                let caption = mfAction.caption.trim();
                if (!caption || caption.length == 0) {
                    this.addErrors(errors, "SM1", ignoreRuleAnnotations);
                }
            } else if (mfAction.type.startsWith('ExclusiveMerge')) {
                let flows = mfQuality.hierarchy[microflow].mf.flows;
                let actionsToMerge = flows.filter((flow) => flow.destination.id === mfAction.id);
                if (actionsToMerge.length <= 1) {
                    this.addErrors(errors, "SM2", ignoreRuleAnnotations);
                }
            }
        })
        return errors;
    }

}

