const { microflows } = require("mendixmodelsdk");
const CheckModule = require("./CheckModule");

module.exports = class IllegalCommit extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "GC1": "Naming convention not as SUB_[ENTITYNAME]_GetOrCreate",
            "GC2": "Get or Create does not return a (list of) object(s)",
            "GC3": "Create or Change object with commit is not allowed in GetOrCreate",
            "GC4": "Change object not allowed for existing object"
        };
    }

    check = function (model, microflow) {
        let allowedPrefixes = this.options.allowedPrefixes;
        this.setup(model, microflow);
        if (this.microflowName.includes('Get') && this.microflowName.includes('Or') && this.microflowName.includes('Create')){ //Check whether this is GetOrCreate in some form
            let mfNameParts = this.microflowName.split('_');
            let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
            let mfPrefix = this.mfPrefix;
            if (mfNameParts.length < 3){
                this.addErrors(errors, "GC1", ignoreRuleAnnotations);   // not according to naming conventions SUB_[Entity]_GetorCreate... 3 parts or more
            } else {
                let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
                let GC1Found = false;
                if (!pfFound) {
                    this.addErrors("GC1", ignoreRuleAnnotations); // not according to naming conventions: prefix SUB
                    GC1Found = true;
                }
                let goc = mfNameParts[2];
                if (!goc.match(/^GetOrCreate.*/) && !GC1Found){
                    this.addErrors("GC1", ignoreRuleAnnotations); // 3rd part = GetOrCreate
                    GC1Found = true;
                };
                let mfReturnType = microflow.returnType;
                let mfReturnEntity =microflow.returnEntity;
                if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType' ){ //Check if the microflow returntype is an object or list of objects
                    if (this.microflowName.includes(mfReturnEntity)){
                        //Oke
                    } else if (!GC1Found){
                        this.addErrors("GC1", ignoreRuleAnnotations); //Microflow name does not contain name of returned Entity 
                        GC1Found = true;
                    }
                } else {
                    this.addErrors("GC2", ignoreRuleAnnotations); //Microflow does not return object or list
                }
            }

            this.checkPattern(microflow, ignoreRuleAnnotations);
        }        
        return this.errors;
    }
    
    checkPattern = function (microflow, ignoreRuleAnnotations) {
        console.log(microflow.name);
        let actions = microflow.actions;
        let illegalCommits = actions.find(action => {
            if (action.type==='Microflows$CommitAction' || action.isCommit){
                console.log(microflow.name);
                console.log(action);
                return true;
            }
            return false;            
        });
        if (illegalCommits){
            this.addErrors("GC3", ignoreRuleAnnotations); //Microflow does not return object or list
        }

        let exclusiveSplits = actions.find(action => {
            return action.type==='Microflows$ExclusiveSplit'
        });
        
        
    }
}
