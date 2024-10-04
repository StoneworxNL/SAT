const config = require("config");
class SquatAnalysis {

    constructor() {
        const checks = config.get("checks");
        let checksFolder = config.get("SquatChecksFolder");
        this.checkModules = [];
        this.errorCodes = {}
        this.reportedErrors = [];
        this.includeAppstore = config.get("includeAppstore");
        checks.forEach((check) => {
            if (check.squat) {
                let moduleName = checksFolder + check.fnc;
                let CheckModule = require(moduleName);
                let checkMod = new CheckModule(check.options);
                Object.assign(this.errorCodes, checkMod.getErrorCodes());
                this.checkModules.push(checkMod);
            }
        });
    }

    analyse(model) {
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
                        this.executeCheck(checkModule, model, microflow);
                    }
                })
            }
        })
    }

    executeCheck = function (checkModule, model, document) {
        let errors = checkModule.check(model, document);
        if (errors && errors.length > 0) {
            let module = model.getModule(document.containerID);
            if (this.includeAppstore || !module.fromAppStore) {
                if (checkModule.level === 'microflow') {
                    console.log(document.moduleID + ' = ' + module);
                    this.reportedErrors.push({ type: 'microflow', module: module.name, document: document.name, errors: errors });
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
}

module.exports = SquatAnalysis;