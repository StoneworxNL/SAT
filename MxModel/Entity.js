const MxModelObject = require('./MxModelObject');
const Attribute = require("./Attribute");

class Entity extends MxModelObject {
    constructor(containerID, id, entityName, documentation, isPersistent, attrs) {
        super();
        this.containerID = containerID,
        this.id = id;
        this.documentation = documentation;
        this.name = entityName;
        this.isPersistent = isPersistent;
        this.attrs = attrs || [];
    }

    static builder(entities){
        return entities.map(obj => {
            let ent = new Entity(obj.containerID,obj.id,obj.name,obj.documentation,obj.isPersistent);
            ent.attrs = Attribute.builder(obj.attrs);
            return ent;
        });
    }

    static parse(doc, container) {
        let containerID = container.toString('base64');
        let entities = [];
        let domainEntities = Entity.findKey(doc, 'Entities');
        Entity.findKey(doc, 'Associations');
        let associations = Entity.findKey(doc, 'Associations').filter(association => typeof association != 'number');
        let crossAssociations = Entity.findKey(doc, 'CrossAssociations').filter(association => typeof association != 'number');
        associations.splice(0,0, ...crossAssociations);


        if (domainEntities.length > 1) {
            domainEntities.forEach(domainEntity => {
                if (typeof domainEntity != 'number') {
                    let id = domainEntity['$ID'].toString('base64');
                    let entityName = Entity.findKey(domainEntity, 'Name');
                    let attributes = [];
                    let generalization = Entity.findKey(domainEntity,'MaybeGeneralization')|| Entity.findKey(domainEntity,'generalization');
                    let isPersistent = Entity.findKey(generalization,'Persistable');
                    let documentation = Entity.findKey(domainEntity,'Documentation');
                    let attrs = Entity.findKey(domainEntity,'Attributes');
                    attrs.forEach(attr => {
                        if (attr['$Type'] && attr['$Type'] === 'DomainModels$Attribute') {
                            let attribute= new Attribute(Entity.findKey(attr,'Name'), 'attr');
                            attributes.push(attribute);
                        }
                    });
                    associations.forEach(association=>{
                        let parent = association['ParentPointer'] || association['parent'] ;
                        let parentID = parent.toString('base64');
                        if (parentID === id){
                            let attribute= new Attribute(Entity.findKey(association, 'Name'), 'assoc');
                            attributes.push(attribute);
                        }
                    })
                    
                    let accessRules = Entity.findKey(domainEntity, 'AccessRules');
                    accessRules.forEach(accessRule=>{
                        if (typeof accessRule === 'object'){
                            const allowedModuleRoles = accessRule['AllowedModuleRoles'] || accessRule['moduleRoles'];
                            let allowedRoles = allowedModuleRoles.flatMap(allowedModuleRole=>{
                                if (typeof allowedModuleRole === 'string'){
                                    return allowedModuleRole
                                } return [];
                            })
                            let defaultAccesRights = Entity.findKey(accessRule,'DefaultMemberAccessRights');
                            let isCreateAllowed = Entity.findKey(accessRule, 'AllowCreate');
                            let isDeleteAllowed = Entity.findKey(accessRule, 'AllowDelete');
                            let xPath = Entity.findKey(accessRule, 'XPathConstraint').replace(/\n/g, " ");
;
                            let memberAccesses = Entity.findKey(accessRule, 'MemberAccesses');
                            memberAccesses.forEach(memberAccess=>{
                                let rights = Entity.findKey(memberAccess, 'AccessRights');
                                let associationQName = Entity.findKey(memberAccess,'Association');
                                if (associationQName){
                                    let parts = associationQName.split('.');
                                    let attrName = parts[1]; //Allways 2 long: Module.Association Name
                                    let attribute = this.findAttribute(attributes, attrName);
                                    if (attribute){
                                        allowedRoles.forEach(role =>{
                                            attribute.addAccessRights({role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed, xpath: xPath })
                                        })
                                    }
                                }
                                let attributeQName = Entity.findKey(memberAccess, 'Attribute');
                                if (attributeQName){
                                    let parts = attributeQName.split('.');
                                    let attrName = parts[2]; //Allways 3 long: Module.Entity.Attr
                                    let attribute = this.findAttribute(attributes, attrName);
                                    if (attribute){
                                        allowedRoles.forEach(role =>{
                                            attribute.addAccessRights({role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed, xpath: xPath })
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