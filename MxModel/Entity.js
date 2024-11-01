class Entity {
    constructor(containerID, entityName, documentation) {
        this.containerID = containerID,
        this.documentation = documentation;
        this.name = entityName;
        this.attrs = [];
    }

    static parse(doc, container) {
        let containerID = container.toString('base64');
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

    getIgnoreRuleAnnotations() {
        let documentation = this.documentation;
        let ignoreRuleAnnotation = documentation.match(/^@SAT-([A-Z]{2}\d): .*/);
        if (ignoreRuleAnnotation) {
            return [ignoreRuleAnnotation[1]];
        }
        return [];
    }
}

module.exports = Entity;