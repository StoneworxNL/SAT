const CheckModule = require("./CheckModule");
const pluralize = require('pluralize');


// This check has a bigger brother that checks for Microflows TodoCheckMicroflow. That outputs TD2 errors

module.exports = class TodoCheckMicroflow extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "TD2": "There should be no TODO annotations in microflows"
        };
    }

    check = function (model, microflow) {      
        this.setup(model, microflow);
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();
        microflow.annotations.forEach(annotation =>{
            if (annotation.match(/to\s?do/i)){
                this.addErrors("TD2", ignoreRuleAnnotations, annotation);   
            };
        })
        return this.errors;
    }
}