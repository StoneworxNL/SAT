const CheckModule = require("./CheckModule");

module.exports = class DemoUsers extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DU1": "Demo users not allowed in production app"
        };
        this.level = 'security';
    }

    check = function (model) {
        let demoUsers = model.security.enableDemoUsers;
        if (demoUsers){
            this.addErrors("DU1", []);
        }
        return this.errors;
    }
}