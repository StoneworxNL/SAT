const Flow = require('./Flow');
const { Action, JavaAction, ExpressionAction } = require('./Action');

class Microflow {
    constructor(containerID, microflowName, returnType, returnEntity) {
        this.containerID = containerID,
            this.name = microflowName;
        this.returnType = returnType;
        this.returnEntity = returnEntity;
        this.flows = [];
        this.actions = [];
        this.annotations = [];
        this.subMicroflows = [];
    }


    static parse(doc, container) {
        let containerID = container.toString('base64');
        let microflowName = doc['Name'];
        let returnType = ''; let returnEntity = '';
        if (doc['MicroflowReturnType']) {
            returnType = doc['MicroflowReturnType']['$Type']
            if (returnType === 'DataTypes$ObjectType' || returnType === 'DataTypes$ListType') {
                returnEntity = doc['MicroflowReturnType']['Entity'];
            }
        }

        let microflow = new Microflow(containerID, microflowName, returnType, returnEntity);
        let flows = doc['Flows'];

        flows.forEach(flow => {
            if (flow['$Type'] && flow['$Type'] === 'Microflows$SequenceFlow') {
                // console.log('FLOW');
                // console.log(JSON.stringify(flow, null, 2));
                let origin = flow['OriginPointer'].toString('base64');
                let destination = flow['DestinationPointer'].toString('base64');
                let flowValue = '';
                if (flow['NewCaseValue']['Value']) {
                    flowValue = flow['NewCaseValue']['Value'];
                }
                let isError = flow['IsErrorHandler'];
                let flowData = new Flow(origin, destination, isError, flowValue)
                microflow.addFlow(flowData);
            }
        })
        Microflow.parseMFActions(doc, microflow, container, microflowName);
        return microflow;
    }

    static parseMFActions(doc, microflow, module, microflowName) {
        let actions = doc['ObjectCollection']['Objects'];
        actions.forEach(action => {
            if (action['$Type']) {
                let actionID = action['$ID'].toString('base64');
                let actionType = action['$Type'];
                let actionData;
                let complexity = 0;
                switch (actionType) {
                    case 'Microflows$Annotation':
                        let annotation = action['Caption'];
                        microflow.addAnnotation(annotation);
                        break;
                    case 'Microflows$LoopedActivity':
                        Microflow.parseMFActions(action, microflow);
                        break;
                    case 'Microflows$ActionActivity':
                        let activityType = action['Action']['$Type'];
                        switch (activityType) {
                            case 'Microflows$StartEvent':
                                actionData = new Action(activityType, actionID);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$EndEvent':
                                actionData = new Action(activityType, actionID);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$MicroflowCallAction':
                                let subMF = action['Action']['MicroflowCall']['Microflow'];
                                microflow.addSubMicroflow(subMF);
                                break;
                            case 'Microflows$CreateVariableAction':
                                complexity = microflow.checkExpressionComplexity(action['Action']['InitialValue']);
                                actionData = new ExpressionAction(activityType, actionID, false, complexity);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$ChangeVariableAction':
                                complexity = microflow.checkExpressionComplexity(action['Action']['Value']);
                                actionData = new ExpressionAction(activityType, actionID, false, complexity);
                                microflow.addAction(actionData);
                                break;
                            case 'Microflows$CreateChangeAction':
                            case 'Microflows$ChangeAction':
                                let commit = false;
                                action['Action']['Items'].forEach((item) => {
                                    if (item['$ID']) {
                                        let count = microflow.checkExpressionComplexity(item['Value']);
                                        if (count > complexity) { complexity = count };
                                    }
                                })
                                if (action['Action']['Commit'] === 'Yes') {
                                    commit = true;
                                }
                                actionData = new ExpressionAction(activityType, actionID, commit, complexity);
                                microflow.addAction(actionData);
                                break
                            case 'Microflows$JavaActionCallAction':
                                let errorHandling = action['Action']['ErrorHandlingType'];
                                let JavaActionName = action['Action']['JavaAction'];
                                actionData = new JavaAction(activityType, action['$ID'], errorHandling, JavaActionName);
                                microflow.addAction(actionData);
                                break;
                            default:
                                actionData = new Action(activityType, actionID);
                                microflow.addAction(actionData);
                                break;
                        }
                        break;
                    case 'Microflows$ExclusiveSplit':
                        let caption = action['Caption'];;
                        let condition = action.SplitCondition.Expression ? action.SplitCondition.Expression : '';
                        complexity = microflow.checkExpressionComplexity(condition);
                        actionData = new ExpressionAction(actionType, actionID, false, complexity, caption);
                        microflow.addAction(actionData);
                        break;
                    case 'Microflows$ExclusiveMerge':
                        actionData = new Action(actionType, actionID);
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

    checkExpressionComplexity(expression) {
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
}

module.exports = Microflow;
