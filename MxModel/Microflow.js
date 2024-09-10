module.exports = class Microflow{
    constructor(moduleName, entityName, documentation) {
        this.moduleID = moduleName,
        this.documentation = documentation;
        this.name = entityName;
        this.flows = [];
        this.actions = [];
    }
}
