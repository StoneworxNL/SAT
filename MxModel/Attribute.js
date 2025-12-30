class Attribute {
    constructor(name, type, parentID, childID, childName) {
        this.name = name;
        this.type = type;
        this.parentID = parentID;
        this.childID =  childID;
        this.childName = childName;
        this.accessRights = [];
    }

    static builder(attributes) {
        return attributes.map(obj => {
            let attr = new Attribute(obj.name, obj.type, obj.parentID, obj.childID, obj.childName);
            attr.accessRights = obj.accessRights;
            return attr;
        });
    }

    addAccessRights(accessRight) {
        this.accessRights.push(accessRight)
    }

}

module.exports = Attribute;