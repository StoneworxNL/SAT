const { Menus, Menu } = require("../MxModel/Menu");

module.exports = class MenuCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises) {
        let menus = this.modelQuality.model.allMenuDocuments();
        let navigations = this.modelQuality.model.allNavigationDocuments();
        navigations.forEach(navigationIF => {
            promises.push(new Promise((resolve, reject) => {
                navigationIF.load().then((navigation) => {
                    //let moduleName = this.modelQuality.getModuleName(navigation);
                    //let menuName = navigation.name;
                    let containerID = navigation.container.id.toString('base64');
                    let profiles = navigation.profiles;
                    profiles.forEach(profile => {
                        let menuItems = profile.menuItemCollection.items;
                        this.parseMenuItems(containerID, containerID, profile.name, menuItems);
                    })
                    resolve();
                });
            }))
        });
        menus.forEach((menuIF) => {
            promises.push(new Promise((resolve, reject) => {
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = this.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    let moduleName = this.modelQuality.getModuleName(menuIF);
                    let menuName = menuIF.name;
                    let containerID = menuIF.container.id.toString('base64');
                    menuIF.load().then((menu) => {
                        let menuItems = menu.itemCollection.items;
                        this.parseMenuItems(containerID, moduleName, menuName, menuItems);
                        resolve();
                    });
                } else { resolve() };
            }))
        });
    }

    parseMenuItems = function (containerID, module, menuName, menuItems) {
        menuItems.forEach(menuItem => {
            let itemJSON = menuItem.toJSON();
            let menu;
            let caption = itemJSON.caption.translations[0].text;
            let actionType = itemJSON.action.$Type.replace(/^(Pages|Forms)\$/, "");
            actionType = actionType.replace(/Client/,"");
            switch (actionType) {
                case 'PageAction':
                    actionType = 'FormAction';
                    let page = itemJSON.action.pageSettings.page;
                    menu = new Menu(module, menuName, caption, actionType, page);
                    this.modelQuality.MxModel.menus.push(menu);
                    break
                case 'MicroflowAction':
                    let microflow = itemJSON.action.microflowSettings.microflow;
                    menu = new Menu(containerID, menuName, caption, actionType, microflow);
                    this.modelQuality.MxModel.menus.push(menu);
                    break
                default:

            }
            let subItems = menuItem.items;
            if (subItems.length > 0) {
                this.parseMenuItems(containerID, module, menuName, subItems);
            }
        })
    }
}