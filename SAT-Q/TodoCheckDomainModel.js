const CheckModule = require("./CheckModule");
const pluralize = require('pluralize');


// This check has a bigger brother that checks for Microflows TodoCheckMicroflow. That outputs TD2 errors

module.exports = class TodoCheckDomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "TD1": "There should be no TODO annotations on the domain model"
        };
        this.level = 'domainmodel';
    }

    check = function (model, entity) {      
        this.setup(model, entity);
        let ignoreRuleAnnotations = entity.getIgnoreRuleAnnotations();
        if (entity.documentation && entity.documentation.match(/to\s?do/i)){
            this.addErrors("TD1", ignoreRuleAnnotations);   
        };
        return this.errors;
    }
}