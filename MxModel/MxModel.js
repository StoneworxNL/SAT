const Module = require("./Module");
const Entity = require("./Entity");
const Microflow = require("./Microflow");
const Folder = require("./Folder");
const Menu = require("./Menu");

class MxModel {
    constructor() {
        this.security = {},
        this.modules = [];
        this.entities = [];
        this.microflows = [];
        this.folders = {};
        this.menus = [];
    }

    parseSecurity(doc) {
        this.security = { 'enableDemoUsers': doc['EnableDemoUsers'] };
    }

    parseModule(doc) {
        this.modules.push(Module.parse(doc));
    };

    parseDomain(doc, container) {
        this.entities.push(...Entity.parse(doc, container))
    }

    parseMicroflow(doc, container) {
        this.microflows.push(Microflow.parse(doc, container))
    }

    parseFolder(doc, container) {
        let folder = Folder.parse(doc, container);
        this.folders[folder.id] = folder;
    }

    parseNavigation(doc, container){
        let profiles = doc['Profiles'];
        if (profiles && profiles.length > 1){
            profiles.forEach(profile => {
                if (typeof profile != 'number'){
                    let menu = profile['Menu']['Items'];
                    let menuName = profile['Name'];
                    let menuItems = Menu.parseItems(menu, container, menuName);
                    this.menus.push(...menuItems);
                }
            });
        }
    }
    parseMenu(doc, container){
        let menuItems = Menu.parse(doc, container);
        this.menus.push(...menuItems);
    }

    getModule(containerID) {
        let module = this.modules.find(module => module.id === containerID);
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

    findMicroflowInContainer(containerID, microflowName) {
        let module = this.getModule(containerID);
        return this.findMicroflow(module, microflowName);
    }

    findMicroflow(module, microflowName) {
        return this.microflows.find((microflow) => {
            let mfModule = this.getModule(microflow.containerID);
            return microflow.name === microflowName && module === mfModule.name;
        })
    }


}

module.exports = MxModel;