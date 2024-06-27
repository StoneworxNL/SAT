const CheckModule = require("./CheckModule");

module.exports = class IllegalCommit extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "CM1": "Commit not on correct hierarchy level(ACT or one level down)",
            "CM2": "Commit not allowed in this type of microflow"
        };
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedTopLevelPrefixes;
        let allowedSubs = this.options.allowedSubLevelPrefixes;
        this.parseMFName(microflow);
        let errors = [];
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let commit = mfActions.find((action) => {
            return action.type == 'Microflows$CommitAction'
        })
        if (commit) {
            let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
            if (!allowedPrefixes.includes(this.mfPrefix)) {  //if commit not in ACT: is must be in SUB that is called from ACT only
                let allMFs = Object.keys(mfQuality.hierarchy);
                let subMFName = allMFs.find((mfName) => {
                    let mfData = mfQuality.hierarchy[mfName];
                    let subMFs = mfData.subMFs;
                    if (subMFs) {
                        let callingMF = subMFs.find((subMF) => {
                            return subMF === microflow
                        }
                        );
                        return callingMF != null;
                    } else return false;
                })
                if (subMFName) {
                    let [subModule, subMF, subMFPrefix] = mfQuality.nameParts(subMFName);
                    if (!allowedPrefixes.includes(subMFPrefix)) {
                        this.addErrors(errors, "CM1", ignoreRuleAnnotations);
                    }
                }
            }
            if (!(allowedPrefixes.includes(this.mfPrefix) || allowedSubs.includes(this.mfPrefix) )) { // Commits may only be found in top levels or allowed sub levels
                this.addErrors(errors, "CM2", ignoreRuleAnnotations);
            }
        }
        return errors;
    }
}
