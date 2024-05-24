exports.check = function (microflow) {
    // IP1: Show Page action outside of ACT
    // IP2: Close Page action outside of ACT
    let allowedPrefixes = ['ACT'];
    let errors = [];
    let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

    if (!mfPrefix) { //No Prefix, should be reported in naming conventions
    } else {
        if (!allowedPrefixes.includes(mfPrefix)) {
            let mfActions = this.hierarchy[microflow].actions;
            let showPage = mfActions.find((action) => {
                return action.type == 'Microflows$ShowPageAction'
            })
            if (showPage) {
                errors.push("IP1");
            }
            let closePage = mfActions.find((action) => {
                return (action.type == 'Microflows$CloseFormAction')
            })
            if (closePage) {
                errors.push("IP2");
            }
        }

    }
    return errors;
}


exports.registerCodes = function(){
    return {
        "IP1": "Show Page action outside of ACT",
        "IP2": "Close Page action outside of ACT"        
    }
}