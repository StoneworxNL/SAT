const Microflow = require("../MxModel/Microflow");
const CheckModule = require("./CheckModule");

module.exports = class SplitMergeCheck extends CheckModule {
    constructor(options) {
        super(options);

        this.errorCodes = {
            "SM1": "Missing caption for Exclusive split",
            "SM2": "Useless merge action",
            "SM3": "Exclusive split that check on enums should have an enum split ",
        };
    }


    check = function (model, microflow) {
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        this.setup(model, microflow);
        let mfActions = microflow.actions;
        mfActions.forEach((mfAction) => {
            if (mfAction.type.startsWith('Microflows$ExclusiveSplit')) {
                let caption = mfAction.caption;
                if (caption) { caption = caption.trim(); }
                this.checkExpression(mfAction.expression, ignoreRuleAnnotations, model, microflow);
                if (!caption || caption.length == 0) {
                    this.addErrors("SM1", ignoreRuleAnnotations);
                }
            } else if (mfAction.type.startsWith('Microflows$ExclusiveMerge')) {
                //let mf = model.findMicroflowInContainer(microflow.containerID, microflow.name);
                let flows = microflow.flows;
                let actionsToMerge = flows.filter((flow) => flow.destination === mfAction.id);
                if (actionsToMerge.length <= 1) {
                    this.addErrors("SM2", ignoreRuleAnnotations);
                }
            }
        })
        return this.errors;
    }

    checkExpression(expression, ignoreRuleAnnotations, model, microflow) {
        if (!expression) return;
        //Check for comparisons
        //For each comparison Check all Variables ($...)
        //For each variable: check to see if Enum
        //or
        // Get all Variables
        // For each : Check enum
        // If Enum: expression should contain only that enum (other words: enums must be only part of the expression)

        const variableRegex = /\$[a-zA-Z_][a-zA-Z0-9_]*(?:\/[a-zA-Z_][a-zA-Z0-9_]*)?/g;
        const variables = [];
        let match;
        while ((match = variableRegex.exec(expression)) !== null) {
            variables.push(match[0]);
        }
        // variables now contains all Mendix variables in the expression
        const isSingleVariable = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression.trim());
        const isComparison = /[=!<>]=?|[<>]/.test(expression);

        if (isSingleVariable) {
            return;
        } else if (isComparison) {

            // For each variable in the comparison, check if it's an enum
            variables.forEach(variable => {
                let entity = null;
                let variableClassName = variable.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\/?/);

                if (variableClassName && variableClassName.length == 2) variableClassName = variableClassName[1];
                let variableClass = this.getVariableClass(variableClassName, microflow.actions);
                let variableAttribute = variable.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\/([a-zA-Z_][a-zA-Z0-9_]*)$/);
                if (variableAttribute && variableAttribute.length == 2) {
                    variableAttribute = variableAttribute[1];
                }
                if (variableClass && variableAttribute) {
                    for (const action of microflow.actions) {
                        if (action.variableName === variableClassName && action.entity) {
                            entity = action.entity;
                            break;
                        }
                        if (entity) {
                            let entityInModel;
                            const entityName = entity.split('.').pop();
                            const entityModule = entity.split('.').slice(0, -1).join('.');

                            const matchedEntity = model.entities.find(e => e.name === entityName);
                            console.log(`Matched entity:`, matchedEntity);
                            let module = model.getModule(matchedEntity.containerID);
                            if (module.name === entityModule) {
                                console.log(`Matched module:`, module);
                                entityInModel = matchedEntity;
                                const matchedAttribute = matchedEntity.attrs.find(attr => attr.name === attributeName);
                                console.log(`Matched attribute:`, matchedAttribute);
                                if (matchedAttribute && matchedAttribute.type === 'DomainModels$EnumerationAttributeType') {
                                    this.addErrors("SM3", ignoreRuleAnnotations);
                                }
                            }
                        }
                    }
                };
            });
            const leftSide = expression.split(/[=!<>]=?|[<>]/)[0].trim();
            const leftSideMatchClass = leftSide.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\//);
            const leftSideMatchAttribute = leftSide.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\/([a-zA-Z_][a-zA-Z0-9_]*)$/);
            let variableName = null;
            let attributeName = null;
            if (leftSideMatchClass) {
                variableName = leftSideMatchClass[1];
                attributeName = leftSideMatchAttribute ? leftSideMatchAttribute[1] : null;
                // Find the entity value for the given variableName in the microflow actions
                let entity = null;
                for (const action of microflow.actions) {
                    if (action.variableName === variableName && action.entity) {
                        entity = action.entity;
                        break;
                    }
                }
                // entityValue now contains the entity string, or null if not found
                if (entity) {
                    let entityInModel;
                    const entityName = entity.split('.').pop();
                    const entityModule = entity.split('.').slice(0, -1).join('.');

                    const matchedEntity = model.entities.find(e => e.name === entityName);
                    //console.log(`Matched entity:`, matchedEntity);
                    if (matchedEntity) {
                        let module = model.getModule(matchedEntity.containerID);
                        if (module.name === entityModule) {
                            //console.log(`Matched module:`, module);
                            entityInModel = matchedEntity;
                            const matchedAttribute = matchedEntity.attrs.find(attr => attr.name === attributeName);
                            //console.log(`Matched attribute:`, matchedAttribute);
                            if (matchedAttribute && matchedAttribute.type === 'DomainModels$EnumerationAttributeType') {
                                this.addErrors("SM3", ignoreRuleAnnotations);
                            }
                        }
                    }
                }
            }
        }
    }

    getVariableClass(variableClassName, actions) {
        for (const action of actions) {
            if (action.variableName === variableClassName && action.entity) {
                return action.entity;
            }
        }
        return null;
    }

}

