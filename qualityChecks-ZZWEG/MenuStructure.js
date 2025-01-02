const CheckModule = require("./CheckModule");

module.exports = class MenuStructure extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "MS1": "Menu microflows must be ACTs"
        };
        this.level = 'menu';
    }

    check = function (mfQuality, menu) {
        let errors = [];
        if (menu.actionType === 'microflow') {
            this.parseMFName(menu.action);
            if (this.mfPrefix != 'ACT') {
                this.addErrors(errors, "MS1", [], `${menu.action}`);
            }
        }
        return errors;
    }
}