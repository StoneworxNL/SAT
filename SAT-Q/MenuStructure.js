const CheckModule = require("./CheckModule");

module.exports = class MenuStructure extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "MS1": "Menu microflows must be ACTs"
        };
        this.level = 'menu';
    }

    check = function (model, menu) {
        this.setup(model, menu);
        if (menu.actionType === 'Forms$MicroflowAction') {
            let actionQName = menu.action;
            let [moduleName, microflowName] = actionQName.split('.');
            this.parseMFName(microflowName);
            if (this.mfPrefix != 'ACT') {
                this.addErrors("MS1", [], `${menu.action}`);
            }
        }
        return this.errors;
    }
}