module.exports = class Entity{
    constructor(moduleName, entityName, documentation) {
        this.module = moduleName,
        this.documentation = documentation;
        this.name = entityName;
        this.attrs = [];
    }
}
