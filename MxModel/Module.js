const MxModelObject = require('./MxModelObject');

class Module extends MxModelObject{
    constructor(id, name, fromAppStore) {
        super();
        this.id = id,
        this.name = name;
        this.fromAppStore = fromAppStore;
    }

    static builder(modules){
        return modules.map(m => new Module(m.id, m.name, m.fromAppStore));
    }

    static parse (doc) {
        let moduleName = Module.findKey(doc,'Name');
        let moduleID = doc['$ID'].toString('base64');
        let appStore = false;        
        if (doc['$Type']==='Projects$Project') {
            moduleName = 'Project';
            appStore = false;

        } else {
            appStore = doc['FromAppStore'];
        }
        return new Module(moduleID, moduleName, appStore)
    }
    
}

module.exports = Module;