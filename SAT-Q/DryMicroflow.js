const CheckModule = require("./CheckModule");

module.exports = class DryMicroflow extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DR1": "Create and Change actions with (a lot) same assignments in this or submicroflows.",
        };
        this.originalMF = '';
    }

    check = function (model, microflow) {
        this.setup(model, microflow);
        this.originalMF = microflow.name;
        this.mfList = [];
        let ignoreRuleAnnotations = microflow.getIgnoreRuleAnnotations();

        if (!this.module.fromAppStore) {

            let isSubMF = model.microflows.find((mfToCheck) => { // check to see if microflow is called from any other microflow (making it a sub)
                let mfToCheckSubs = mfToCheck.subMicroflows;
                if (mfToCheckSubs && mfToCheckSubs.length > 0) {
                    let qualifiedName = microflow.getQualifiedName(model);
                    if (mfToCheckSubs.includes(qualifiedName)) {
                        return true;
                    }
                    return false;
                }
                return false;
            })
            if (!isSubMF) { // only check for top level microflows downwards
                this.mfList.push(microflow);
                this.digDeep(model, microflow);
            }
        }
        let createChangeActions = [];

        this.mfList.forEach((mf) => {
            mf.actions.forEach((action) => {
                if (action.type === "Microflows$CreateChangeAction" || action.type === "Microflows$ChangeAction") {
                    createChangeActions = createChangeActions.concat(action.assignments);
                }
            });
        });
        let duplicates = createChangeActions.filter((item, index) => createChangeActions.indexOf(item) !== index);
        if (duplicates.length > 0) { this.addErrors("DR1", ignoreRuleAnnotations); }
        return this.errors;
    }

    digDeep = function (model, microflow) {
        if (microflow && microflow.subMicroflows) {
            let subs = microflow.subMicroflows;
            subs.forEach((subMF) => {
                //console.log(`NESTING: ${microflow} ==> ${subMF} `);
                let [moduleName, microflowName] = subMF.split('.');
                let subMicroflow = model.findMicroflow(moduleName, microflowName);
                if (subMicroflow) {
                    if (this.mfList.some(
                        mf => mf && subMicroflow && mf.containerID === subMicroflow.containerID && mf.name === subMicroflow.name)
                    ) { // already in list
                    } else {
                        this.mfList.push(subMicroflow);
                        this.digDeep(model, subMicroflow);
                    }
                }  else { return }
                }
            );
        }
    }

}
