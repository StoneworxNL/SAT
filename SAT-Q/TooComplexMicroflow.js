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

    check = function (model, microflow) {
        let allowedJava = this.options.allowedJava;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);  
        let mfActions = microflow.actions.filter(action => action.type !== 'Microflows$LogMessageAction'); // Logs are not counted in the complexity

        let exceptions = this.options.prefixExceptions;
        let isException = false;
        if (exceptions) {
            isException = (exceptions.find((exception) => exception === this.mfPrefix))
        }
        if (!isException && mfActions.length > this.options.maxActions) {
            this.addErrors("CX1", ignoreRuleAnnotations, `Action count: ${mfActions.length}`);
        } else if (isException && mfActions.length > this.options.exceptionsMaxActions) {
            this.addErrors("CX1", ignoreRuleAnnotations, `Action count: ${mfActions.length}`);
        }
        let complexity = 0;
        mfActions.forEach((mfAction) => {
            if (mfAction.type === 'LoopAction') {
                complexity += this.options.cxLoopCount;
            } else if (mfAction.type.startsWith('Microflows$ExclusiveSplit')) {
                complexity += this.options.cxExclusiveSplit;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxVariableExpression) { //reuse setting here a little bit
                    this.addErrors("CX5", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }

            } else if (mfAction.type.startsWith('Microflows$CreateChangeAction') || mfAction.type.startsWith('Microflows$ChangeAction')) {
                complexity += this.options.cxObjectAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxObjectExpression) {
                    this.addErrors("CX3", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }
            } else if (mfAction.type.startsWith('Microflows$CreateVariableAction') || mfAction.type.startsWith('Microflows$ChangeVariableAction')) {
                complexity += this.options.cxVariableAction;
                let expressionCX = mfAction.complexity;
                if (expressionCX > this.options.cxMaxVariableExpression) {
                    this.addErrors("CX4", ignoreRuleAnnotations, `Complexity score: ${expressionCX}`);
                }
            } else if (mfAction.type.startsWith('Microflows$LogMessageAction')) {
                // do nothing, this adds no complexity
            } else {
                complexity++
            }
        }
        )
        if (!isException && complexity > this.options.maxComplexity) {
            this.addErrors("CX2", ignoreRuleAnnotations, `Complexity score: ${complexity}`);
        } else if (isException && complexity > this.options.exceptionsMaxComplexity) {
            this.addErrors("CX2", ignoreRuleAnnotations, `Complexity score: ${complexity}`);
        }
        return this.errors;
    }
    
}

