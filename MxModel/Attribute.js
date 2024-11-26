class Attribute {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.accessRights = [];
    }

    addAccessRights(accessRight){
        this.accessRights.push(accessRight)
    }

}

module.exports = Attribute;