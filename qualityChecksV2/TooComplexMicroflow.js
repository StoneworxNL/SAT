const CheckModule = require("./CheckModule");

module.exports = class TooComplexMicroflow extends CheckModule {
    constructor(options) {
        super(options);
        
        this.errorCodes = {
            "CX1": "Too many actions in a single microflow",
            "CX2": "Too complex microflow",
            "CX3": "Too complex expression in Create/ Change Object",
            "CX4": "Too complex expression in Create / Change Variable",
            "CX5": "Too complex expression in Exclusive Split",
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        let exceptions = this.options.prefixExceptions;
        let isException = false;
        if (exceptions) {
            isException = (exceptions.find((exception) => exception === this.mfPrefix))
        }
        if (!isException && mfActions.length > this.options.maxActions) {
            this.addErrors(errors, "CX1", ignoreRuleAnnotations, `Action count: ${mfActions.length}`);
        } else if (isException && mfActions.length > this.options.exceptionsMaxActions) {
            this.addErrors(errors, "CX1", ignoreRuleAnnotations, `Action count: ${mfActions.length}`);
        }
        let complexity = 0;
        mfActions.forEach((mfAction) => {
            if (mfAction.type === 'LoopAction') {
                complexity += this.options.cxLoopCount;
            } else if (mfAction.type.startsWith('ExclusiveSplit')) {
                complexity += this.options.cxExclusiveSplit;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxVariableExpression) { //reuse setting here a little bit
                    this.addErrors(errors, "CX5", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }

            } else if (mfAction.type.startsWith('Microflows$CreateObjectAction') || mfAction.type.startsWith('Microflows$ChangeObjectAction')) {
                complexity += this.options.cxObjectAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxObjectExpression) {
                    this.addErrors(errors, "CX3", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }
            } else if (mfAction.type.startsWith('Microflows$CreateVariableAction') || mfAction.type.startsWith('Microflows$ChangeVariableAction')) {
                complexity += this.options.cxVariableAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxVariableExpression) {
                    this.addErrors(errors, "CX4", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }
            } else {
                complexity++
            }
        }
        )
        if (!isException && complexity > this.options.maxComplexity) {
            this.addErrors(errors, "CX2", ignoreRuleAnnotations, `Complexity score: ${complexity}`);
        } else if (isException && complexity > this.options.exceptionsMaxComplexity) {
            this.addErrors(errors, "CX2", ignoreRuleAnnotations, `Complexity score: ${complexity}`);
        }
        return errors;
    }
    
}

