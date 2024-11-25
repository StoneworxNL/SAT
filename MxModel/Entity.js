const Attribute = require("./Attribute");

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
                    let entityName = domainEntity['Name'];
                    let attributes = [];
                    let documentation = domainEntity['Documentation'];
                    let attrs = domainEntity['Attributes'];
                    attrs.forEach(attr => {
                        if (attr['$Type'] && attr['$Type'] === 'DomainModels$Attribute') {
                            let attribute= new Attribute(attr['Name']);
                            attributes.push(attribute);
                        }
                    });
                    domainEntity['AccessRules'].forEach(accessRule=>{
                        if (typeof accessRule === 'object'){
                            let allowedRoles = accessRule['AllowedModuleRoles'].flatMap(allowedModuleRole=>{
                                if (typeof allowedModuleRole === 'string'){
                                    return allowedModuleRole
                                } return [];
                            })
                            accessRule['MemberAccesses'].forEach(memberAccess=>{
                                let rights = memberAccess['AccessRights'];
                                let association = memberAccess['Association'];
                                let attributeQName = memberAccess['Attribute'];
                                if (attributeQName){
                                    let parts = attributeQName.split('.');
                                    let attrName = parts[2]; //Allways 3 long: Module.Entity.Attr
                                    let attribute = this.findAttribute(attributes, attrName);
                                    if (attribute){
                                        allowedRoles.forEach(role =>{
                                            attribute.addAccessRights({role: role, rights: rights })
                                        })
                                    }
                                }
                            })
                        }
                    })
                    let entity = new Entity(containerID, entityName, documentation);
                    entity.attrs = attributes
                    entities.push(entity);
                }
            });
        }
        return entities;
    }

    static findAttribute(attrs, name){
        return attrs.find(attr=> attr.name === name);
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