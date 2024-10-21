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
                this.executeCheck(checkModule, model);
            } else if (checkModule.level === 'domainmodel') {
                model.entities.forEach(entity => {
                    this.executeCheck(checkModule, model, entity);
                })
            } else if (checkModule.level === 'menu') {
                model.menus.forEach(menu => {
                    this.executeCheck(checkModule, model, menu);
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
            let module;
            if (document) {
                module = model.getModule(document.containerID);
            }
            if(!module){module = {'fromAppStore': false};}
            if (this.includeAppstore || (checkModule.level === 'app' || !module.fromAppStore)) {
                if (checkModule.level === 'microflow') {
                    this.reportedErrors.push({ type: 'microflow', module: module.name, document: document.name, errors: errors });
                } else if (checkModule.level === 'domainmodel') {
                    this.reportedErrors.push({ type: 'domainmodel', module: module.name, document: document.name, errors: errors });
                } else if (checkModule.level === 'menu') {
                    this.reportedErrors.push({ type: 'menu', document: module.name + '.' + document.menuName, errors: errors });
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