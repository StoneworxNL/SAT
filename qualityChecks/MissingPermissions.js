exports.check = function (microflow) {
        // PM1: Microflow of this type should contain permissions
        let permissionPrefixes = ['ACT', 'OCH', 'OEN', 'OLE', 'DS'];
        let errors = [];
        let [moduleName, microflowName, mfPrefix] = this.nameParts(microflow);

        if (!mfPrefix) { //No Prefix, should be reported in naming conventions
        } else {
            if (permissionPrefixes.includes(mfPrefix)) {
                let mfAllowedRoles = this.hierarchy[microflow].mf.allowedModuleRoles;
                if (!mfAllowedRoles || mfAllowedRoles.length < 1) {
                    errors.push("PM1");
                }
            }

        }
        return errors;
}


exports.registerCodes = function(){
    return {
        "PM1": "Microflow of this type should contain permissions"            
    }
}