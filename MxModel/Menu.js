const MxModelObject = require('./MxModelObject');

class Menus extends MxModelObject {
    constructor() {        
        super();
    }

    static builder(obj) {
        return obj.map(m => new Menu(m.containerID, m.name, m.caption, m.actionType, m.action));
    }

    static parse(doc, container) {
        let profiles = Menus.findKey(doc, 'Profiles');
        let menuItems = [];
        if (profiles && profiles.length > 1) {
            profiles.forEach(profile => {
                if (typeof profile != 'number') {
                    let menu = Menus.findKey(profile, 'Menu', 'Items');
                    //profile['Menu']['Items'];
                    let menuName = profile['Name'];
                    menuItems.push(...Menu.parseItems(menu, container, menuName));
                }
            });
        }
        return (menuItems);
    }

}

class Menu {
    constructor(containerID, menuName, caption, actionType, action) {
        this.containerID = containerID,
        this.name = menuName;
        this.caption = caption;
        this.actionType = actionType;
        this.action = action;
    }


    static parse(doc, container) {
        let menuName = Menus.findKey(doc, 'Name');
        let itemCollection = Menus.findKey(doc, 'ItemCollection');
        if (itemCollection) {
            let items = Menus.findKey(itemCollection, 'Items');
            return Menu.parseItems(items, container, menuName);
        }
    }

    static parseItems(items, container, menuName) {
        let menuItems = [];
        let containerID = container.toString('base64');
        items.forEach(menuItem => {
            if (typeof menuItem != 'number') {
                let caption = Menus.findKey(menuItem, 'Caption');
                let captionText;
                if (caption['Items'] && caption['Items'].length > 1) {
                    captionText = caption['Items'][1]['Text'];
                } else {
                    captionText = caption['translations'][0]['text'];
                }
                let actionType = Menus.findKey(menuItem, 'Action','$Type');
                //menuItem['Action']['$Type'];
                actionType = actionType.replace(/^(Pages|Forms)\$/, "");
                let action = '';
                switch (actionType) {
                    case 'MicroflowAction':                        
                        action = Menus.findKey(menuItem,'Action','MicroflowSettings','Microflow');
                        menuItems.push(new Menu(containerID, menuName, captionText, actionType, action));
                        break;
                    case 'FormAction':
                        action = Menus.findKey(menuItem,'Action','FormSettings','Form');
                        menuItems.push(new Menu(containerID, menuName, captionText, actionType, action));
                        break
                    case 'NoAction':
                        let subMenu = Menus.findKey(menuItem, 'Items');
                        if (subMenu && subMenu.length > 1) {
                            let subMenuItems = Menu.parseItems(subMenu, containerID, menuName);
                            menuItems.push(...subMenuItems);
                        }
                        break;
                    default:
                        break;
                }

            }
        });
        return menuItems;
    }
}

module.exports = { Menus, Menu };