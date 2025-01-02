const UserRole = require("./UserRole");
const Module = require("./Module");
const Entity = require("./Entity");
const Microflow = require("./Microflow");
const Folder = require("./Folder");
const { Menus, Menu } = require("./Menu");
const Page = require("./Page");
const Security = require("./Security");

class MxModel {
    constructor() {
        this.security = {},
        this.modules = [];
        this.entities = [];
        this.microflows = [];
        this.folders = {};
        this.menus = [];
        this.pages = [];
    }

    static builder(obj) {
        let mxModel = new MxModel();
        mxModel.security = Security.builder(obj.security);
        mxModel.modules = Module.builder(obj.modules);
        mxModel.entities = Entity.builder(obj.entities);
        mxModel.microflows = Microflow.builder(obj.microflows);
        mxModel.folders = Folder.builder(obj.folders);
        mxModel.menus = Menus.builder(obj.menus);
        mxModel.pages = Page.builder(obj.pages);
        return mxModel
    }

    parseSecurity(doc) {
        this.security = Security.parse(doc);
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

    parsePage(doc, container) {
        let page = Page.parse(doc, container);
        this.pages.push(page);
    }

    parseMenus(doc, container) {
        let menus = Menus.parse(doc, container);
        this.menus.push(...menus);
    }
    parseMenu(doc, container) {
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

    findAppRolesByModuleRole(roleName) {
        return this.security.roles.filter(role =>
            role.moduleRoles.find(moduleRole => moduleRole === roleName)
        )
    }

    instantiateEntity(obj) {
        return Entity.builder(obj);
    }

    sortAll() {
        let modulesSorted = this.modules.sort((a, b) => {
            if (a.fromAppStore !== b.fromAppStore) {
                return b.fromAppStore - a.fromAppStore;
            }
            return a.name.localeCompare(b.name);
        });

        let entitiesSorted = this.entities.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        let microflowsSorted = this.microflows.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        let foldersSorted = Object.entries(this.folders).sort(([, a], [, b]) => a.name.localeCompare(b.name))

        let menusSorted = this.menus.sort((a, b) => {
            return a.caption.localeCompare(b.caption);
        });

        let pagesSorted = this.pages.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        this.modules = modulesSorted;
        this.entities =  entitiesSorted;
        this.microflows = microflowsSorted;
        this.folders = foldersSorted;
        this.menus = menusSorted;
        this.pages = pagesSorted;
    }
}

module.exports = MxModel;