const CheckModule = require("./CheckModule");

module.exports = class NestingTooDeep extends CheckModule {
    constructor(options) {
        super(options);
        this.mfList = [];
        this.errorCodes = {
            "ND1": "Nesting of subs to deep",
            "ND2": "Recursion detected"
        };
        this.originalMF='';
    }

    check = function (model, microflow) {      
        console.log("NESTING TOO DEEP:" +microflow.name);
        this.setup(model, microflow);
        this.originalMF = microflow.name;
        this.mfList = [];
        this.isRecursionFound = false;
        this.recursiveMicroflow = '';
        let maxNesting = this.options.mxNesting;          ////TESTING isSubMF gaat niet goed voor mf onder breakpoint
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();
        
        if (!this.module.fromAppStore) {
            
            let isSubMF = model.microflows.find((mfToCheck) => { // check to see if microflow is called from any other microflow (making it a sub)
                let mfToCheckSubs = mfToCheck.subMicroflows;
                if (mfToCheckSubs && mfToCheckSubs.length > 0) {
                    let qualifiedName = microflow.getQualifiedName(model);
                    if (mfToCheckSubs.includes(qualifiedName)) {
                        return true;
                    }
                    return false;
                }
                return false;
            })
            if (!isSubMF) {
                this.maxLevel = 0;
                this.digDeep(model, microflow, 0, maxNesting);
                if (this.maxLevel > maxNesting + 1 && !this.isRecursionFound) { // level is allways 1
                    this.addErrors("ND1", ignoreRuleAnnotations, this.maxLevel);
                }
                if (this.isRecursionFound) {
                    let ignoreRuleAnnotationsRecursiveMF = this.recursiveMicroflow.getIgnoreRuleAnnotations();
                    ignoreRuleAnnotations = ignoreRuleAnnotations.concat(ignoreRuleAnnotationsRecursiveMF);
                    this.addErrors("ND2", ignoreRuleAnnotations, this.recursiveMicroflow.name);
                }
            }
        }
        return this.errors;
    }

    digDeep = function (model, microflow, level, maxNesting) {
        if (microflow && microflow.subMicroflows) {
            let mfFound = this.mfList.find((mf) => {
                return (mf.name === microflow.name && mf.containerID === microflow.containerID)
            });
            if (mfFound && !this.isRecursionFound) {
                this.isRecursionFound = true;
                this.recursiveMicroflow = microflow;
            } else {
//                console.log("Pushing one: "+ microflow.name);
                this.mfList.push(microflow);
            }
            let subs = microflow.subMicroflows;
            let uniqueSubs = subs.filter((sub, index) => {
                return subs.indexOf(sub) === index;
            });
            level++;
            if (level > this.maxLevel) { this.maxLevel = level }
            if (level <= maxNesting + 1) {
                if (!uniqueSubs || uniqueSubs.length == 0) {
                    level--;
//                    console.log("Popping one of: " + microflow.name);                    
                    this.mfList.pop();
                } else {
                    uniqueSubs.forEach((subMF) => {
//                        console.log(`NESTING: ${microflow} ==> ${subMF}:  ${level} < ${maxNesting} `);
                        let [moduleName, microflowName] = subMF.split('.');
                        let subMicroflow = model.findMicroflow(moduleName, microflowName);                        
                        if (subMicroflow){
                            this.digDeep(model, subMicroflow, level, maxNesting);
                        } else {
                            level--;
//                            console.log("Popping one of: " + microflow.name);
                            this.mfList.pop();        
                        }
                    });
                    level--;
//                    console.log("Popping one of: " + microflow.name);
                    this.mfList.pop();
                }
            }

        } else {
            level--;
//            console.log("Popping one of" );
            this.mfList.pop();
        }
    }

}

