const CheckModule = require("./CheckModule");

module.exports = class TopLevelFlows extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "TL1": "Microflow may not call a Top level microflow"
        };
    }

    
    check = function (mfQuality, microflow) {
        this.parseMFName(microflow);
        let errors = [];
        let topLevelPrefixes = this.options.TopLevelPrefixes;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        let subMFs = mfQuality.hierarchy[microflow].subMFs;
        if (subMFs){
            subMFs.forEach(subMF => {
                let [moduleName, microflowName, mfPrefix] = mfQuality.nameParts(subMF);
                if (topLevelPrefixes.includes(mfPrefix) ) { 
                    this.addErrors(errors, "TL1", ignoreRuleAnnotations, `ToplevelMF: ${subMF}`);
                }
                
            });
        }
        return errors;
    }
}