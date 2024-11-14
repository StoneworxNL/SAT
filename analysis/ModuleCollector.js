const Module = require("../MxModel/Module");
module.exports = class ModuleCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let modules = this.modelQuality.model.allModules();
        modules.forEach(moduleIF => {
            promises.push(new Promise((resolve, reject) => {
                //let moduleName = modelQuality.getModuleName(domainIF);
                console.log(JSON.stringify(moduleIF, null, 2));
                let newModule = new Module(moduleIF['id'], moduleIF['name'], moduleIF['fromAppStore']);
                this.modelQuality.MxModel.modules.push(newModule);
                resolve();
            }))
        });
    }
}
