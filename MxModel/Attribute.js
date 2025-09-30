class Attribute {
    constructor(name, type, parentID, childId, childName) {
        this.name = name;
        this.type = type;
        this.parentID = parentID;
        this.childId =  childId;
        this.childName = childName;
        this.accessRights = [];
    }

    static builder(attributes) {
        return attributes.map(obj => {
            let attr = new Attribute(obj.name, obj.type)
            attr.accessRights = obj.accessRights;
            return attr;
        });
    }

    addAccessRights(accessRight) {
        this.accessRights.push(accessRight)
    }

}

module.exports = Attribute;