const config = require("config");
class Quality {

    constructor(model, excludes) {
        const checks = config.get("checks");
        let checksFolder = config.get("SquatChecksFolder");
        this.model = model;
        this.excludes = excludes;
        this.checkModules = [];
        this.errorCodes = {}
        this.reportedErrors = [];
        this.includeAppstore = config.get("includeAppstore");
        checks.forEach((check) => {
            let moduleName = checksFolder + check.fnc;
            let CheckModule = require(moduleName);
            let checkMod = new CheckModule(check.options);
            Object.assign(this.errorCodes, checkMod.getErrorCodes());
            this.checkModules.push(checkMod);
        });
    }

    analyse() {
        this.checkModules.forEach((checkModule) => {
            if (checkModule.level === 'security') {
                this.executeCheck(checkModule);
            } else if (checkModule.level === 'domainmodel') {
                this.model.entities.forEach(entity => {
                    this.executeCheck(checkModule, entity);
                })
            } else if (checkModule.level === 'menu') {
                this.model.menus.forEach(menu => {
                    this.executeCheck(checkModule, menu);
                })
            } else if (checkModule.level === 'page') {
                this.model.pages.forEach(page => {
                    this.executeCheck(checkModule, page);
                })
            }
        })

        this.model.microflows.forEach((microflow) => {
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
        let errors = checkModule.check(this.model, document);
        let excludeModule;
        if (errors && errors.length > 0) {
            let module;
            if (document) {
                module = this.model.getModule(document.containerID);
            }
            if (!module) { module = { 'fromAppStore': false }; }
            if (this.excludes) {
                excludeModule = this.excludes.find(exclude => exclude === module.name);
            }
            if (!excludeModule) {
                if (this.includeAppstore || (checkModule.level === 'app' || !module.fromAppStore)) {
                    if (checkModule.level === 'microflow') {
                        this.reportedErrors.push({ type: 'microflow', module: module.name, document: document.name, errors: errors });
                    } else if (checkModule.level === 'domainmodel') {
                        this.reportedErrors.push({ type: 'domainmodel', module: module.name, document: document.name, errors: errors });
                    } else if (checkModule.level === 'menu') {
                        this.reportedErrors.push({ type: 'menu', document: module.name + '.' + document.name, errors: errors });
                    } else if (checkModule.level === 'page') {
                        this.reportedErrors.push({ type: 'page', module: module.name, document: document.name, errors: errors });
                    } else {
                        this.reportedErrors.push({ type: 'app', document: checkModule.level, errors: errors });
                    }
                }
            }
        }

    }
}

module.exports = Quality;