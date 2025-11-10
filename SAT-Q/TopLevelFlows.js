const CheckModule = require("./CheckModule");
const Microflow = require("../MxModel/Microflow");

module.exports = class TopLevelFlows extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "TL1": "Microflow may not call a Top level microflow",
            "TL2": "Microflow is not allowed as a Top level microflow"
        };
    }


    check = function (model, microflow) {
        this.setup(model, microflow);
        let topLevelPrefixes = this.options.TopLevelPrefixes;
        let exceptionPrefixes = this.options.exceptionPrefixes;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();
        let subMFs = microflow.subMicroflows;
        if (subMFs) {
            subMFs.forEach(subMF => {                
                let [moduleName, prefix, entity, action] = Microflow.parseQualifiedName(subMF);
                if (topLevelPrefixes.includes(prefix)) {
                    let isExceptionPrefix = exceptionPrefixes.find((exPrefix) => exPrefix == prefix);
                    if (!isExceptionPrefix) {
                        this.addErrors("TL1", ignoreRuleAnnotations, `ToplevelMF: ${subMF}`);
                    }
                }
            });
        }
        return this.errors;
    }
}