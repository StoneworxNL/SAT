const MxModelObject = require('./MxModelObject');
const Flow = require('./Flow');
const { Action, JavaAction, ExpressionAction } = require('./Action');

class Microflow extends MxModelObject {
    constructor(containerID, microflowName, returnType, returnEntity) {
        super();
        this.containerID = containerID,
            this.name = microflowName;
        this.returnType = returnType;
        this.returnEntity = returnEntity;
        this.flows = [];
        this.actions = [];
        this.annotations = [];
        this.subMicroflows = [];
        this.roles = [];
    }

    static builder(microflows) {
        return microflows.map(obj => {
            let mf = new Microflow(obj.containerID, obj.name, obj.returnType, obj.returnEntity)
            mf.flows = obj.flows;
            mf.actions = obj.actions;
            mf.annotations = obj.annotations;
            mf.subMicroflows = obj.subMicroflows;
            mf.roles = obj.roles;
            return mf;
        });
    }

    static parse(doc, container) {
        let containerID = container;
        let microflowName = Microflow.findKey(doc, 'Name');
        let returnType = Microflow.findKey(doc, 'MicroflowReturnType');
        let returnEntity = '';
        if (returnType) {
            returnType = returnType['$Type'];
            if (returnType === 'DataTypes$ObjectType' || returnType === 'DataTypes$ListType') {
                returnEntity = Microflow.findKey(returnType, 'Entity');
            }
        }

        let microflow = new Microflow(containerID, microflowName, returnType, returnEntity);
        let flows = Microflow.findKey(doc, 'Flows');

        flows.forEach(flow => {
            if (flow['$Type'] && flow['$Type'] === 'Microflows$SequenceFlow') {
                // console.log('FLOW');
                // console.log(JSON.stringify(flow, null, 2));
                let origin = flow['OriginPointer'] ? flow['OriginPointer'].toString('base64') : flow['origin'];
                let destination = flow['DestinationPointer'] ? flow['DestinationPointer'].toString('base64') : flow['destination'];
                let flowValue = false;
                let newCase = Microflow.findKey(flow, 'NewCaseValue');
                if (newCase) {
                    flowValue = Microflow.findKey(newCase, 'Value') == 'true';
                }
                let isError = Microflow.findKey(flow, 'IsErrorHandler');
                let flowData = new Flow(origin, destination, isError, flowValue)

                microflow.addFlow(flowData);
            }
        })

        let allowedRoles = Microflow.findKey(doc, 'AllowedModuleRoles');
        if (allowedRoles && allowedRoles.length > 1) {
            microflow.roles = allowedRoles.slice(1);
        }
        Microflow.parseMFActions(doc, microflow, container, microflowName);
        return microflow;
    }

