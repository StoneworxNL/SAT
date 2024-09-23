const CheckModule = require("./CheckModule");

module.exports = class ErrorHandling extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "EH1": "Java Action without custom error handling"
        };
    }

    check = function (model, microflow) {
        let errors = [];
        let allowedJava = this.options.allowedJava;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations(microflow);
        let mfActions = microflow.actions;
        let javaActions = mfActions.filter((action) => {
            return action.type == 'Microflows$JavaActionCallAction'
        })
        if (javaActions.length > 0) {
            javaActions.forEach((javaAction) => {
                let isAllowed = allowedJava.find((allowedJavaName) => allowedJavaName === javaAction.javaActionName);
                if (!isAllowed) {
                    let errorHandling = javaAction.errorHandlingType||'';
                    if (!(errorHandling.startsWith('Custom'))) {
                        this.addErrors(errors, "EH1", ignoreRuleAnnotations);
                    }
                }
            })
        }
        return errors;
    }
}