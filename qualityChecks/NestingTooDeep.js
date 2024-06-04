const CheckModule = require("./CheckModule");

module.exports = class NestingTooDeep extends CheckModule {
    constructor(options) {
        super(options);        
        this.errorCodes = {
            "ND1": "Nesting of subs too deep"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.parseMFName(microflow);
        let maxNesting = this.options.mxNesting;
        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        let allMFs = Object.keys(mfQuality.hierarchy);
        let isSubMF = allMFs.find((mfToCheck) =>{
            let mfToCheckSubs = mfQuality.hierarchy[mfToCheck].subMFs;
            if (mfToCheckSubs && mfToCheckSubs.length > 0){
                if (mfToCheckSubs.includes(microflow)){
                    return true;
                }
                return false;
            }
            return false;
        })
        if (!isSubMF){
            this.maxLevel = 0;
            this.digDeep(mfQuality, microflow, 0, this.maxLevel);
            if (this.maxLevel > maxNesting) {
                this.addErrors(errors, "ND1", ignoreRuleAnnotations);
            }
        } 
        return errors;
    }

    digDeep = function(mfQuality, microflow, level){
        if (microflow && mfQuality.hierarchy[microflow] && mfQuality.hierarchy[microflow].subMFs){
            let subs = mfQuality.hierarchy[microflow].subMFs;          
            level++;
            if (level > this.maxLevel) {this.maxLevel = level}
            if (!subs || subs.length == 0){
                level--;
            } else {
                subs.forEach((subMF) => {
                    this.digDeep(mfQuality, subMF, level);                
                });
            }

        } else {
            level--;
        }
        return level;

    }
    
}

