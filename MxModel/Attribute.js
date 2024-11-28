class Attribute {
    constructor(name, type) {
        this.name = name;
        this.type = type;
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