const Module = require("./Module");
const Entity = require("./Entity");
const Microflow = require("./Microflow");
const Folder = require("./Folder");

class MxModel{
    constructor() {
        this.security = {},
        this.modules = [];
        this.entities = [];
        this.microflows = [];
        this.folders = {};
    }

    parseSecurity(doc) {
        this.security = { 'enableDemoUsers': doc['EnableDemoUsers'] };
    }

    parseModule(doc){
        this.modules.push(Module.parse(doc));
    };

    parseDomain(doc, container){
        this.entities.push(...Entity.parse(doc, container))
    }
    
    parseMicroflow(doc, container){
        this.microflows.push(Microflow.parse(doc, container))
    }

    parseFolder(doc, container){
        let folder = Folder.parse(doc, container);
        this.folders[folder.id] =  folder;
    }

    getModule(containerID){
        let module = this.modules.find(module=> module.id === containerID);
        if (module) {
            return module
        } else {
            let folder = this.folders[containerID];
            if (folder) {
                return this.getModule(folder.container)
            } else {
                return;
            }
        }
    }


}

module.exports = MxModel;