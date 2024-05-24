exports.check = function (microflow) {
        // MC1: Missing caption for Exclusive split
        let errors = [];
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);
        let mfActions = this.hierarchy[microflow].actions;
       
        mfActions.forEach((mfAction) => {
             if (mfAction.type.startsWith('ExclusiveSplit')) {
                let caption = mfAction.caption.trim();
                if (!caption || caption.length == 0 ) {
                    errors.push("MC1");
                }
            } 
        })
        return errors;
}


exports.registerCodes = function(){
    return {
        "MC1": "Missing caption for Exclusive split"
    }
}