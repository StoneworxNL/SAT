const Attribute = require("./Attribute");

class Entity {
    constructor(containerID, id, entityName, documentation, isPersistent) {
        this.containerID = containerID,
        this.id = id;
        this.documentation = documentation;
        this.name = entityName;
        this.isPersistent = isPersistent;
        this.attrs = [];
    }

    static parse(doc, container) {
        let containerID = container.toString('base64');
        let entities = [];
        let domainEntities = doc['Entities'];
        let associations = doc['Associations'].filter(association => typeof association != 'number');
        let crossAssociations = doc['CrossAssociations'].filter(association => typeof association != 'number');
        associations.splice(0,0, ...crossAssociations);


        if (domainEntities.length > 1) {
            domainEntities.forEach(domainEntity => {
                if (typeof domainEntity != 'number') {
                    let id = domainEntity['$ID'].toString('base64');
                    let entityName = domainEntity['Name'];
                    let attributes = [];
                    let isPersistent = domainEntity['MaybeGeneralization']['Persistable'];
                    let documentation = domainEntity['Documentation'];
                    let attrs = domainEntity['Attributes'];
                    attrs.forEach(attr => {
                        if (attr['$Type'] && attr['$Type'] === 'DomainModels$Attribute') {
                            let attribute= new Attribute(attr['Name']);
                            attributes.push(attribute);
                        }
                    });
                    associations.forEach(association=>{
                        let parentID = association['ParentPointer'].toString('base64');
                        if (parentID === id){
                            let attribute= new Attribute(association['Name']);
                            attributes.push(attribute);
                        }
                    })
                    
                    domainEntity['AccessRules'].forEach(accessRule=>{
                        if (typeof accessRule === 'object'){
                            let allowedRoles = accessRule['AllowedModuleRoles'].flatMap(allowedModuleRole=>{
                                if (typeof allowedModuleRole === 'string'){
                                    return allowedModuleRole
                                } return [];
                            })
                            let defaultAccesRights = accessRule['DefaultMemberAccessRights'];
                            let isCreateAllowed = accessRule['AllowCreate'];
                            let isDeleteAllowed = accessRule['AllowDelete'];
                            accessRule['MemberAccesses'].forEach(memberAccess=>{
                                let rights = memberAccess['AccessRights'];
                                let associationQName = memberAccess['Association'];
                                if (associationQName){
                                    let parts = associationQName.split('.');
                                    let attrName = parts[1]; //Allways 2 long: Module.Association Name
                                    let attribute = this.findAttribute(attributes, attrName);
                                    if (attribute){
                                        allowedRoles.forEach(role =>{
                                            attribute.addAccessRights({role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed })
                                        })
                                    }
                                }
                                let attributeQName = memberAccess['Attribute'];
                                if (attributeQName){
                                    let parts = attributeQName.split('.');
                                    let attrName = parts[2]; //Allways 3 long: Module.Entity.Attr
                                    let attribute = this.findAttribute(attributes, attrName);
                                    if (attribute){
                                        allowedRoles.forEach(role =>{
                                            attribute.addAccessRights({role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed })
                                        })
                                    }
                                }
                            })
                        }
                    })
                    let entity = new Entity(containerID, id, entityName, documentation, isPersistent);
                    entity.attrs = attributes;
                   
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