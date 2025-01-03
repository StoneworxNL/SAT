class Module {
    constructor(id, name, fromAppStore) {
        this.id = id,
        this.name = name;
        this.fromAppStore = fromAppStore;
    }

    static builder(modules){
        return modules.map(m => new Module(m.id, m.name, m.fromAppStore));
    }

    static parse (doc) {
        let moduleName = doc['Name'];
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