    static parseMFActions(doc, microflow, module, microflowName) {
        let objectCollection = Microflow.findKey(doc, 'ObjectCollection');
        let actions = Microflow.findKey(objectCollection, 'Objects');
        actions.forEach(action => {
            if (action['$Type']) {
                let actionID = action['$ID'].toString('base64');
                let actionType = action['$Type'];
                let actionData;
                let complexity = 0;
                let caption;
                switch (actionType) {
                    case 'Microflows$Annotation':
                        let annotation = Microflow.findKey(action, 'Caption');
                        microflow.addAnnotation(annotation);
                        break;
                    case 'Microflows$LoopedActivity':
                        actionData = new Action(actionType, actionID);
                        microflow.addAction(actionData);
                        Microflow.parseMFActions(action, microflow);
                        break;
                    case 'Microflows$ActionActivity':
                        let actionActivity = Microflow.findKey(action, 'Action');
                        let activityType = actionActivity['$Type'];
                        switch (activityType) {
                            case 'Microflows$MicroflowCallAction':
                                actionData = new Action(activityType, actionID);
                                microflow.addAction(actionData);
                                let microflowCall = Microflow.findKey(actionActivity, 'MicroflowCall');
                                let subMF = Microflow.findKey(microflowCall, 'Microflow');
                                microflow.addSubMicroflow(subMF);
                                break;
                            case 'Microflows$CreateVariableAction':
                                let initialValue = Microflow.findKey(actionActivity, 'InitialValue');
                                complexity = microflow.checkExpressionComplexity(initialValue);
                                caption = action['Caption'];
                                actionData = new ExpressionAction(activityType, actionID, false, complexity, caption);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$ChangeVariableAction':
                                complexity = microflow.checkExpressionComplexity(Microflow.findKey(actionActivity, 'Value'));
                                caption = Microflow.findKey(action, 'Caption');
                                actionData = new ExpressionAction(activityType, actionID, false, complexity, caption);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$CreateChangeAction':
                            case 'Microflows$CreateAction':
                            case 'Microflows$ChangeAction':
                                let commit = false;
                                let assignments = action['Action']['Items'].flatMap((item) => { 
                                    let attributes = item['Attribute'] && item['Attribute'] !== '' ? [item['Attribute']] : [];
                                    let associations = item['Association'] && item['Association'] !== '' ? item['Association'] : [];
                                    return [...attributes, ...associations];
                                });
                                action['Action']['Items'].forEach((item) => {
                                    if (item['$ID']) {
                                        let count = microflow.checkExpressionComplexity(item['Value']);
                                        if (count > complexity) { complexity = count };
                                    }
                                })
                                if (action['Action']['Commit'].includes('Yes')) {
                                    commit = true;
                                }
                                actionData = new ExpressionAction(activityType, actionID, commit, complexity, null, null, assignments);
                                actionData.variableName = action['Action']['VariableName'] ? action['Action']['VariableName'] : action['Action']['ChangeVariableName'];
                                microflow.addAction(actionData);
                                break
                            case 'Microflows$CommitAction':
                                let commitVariable = Microflow.findKey(actionActivity, 'CommitVariableName');
                                actionData = new Action(activityType, actionID, commitVariable);
                                microflow.addAction(actionData);
                                break
                            case 'Microflows$JavaActionCallAction':
                                let errorHandling = Microflow.findKey(actionActivity, 'ErrorHandlingType');
                                let JavaActionName = Microflow.findKey(actionActivity, 'JavaAction');
                                actionData = new JavaAction(activityType, action['$ID'], errorHandling, JavaActionName);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$RetrieveAction':
                                let resultVariableName = Microflow.findKey(actionActivity, 'ResultVariableName');
                                actionData = new Action(activityType, action['$ID'], resultVariableName);
                                microflow.addAction(actionData);
                                break;
                            default:
                                //console.log(activityType);                               
                                actionData = new Action(activityType, actionID);
                                microflow.addAction(actionData);
                                break;
                        }
                        break;
                    case 'Microflows$ExclusiveSplit':
                        caption = Microflow.findKey(action, 'Caption');
                        let splitCondition = Microflow.findKey(action, 'SplitCondition');
                        let condition = splitCondition ? Microflow.findKey(splitCondition, 'Expression') : '';
                        complexity = microflow.checkExpressionComplexity(condition);
                        actionData = new ExpressionAction(actionType, actionID, false, complexity, caption, condition);
                        microflow.addAction(actionData);
                        break;
                    case 'Microflows$ExclusiveMerge':
                        actionData = new Action(actionType, actionID);
                        microflow.addAction(actionData);
                        break;
                    case 'Microflows$StartEvent':
                        actionData = new Action(actionType, actionID);
                        microflow.addAction(actionData);
                        break;
                    case 'Microflows$EndEvent':
                        let returnVariable;
                        let returnValue = Microflow.findKey(action, 'ReturnValue');
                        if (returnValue) {returnVariable = returnValue.replace(/^\$/, "");}
                        actionData = new Action(actionType, actionID, returnVariable);
                        microflow.addAction(actionData);
                        break;
                    default:
                        actionData = new Action(actionType, actionID);
                        microflow.addAction(actionData);
                        break;
                }
            }
        })
    }

    static parseQualifiedName(microflowName) {
        let [moduleName, mfName] = microflowName.split('.');
        let prefix; let entity; let action;
        if (mfName) {
            [prefix, entity, action] = mfName.split('_', 3);
        }
        return [moduleName, prefix, entity, action];
    }

    checkExpressionComplexity(expression) {
        if (!expression) return 0;
        let result = 0;
        let regex = /(if(\s|\()|and(\s|\()|or(\s|\()|not(\s|\())/g;
        let matches = expression.match(regex) || [];
        if (matches.length > 0) {
            result = matches.length;
        }
        return result;
    }

    addFlow(flow) {
        this.flows.push(flow);
    }

    addAction(action) {
        this.actions.push(action);
    }

    addSubMicroflow(subMF) {
        this.subMicroflows.push(subMF);
    }

    addAnnotation(annotation) {
        this.annotations.push(annotation);
    }

    getIgnoreRuleAnnotations() {
        let ignoreRuleAnnotations = [];
        ignoreRuleAnnotations = this.annotations.flatMap((annotation) => {
            let ignoreRuleAnnotation = annotation.match(/^@SAT-([A-Z]{2}\d): .*/);
            if (ignoreRuleAnnotation) {
                return ignoreRuleAnnotation[1];
            }
            return [];
        })
        return ignoreRuleAnnotations;
    }

    getQualifiedName(model) {
        let module = model.getModule(this.containerID);
        return `${module.name}.${this.name}`;
    }

    sortActions() {
        let sortedActions = [];
        let startEvnt = this.findActionByType("Microflows$StartEvent");
        sortedActions.push(startEvnt);
        this.parseFlows(startEvnt.id, sortedActions);
        return sortedActions;
    }

    parseFlows(id, sortedActions) {
        let flows = this.findFlows(id);
        if (flows.length > 1) {
            flows = flows.sort((flowA, flowB) => (flowB.flowValue === 'true') - (flowA.flowValue === 'true'));
        }
        flows.forEach(flow => {
            let action = this.findActionById(flow.destination);
            sortedActions.push(action);
            let id = flow.destination;
            this.parseFlows(id, sortedActions);
        })
    }

    findActionByType(actionType) {
        return this.actions.find(action => action.type === actionType);
    }

    findActionById(id) {
        return this.actions.find(action => action.id === id);
    }

    findFlows(id) {
        return this.flows.filter(flow => flow.origin === id);
    }


}

module.exports = Microflow;
