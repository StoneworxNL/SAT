const CheckModule = require("./CheckModule");

module.exports = class ModuleDecoupling extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "MD1": "Create and Change on objects outside it's parent module.",
        };
        this.originalMF = '';
    }

    check = function (model, microflow) {
        this.setup(model, microflow);
        this.originalMF = microflow.name;
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();

        if (!this.module.fromAppStore) {
            console.log(microflow.name);            
            microflow.actions.forEach((action) => {
                if (action.type === "Microflows$CreateChangeAction" || action.type === "Microflows$ChangeAction") {
                    let targetObject = action.entity;

                    if (targetObject) {
                        let entityModule = targetObject.split('.')[0] || '';
                        if (entityModule !== this.module.name) {
                            this.addErrors("MD1", ignoreRuleAnnotations);
                        }
                    }
                }
            });
        }
        return this.errors;
    }

}
