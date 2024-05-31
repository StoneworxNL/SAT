const CheckModule = require("./CheckModule");

module.exports = class TooComplexMicroflow extends CheckModule {
    constructor(options) {
        super(options);
        
        this.errorCodes = {
            "CX1": "Too many actions in a single microflow",
            "CX2": "Too complex microflow",
            "CX3": "Too complex expression in Create/ Change Object",
            "CX4": "Too complex expression in Create / Change Variable"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        if (mfActions.length > this.options.cxMaxActions) {
            this.addErrors(errors, "CX1", ignoreRuleAnnotations);
        }
        let complexity = 0;
        mfActions.forEach((mfAction) => {
            if (mfAction.type === 'LoopAction') {
                complexity += this.options.cxLoopCount;
            } else if (mfAction.type.startsWith('ExclusiveSplit')) {
                complexity += this.options.cxExclusiveSplit;
            } else if (mfAction.type.startsWith('Microflows$CreateObjectAction') || mfAction.type.startsWith('Microflows$ChangeObjectAction')) {
                complexity += this.options.cxObjectAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxObjectExpression) {
                    this.addErrors(errors, "CX3", ignoreRuleAnnotations);
                }
            } else if (mfAction.type.startsWith('Microflows$CreateVariableAction') || mfAction.type.startsWith('Microflows$ChangeVariableAction')) {
                complexity += this.options.cxVariableAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxVariableExpression) {
                    this.addErrors(errors, "CX4", ignoreRuleAnnotations);

                }
            } else {
                complexity++
            }
        }
        )
        if (complexity > this.options.cxMaxComplexity) {
            this.addErrors(errors, "CX2", ignoreRuleAnnotations);
        }
        return errors;
    }
    
}

