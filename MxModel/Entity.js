module.exports = class Entity{
    constructor(moduleName, entityName, documentation) {
        this.moduleID = moduleName,
        this.documentation = documentation;
        this.name = entityName;
        this.attrs = [];
    }
}
