exports.check = function (microflow) {
    // EH1: Java Action without custom error handling
    let errors = [];
    let mfActions = this.hierarchy[microflow].actions;
    let java = mfActions.find((action) => {
        return action.type == 'Microflows$JavaActionCallAction'
    })
    if (java) {
        let mf = this.hierarchy[microflow].mf;
        let mfObjects = mf.objectCollection.objects;
        mfObjects.forEach((mfObject) => {
            if (mfObject.structureTypeName === 'Microflows$ActionActivity') {
                let json = mfObject.toJSON();
                if (json.action.$Type === 'Microflows$JavaActionCallAction') {
                    let errorHandling = json.action.errorHandlingType;
                    if (!(errorHandling.startsWith('Custom'))) {
                        errors.push("EH1");
                    }
                }
            }
        })
    }
    return errors;
}


exports.registerCodes = function(){
    return {
        "EH1": "Java Action without custom error handling"
    }
}