const CheckModule = require("./CheckModule");

module.exports = class NestingTooDeep extends CheckModule {
    constructor(options) {
        super(options);     
        this.mfList = [];   
        this.errorCodes = {
            "ND1": "Nesting of subs too deep"
            ,"ND2": "Recursion detected"
        };
    }

    check = function (mfQuality, microflow) {
        let errors = [];
        this.mfList = []; 
        this.isRecursionFound = false;
        this.recursiveMicroflow = '';
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
            this.digDeep(mfQuality, microflow, 0, maxNesting);
            if (this.maxLevel > maxNesting) {
                this.addErrors(errors, "ND1", ignoreRuleAnnotations);
            }
            if (this.isRecursionFound){
                let ignoreRuleAnnotationsRecursiveMF = mfQuality.getIgnoreRuleAnnotations(this.recursiveMicroflow);
                ignoreRuleAnnotations = ignoreRuleAnnotations.concat(ignoreRuleAnnotationsRecursiveMF);
                this.addErrors(errors, "ND2", ignoreRuleAnnotations, this.recursiveMicroflow);
            }
        } 
        return errors;
    }

    digDeep = function(mfQuality, microflow, level, maxNesting){
        if (microflow && mfQuality.hierarchy[microflow] && mfQuality.hierarchy[microflow].subMFs){
            let mfFound = this.mfList.find((mf)=>{
                return mf === microflow
            });
            if (mfFound && !this.isRecursionFound) {
                this.isRecursionFound = true;
                this.recursiveMicroflow = microflow;
            } else {
                this.mfList.push(microflow);
            }
            let subs = mfQuality.hierarchy[microflow].subMFs;  
            let uniqueSubs = subs.filter((sub, index) => {
                return subs.indexOf(sub) === index;                
            });
            level++;
            if (level > this.maxLevel) {this.maxLevel = level}
            if (level <= maxNesting) {
                if (!uniqueSubs || uniqueSubs.length == 0){
                    level--;
                    this.mfList.pop();
                } else {
                    uniqueSubs.forEach((subMF) => {
                        //console.log(`NESTING: ${microflow} ==> ${subMF}:  ${level} < ${maxNesting} `);
                        this.digDeep(mfQuality, subMF, level, maxNesting);                
                    });
                }
            }

        } else {
            level--;
            this.mfList.pop();
        }
    }
    

}

