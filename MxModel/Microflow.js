const Flow = require('./Flow');
const {Action, JavaAction} = require('./Action');

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
                let origin = flow['OriginPointer'];
                let destination = flow['DestinationPointer'];
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
                        if (activityType === 'Microflows$MicroflowCallAction') {
                            let subMF = action['Action']['MicroflowCall']['Microflow'];
                            microflow.addSubMicroflow(subMF);
                        } else if (activityType === 'Microflows$CreateVariableAction') {
                            let complexity = 0;
                            actionData = new Action(activityType, action['$ID'], false, complexity);
                            microflow.addAction(actionData);
                        } else if (activityType === 'Microflows$JavaActionCallAction'){
                            console.log(JSON.stringify(action, null, 2));
                            let errorHandling = action['Action']['ErrorHandlingType'];
                            let JavaActionName = action['Action']['JavaAction'];
                            actionData = new JavaAction(activityType, action['$ID'], errorHandling, JavaActionName);
                            microflow.addAction(actionData);                            
                        } else {
                            //                            console.log('ACTION: '+actionType+' - '+activityType);
                        }
                        break;
                    default:
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
