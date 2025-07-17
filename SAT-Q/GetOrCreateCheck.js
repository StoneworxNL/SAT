const CheckModule = require("./CheckModule");

module.exports = class IllegalCommit extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "GC1": "Naming convention not as SUB_[ENTITYNAME]_GetOrCreate",
            "GC2": "Get or Create does not return a (list of) object(s)",
            "GC3": "Create or Change object with commit is not allowed in GetOrCreate",
            "GC4": "Change object not allowed for existing object",
            "GC5": "Get or Create does not return the existing object",
            "GC6": "Exclusive split should check for retrieved variabe",
            "GC7": "Get or Create does not return the created object",
            "GC8": "Get or Create does not return entity specified in the microflow name",
        };
    }

    check = function (model, microflow) {        
        this.setup(model, microflow);
        if (microflow.name.includes('Get') && microflow.name.includes('Or') && microflow.name.includes('Create')) { //Check whether this is GetOrCreate in some form
            let allowedPrefixes = this.options.allowedPrefixes;
            let mfNameParts = this.microflowName.split('_');
            let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
            let mfPrefix = this.mfPrefix;
            if (mfNameParts.length < 3) {
                this.addErrors("GC1", ignoreRuleAnnotations);   // not according to naming conventions SUB_[Entity]_GetorCreate... 3 parts or more
            } else {
                let pfFound = allowedPrefixes.find((prefix) => prefix == mfPrefix);
                let GC1Found = false;
                if (!pfFound) {
                    this.addErrors("GC1", ignoreRuleAnnotations); // not according to naming conventions: prefix SUB
                    GC1Found = true;
                }
                let goc = mfNameParts[2];
                if (!goc.match(/^GetOrCreate.*/) && !GC1Found) {
                    this.addErrors("GC1", ignoreRuleAnnotations); // 3rd part = GetOrCreate
                    GC1Found = true;
                };
                let mfReturnType = microflow.returnType;
                let mfReturnEntity = microflow.returnEntity;
                if (mfReturnType === 'DataTypes$ObjectType' || mfReturnType === 'DataTypes$ListType') { //Check if the microflow returntype is an object or list of objects
                    let moduleName, entityName;
                    if (mfReturnEntity) {
                        [moduleName, entityName] = mfReturnEntity.split('.');
                    }
                    if (this.microflowName.includes(entityName)) {
                        //Oke
                    } else if (!GC1Found) {
                        this.addErrors("GC8", ignoreRuleAnnotations); //Microflow name does not contain name of returned Entity 
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
        const regex = /([\w]+)\s*!= empty\b/;
        console.log(microflow.name);
        let actions = microflow.actions;
        let illegalCommits = actions.find(action => {
            if (action.type === 'Microflows$CommitAction' || action.isCommit) {
                return true;
            }
            return false;
        });
        if (illegalCommits) {
            this.addErrors("GC3", ignoreRuleAnnotations); //Microflow does not return object or list
        }
        let actionsSorted = microflow.sortActions();
        let trueBranch = false;
        let falseBranch = false;
        let existingVariable; let createVariable;
        let entity;
        actionsSorted.forEach(action => {
            if (action.type === 'Microflows$RetrieveAction') {
                existingVariable = action.variableName;
                entity = action.entity;
            }
            if (action.type === 'Microflows$ExclusiveSplit') {
                if (action.expression) {
                    let match = action.expression.match(regex)
                    if (match) {     // the decision
                        if (match[1] != existingVariable) {
                            this.addErrors("GC6", ignoreRuleAnnotations);
                        }
                        trueBranch = true;
                    }
                } else {
                    console.log(JSON.stringify(action, null, 2));
                }
            }
            if (trueBranch) {
                if (action.type === 'Microflows$ChangeAction') {
                    if (existingVariable === action.variableName) {
                        this.addErrors("GC4", ignoreRuleAnnotations);
                    }
                }
                if (action.type === 'Microflows$EndEvent') {
                    if (existingVariable != action.variableName) {
                        this.addErrors("GC5", ignoreRuleAnnotations);
                    }
                    trueBranch = false; falseBranch = true;
                }
            } else if (falseBranch) {
                if (action.type === 'Microflows$CreateObjectAction' || action.type === 'Microflows$CreateChangeAction') {
                    createVariable = action.variableName;
                }

                if (action.type === 'Microflows$EndEvent') {
                    if (createVariable != action.variableName) {
                        this.addErrors("GC7", ignoreRuleAnnotations);
                    }

                }
            }
        })
    }
}
