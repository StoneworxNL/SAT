const CheckModule = require("./CheckModule");

module.exports = class SplitMergeCheck extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "SM1": "Missing caption for Exclusive split",
            "SM2": "Useless merge action",
            "SM3": "Exclusive split that checks on enums should not",
        };
    }


    check = function (model, microflow) {        
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);
        let mfActions = microflow.actions;
        mfActions.forEach((mfAction) => {
            if (mfAction.type.startsWith('Microflows$ExclusiveSplit')) {
                let caption = mfAction.caption;
                if (caption) { caption = caption.trim(); }
                if (!caption || caption.length == 0) {
                    this.addErrors("SM1", ignoreRuleAnnotations);
                }
            } else if (mfAction.type.startsWith('Microflows$ExclusiveMerge')) {
                //let mf = model.findMicroflowInContainer(microflow.containerID, microflow.name);
                let flows = microflow.flows;
                let actionsToMerge = flows.filter((flow) => flow.destination === mfAction.id);
                if (actionsToMerge.length <= 1) {
                    this.addErrors("SM2", ignoreRuleAnnotations);
                }
            }
        })
        return this.errors;
    }

}

