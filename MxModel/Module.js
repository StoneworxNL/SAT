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
        // let uint8Array = new Uint8Array(doc['$ID'].buffer.length);
        // doc['$ID'].buffer.map((value, index) => {
        //     uint8Array[index] = value;
        // });
        // let moduleID = Module.uint8ArrayToUUID(uint8Array);
        let moduleID = Module.binaryToUUID(doc['$ID']);
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