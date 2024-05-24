exports.check = function (microflow) {
    // NC1: format: [PRE]_[Entity(s)]_description
    // NC2: Prefix must be allowed
    // NC3: entity must exist 
    // NC4: entity must exist in same module
    let allowedPrefixes = ['ACT', 'SUB', 'CRS', 'SCH', 'OCH', 'DS', 'VAL', 'RET', 'CTL', 'TRN', 'OPR', 'FNC', 'ASU', 'SE', 'CWS', 'PWS', 'PRS', 'CWS', 'QUE', 'QUEUE', 'BCO', 'CAL'];
    let [moduleName, microflowName] = microflow.split('.');
    let mfNameParts = microflowName.split('_');
    let errors = [];    
    if (mfNameParts.length < 3) {
        errors.push("NC1");
    } else {
        let mfPrefix = mfNameParts[0];
        let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
        if (!pfFound) { errors.push("NC2"); }
        let mfEntityName = mfNameParts[1];
        let mfDescription = mfNameParts[2];
        let entityForMF = this.entities.find((entity) => {
            let entityModule = this.getModuleName(entity);
            let entityName = this.getDocumentName(entity);
            return (entityName == mfEntityName || entityName + 's' == mfEntityName || entityName + 'List' == mfEntityName);
        })
        if (entityForMF) {
            let entityModule = this.getModuleName(entityForMF);
            //let entityName = this.getDocumentName(entityForMF);
            if (entityModule != moduleName) {
                errors.push("NC4");
            }

        } else {
            errors.push("NC3");
        }
    }
    return errors;
}

exports.registerCodes = function(){
    return {
        "NC1": "format: [PRE]_[Entity(s)]_description",
        "NC2": "Prefix must be allowed",
        "NC3": "entity must exist ",
        "NC4": "entity must exist in same module"
    }
}