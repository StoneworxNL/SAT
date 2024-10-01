const CheckModule = require("./CheckModule");

module.exports = class IllegalCommit extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "CM1": "Commit not on correct hierarchy level(ACT or one level down)",
            "CM2": "Commit not allowed in this type of microflow",
            "CM3": "Create or Change object with commit  not on correct hierarchy level(ACT or one level down)"
        };
    }

    check = function (model, microflow) {
        let allowedPrefixes = this.options.allowedTopLevelPrefixes;
        let allowedSubs = this.options.allowedSubLevelPrefixes;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);  
        let mfActions = microflow.actions;
        let commit = mfActions.find((action) => {               // find all commit actions
            return action.type == 'Microflows$CommitAction'
        })
        let createOrChangeCommit = mfActions.find((action) => { //find all create/change actions with commit
            if (action.type == 'Microflows$CreateChangeAction' || action.type == 'Microflows$ChangeAction'){
                return action.isCommit;            
            } else return false;

        })
        if (commit || createOrChangeCommit) {            
            if (!allowedPrefixes.includes(this.mfPrefix)) {  //if commit not in ACT: is must be in SUB that is called from ACT only
                let subMicroflow = model.microflows.find((microflowToCheck)=>{
                    let subMFs = microflowToCheck.subMicroflows;
                    if (subMFs) {
                        let callingMF = subMFs.find((subMF) => {
                            return subMF === `${this.module.name}.${microflow.name}`
                        }
                        );
                        return callingMF != null;
                    } else return false;

                })                
                if (subMicroflow){
                    let mfNameParts = subMicroflow.name.split('_');
                    let subMFPrefix = mfNameParts[0];
                    if (!allowedPrefixes.includes(subMFPrefix)) {
                        if (commit) {
                            this.addErrors("CM1", ignoreRuleAnnotations);
                        } else if (createOrChangeCommit) {
                            this.addErrors("CM3", ignoreRuleAnnotations);
                        }
                    }
                }
            }
            if (!(allowedPrefixes.includes(this.mfPrefix) || allowedSubs.includes(this.mfPrefix) )) { // Commits may only be found in top levels or allowed sub levels
                this.addErrors("CM2", ignoreRuleAnnotations);
            }
        }
        return this.errors;
    }
}
