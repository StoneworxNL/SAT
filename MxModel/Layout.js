const MxModelObject = require('./MxModelObject');

class Layout extends MxModelObject {
    constructor(containerID, layoutName, layoutType) {        
        super();
        this.containerID = containerID,
        this.name = layoutName;
        this.layoutType = layoutType;
    }

    static builder(layouts) {
        return layouts.map(m => new Layout(m.containerID, m.name, m.layoutType));
    }

    static parse(doc, container, module) {
        let containerID = container.toString('base64');
        const layoutName = module.name+'.'+doc.Name;
        const layoutType = doc.Content.LayoutType;
                
        return new Layout(containerID,layoutName,layoutType);
    }

}


module.exports = Layout;