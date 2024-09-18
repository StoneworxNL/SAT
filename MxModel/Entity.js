class Entity{
    constructor(moduleName, entityName, documentation) {
        this.moduleID = moduleName,
        this.documentation = documentation;
        this.name = entityName;
        this.attrs = [];
    }

   static parse(doc, container) {
        let containerID = container.toString('base64');
        console.log(`Domain for: ${containerID}`);
        let entities = [];
        let domainEntities = doc['Entities'];
        if (domainEntities.length > 1) {
            domainEntities.forEach(domainEntity => {
                if (typeof domainEntity != 'number') {
                    let attributes = [];
                    let entityName = domainEntity['Name'];
                    let documentation = domainEntity['Documentation'];
                    let attrs = domainEntity['Attributes'];
                    attrs.forEach(attr => {
                        if (attr['$Type'] && attr['$Type'] === 'DomainModels$Attribute') {
                            attributes.push(attr['Name']);
                        }
                    });
                    let entity = new Entity(containerID, entityName, documentation);
                    entity.attrs = attributes
                    entities.push(entity);
                }
            });
        }
        return entities;
    }
}

module.exports = Entity;