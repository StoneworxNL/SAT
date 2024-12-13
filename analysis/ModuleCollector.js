const Module = require("../MxModel/Module");
module.exports = class ModuleCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let modules = this.modelQuality.model.allModules();
        let projects = this.modelQuality.model.allProjects();
        let projectID = projects[0].id;     
        this.modelQuality.MxModel.modules.push(new Module(projectID, 'Project', false));
        modules.forEach(moduleIF => {
            promises.push(new Promise((resolve, reject) => {
                let newModule = new Module(moduleIF['id'], moduleIF['name'], moduleIF['fromAppStore']);
                this.modelQuality.MxModel.modules.push(newModule);
                resolve();
            }))
        });
    }
}
