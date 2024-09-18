const config = require("config");
class SquatAnalysis{

    constructor(){
        const checks = config.get("checks");
        let checksFolder = config.get("SquatChecksFolder");
        this.checkModules = [];
        this.errorCodes = {}
        this.reportedErrors = [];
        checks.forEach((check) => {
            if (check.squat){
                let moduleName = checksFolder + check.fnc;
                let CheckModule = require(moduleName);
                let checkMod = new CheckModule(check.options);
                Object.assign(this.errorCodes, checkMod.getErrorCodes());
                this.checkModules.push(checkMod);
            }
        });
    }

    analyse(model){
        console.log(JSON.stringify(this.checkModules, null, 2));
        this.checkModules.forEach((checkModule) => {
            if (checkModule.level === 'security') {
                this.executeCheck(checkModule, this.model);
            } else if (checkModule.level === 'domainmodel') {
                this.domains.forEach(entity => {
                    this.executeCheck(checkModule, entity);
                })
            } else if (checkModule.level === 'menu') {
                this.menus.forEach(menu => {
                    this.executeCheck(checkModule, menu);
                })
            } else if (checkModule.level === 'page') {
                this.pages.forEach(page => {
                    this.executeCheck(checkModule, page);
                })
            }
        })

        model.microflows.forEach((microflow) => {
            if (microflow && microflow != 'undefined') {
                this.checkModules.forEach((checkModule) => {
                    if (checkModule.level === 'microflow') {
                        this.executeCheck(checkModule, microflow);
                    }
                })
            }
        })
    }

    executeCheck = function (checkModule, document) {
        let errors = checkModule.check(this, document);
        if (errors && errors.length > 0) {
            if (checkModule.level === 'microflow') {
                let mf = this.hierarchy[document];
                this.reportedErrors.push({ type: 'microflow', document: mf.mf, errors: errors });
            } else if (checkModule.level === 'domainmodel') {
                this.reportedErrors.push({ type: 'domainmodel', document: document.module + '.' + document.name, errors: errors });
            } else if (checkModule.level === 'menu') {
                this.reportedErrors.push({ type: 'menu', document: document.module + '.' + document.document, errors: errors });
            } else if (checkModule.level === 'page') {
                this.reportedErrors.push({ type: 'page', document: document.module + '.' + document.name, errors: errors });
            } else {
                this.reportedErrors.push({ type: 'app', document: checkModule.level, errors: errors });
            }
        }

    }
}

module.exports = SquatAnalysis;