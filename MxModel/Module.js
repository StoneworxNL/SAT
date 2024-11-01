class Module {
    constructor(id, name, fromAppStore) {
        this.id = id,
        this.name = name;
        this.fromAppStore = fromAppStore;
    }

    static parse (doc) {
        let moduleName = doc['Name'];
        if (doc['$Type']==='Projects$Project') {
            moduleName = 'Project';
        }
        let moduleID = doc['$ID'].toString('base64');
        let appStore = doc['FromAppStore'];
        return new Module(moduleID, moduleName, appStore)
    }
    
}

module.exports = Module;