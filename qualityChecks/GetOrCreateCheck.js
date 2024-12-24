const { microflows } = require("mendixmodelsdk");
const CheckModule = require("./CheckModule");

module.exports = class GetOrCreateCheck extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "GC1": "Naming convention not as SUB_[ENTITYNAME]_GetOrCreate",
            "GC2": "Get or Create does not return a (list of) object(s)",
            "GC3": "Create or Change object with commit is not allowed in GetOrCreate",
            "GC4": "Change object not allowed for existing object"
        };
    }

    check = function (mfQuality, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        this.parseMFName(microflow);
        let errors = [];
        let microflowHierarchy = mfQuality.hierarchy[microflow];
        if (this.microflowName.includes('Get') && this.microflowName.includes('Or') && this.microflowName.includes('Create')){ //Check whether this is GetOrCreate in some form
            let mfNameParts = this.microflowName.split('_');
            let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
            let mfPrefix = this.mfPrefix;
            if (mfNameParts.length < 3){
                this.addErrors(errors, "GC1", ignoreRuleAnnotations);   // not according to naming conventions SUB_[Entity]_GetorCreate... 3 parts or more
            } else {
                let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
                let GC1Found = false;
                if (!pfFound) {
                    this.addErrors(errors, "GC1", ignoreRuleAnnotations); // not according to naming conventions: prefix SUB
                    GC1Found = true;
                }
                let goc = mfNameParts[2];
                if (!goc.match(/^GetOrCreate.*/) && !GC1Found){
                    this.addErrors(errors, "GC1", ignoreRuleAnnotations); // 3rd part = GetOrCreate
                    GC1Found = true;
                };
                let mfReturnType = microflowHierarchy.returnType;
                let mfReturnEntity =microflowHierarchy.returnEntity;
                if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType' ){ //Check if the microflow returntype is an object or list of objects
                    if (this.microflowName.includes(mfReturnEntity)){
                        //Oke
                    } else if (!GC1Found){
                        this.addErrors(errors, "GC1", ignoreRuleAnnotations); //Microflow name does not contain name of returned Entity 
                        GC1Found = true;
                    }
                } else {
                    this.addErrors(errors, "GC2", ignoreRuleAnnotations); //Microflow does not return object or list
                }
            }

        }        
        this.checkPattern(mfQuality, microflowHierarchy,errors);
        return errors;
    }
    
    checkPattern = function (mfQuality, microflowHierarchy, errors) {
        //console.log(JSON.stringify(microflowHierarchy.flows, null, 2));
        
    }
}
