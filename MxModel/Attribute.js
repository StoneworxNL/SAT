class Attribute {
    constructor(name) {
        this.name = name;
        this.accessRights = [];
    }

    addAccessRights(accessRight){
        this.accessRights.push(accessRight)
    }

}

module.exports = Attribute;