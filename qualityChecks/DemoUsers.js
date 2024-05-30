const CheckModule = require("./CheckModule");

module.exports = class DemoUsers extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DU1": "Demo users not allowed in production app"
        };
        this.level = 'security';
    }

    check = function (mfQuality) {
        let errors = [];
        let demoUsers = mfQuality.security.enableDemoUsers;
        if (demoUsers){
            errors.push("DU1");
        }
        return errors;
    }
}