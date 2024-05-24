exports.check = function (microflow) {
    //CM1: Commit not on correct hierarchy level (ACT or one level down)
    let allowedPrefixes = ['ACT', 'QUE', 'QUEUE'];
    let errors = [];
    let mfActions = this.hierarchy[microflow].actions;
    let commit = mfActions.find((action) => {
        return action.type == 'Microflows$CommitAction'
    })
    if (commit) {
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

        if (!allowedPrefixes.includes(mfPrefix)) {  //if commit not in ACT: is must be in SUB that is called from ACT only
            let allMFs = Object.keys(this.hierarchy);
            let subMFName = allMFs.find((mfName) => {
                let mfData = this.hierarchy[mfName];
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
                let [subModule, subMF, subMFPrefix] = this.nameParts(subMFName);
                if (subMFPrefix !== 'ACT') {
                    //console.log(`${microflow} called from ${subMFName}`);
                    errors.push("CM1");
                }
            }
        }
    }
    return errors;
}


exports.registerCodes = function(){
    return {
        "CM1": "Commit not on correct hierarchy level(ACT or one level down)"
    }
}