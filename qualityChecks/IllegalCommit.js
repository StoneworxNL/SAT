const CheckModule = require("./CheckModule");

module.exports = class IllegalCommit extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "CM1": "Commit not on correct hierarchy level(ACT or one level down)"
        };
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        this.parseMFName(microflow);
        let errors = [];
        let mfActions = mfQuality.hierarchy[microflow].actions;
        let commit = mfActions.find((action) => {
            return action.type == 'Microflows$CommitAction'
        })
        if (commit) {
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
                    if (subMFPrefix !== 'ACT') {
                        //console.log(`${microflow} called from ${subMFName}`);
                        errors.push("CM1");
                    }
                }
            }
        }
        return errors;
    }
}
