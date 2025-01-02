class Menus {
    constructor() {        
    }

    static builder(obj) {
        return obj.map(m => new Menu(m.containerID, m.name, m.caption, m.actionType, m.action));
    }

    static parse(doc, container) {
        let profiles = doc['Profiles'];
        let menuItems = [];
        if (profiles && profiles.length > 1) {
            profiles.forEach(profile => {
                if (typeof profile != 'number') {
                    let menu = profile['Menu']['Items'];
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
        let menuName = doc['Name'];
        if (doc['ItemCollection']) {
            let items = doc['ItemCollection']['Items'];
            return Menu.parseItems(items, container, menuName);
        }
    }

    static parseItems(items, container, menuName) {
        let menuItems = [];
        let containerID = container.toString('base64');
        items.forEach(menuItem => {
            if (typeof menuItem != 'number') {
                let caption = menuItem['Caption']['Items'][1]['Text'];
                let actionType = menuItem['Action']['$Type'];
                actionType = actionType.replace(/^(Pages|Forms)\$/, "");
                let action = '';
                switch (actionType) {
                    case 'MicroflowAction':
                        action = menuItem['Action']['MicroflowSettings']['Microflow'];
                        menuItems.push(new Menu(containerID, menuName, caption, actionType, action));
                        break;
                    case 'FormAction':
                        action = menuItem['Action']['FormSettings']['Form'];
                        menuItems.push(new Menu(containerID, menuName, caption, actionType, action));
                        break
                    case 'NoAction':
                        let subMenu = menuItem['Items'];
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