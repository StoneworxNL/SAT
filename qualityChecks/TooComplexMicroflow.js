exports.check = function (microflow) {
    // CX1: Too many actions in a single microflow
    // CX2: Too complex microflow
    // CX3: Too complex expression in Create/Change Object
    // CX4: Too complex expression in Create/Change Variable
    let errors = [];
    let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);
    let mfActions = this.hierarchy[microflow].actions;
    if (mfActions.length > this.cxMaxActions) {
        errors.push("CX1");
    }
    let complexity = 0;
    mfActions.forEach((mfAction) => {
        if (mfAction.type === 'LoopAction') {
            complexity += this.cxLoopCount;
        } else if (mfAction.type.startsWith('ExclusiveSplit')) {
            complexity += this.cxExclusiveSplit;
        } else if (mfAction.type.startsWith('Microflows$CreateObjectAction') || mfAction.type.startsWith('Microflows$ChangeObjectAction')) {
            complexity += this.cxObjectAction;
            let expressionCX = mfAction.complexity;
            if (expressionCX > this.cxMaxObjectExpression) {
                errors.push("CX3");
            }
        } else if (mfAction.type.startsWith('Microflows$CreateVariableAction') || mfAction.type.startsWith('Microflows$ChangeVariableAction')) {
            complexity += this.cxVariableAction;
            let expressionCX = mfAction.complexity;
            if (expressionCX > this.cxMaxVariableExpression) {
                errors.push("CX4");
            }
        } else {
            complexity++
        }
    }
    )
    if (complexity > this.cxMaxComplexity) {
        errors.push("CX2");
    }
    return errors;
}

exports.registerCodes = function () {
    return {
        "CX1": "Too many actions in a single microflow",
        "CX2": "Too complex microflow",
        "CX3": "Too complex expression in Create/ Change Object",
        "CX4": "Too complex expression in Create / Change Variable"
    }
}