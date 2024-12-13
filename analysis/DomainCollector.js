const Entity = require("./Entity");
const MxEntity = require("../MxModel/Entity");
const MxAttribute = require('../MxModel/Attribute');
module.exports = class DomainCollector {
    constructor(modelQuality) {
        this.modelQuality = modelQuality;
    }

    collect(promises, domains) {
        let modelQuality = this.modelQuality;
        let domainModels = modelQuality.model.allDomainModels();
        domainModels.forEach((domainIF) => {
            promises.push(new Promise((resolve, reject) => {
                let moduleName = modelQuality.getModuleName(domainIF);
                let excludeThis = false;
                if (this.excludes) {
                    excludeThis = modelQuality.excludes.find((exclude) => { return exclude === moduleName });
                }
                if (!excludeThis) {
                    domainIF.load().then((domain) => {
                        //let domainEntities = this.parseDomain(domain, moduleName);
                        //domains.push(...domainEntities);
                        let mXDomainEntities = this.parseMXDomain(domain);
                        this.modelQuality.MxModel.entities.push(...mXDomainEntities);
                        resolve();
                    });
                } else { resolve() };
            }))
        });
    }

    parseDomain = function (domain, moduleName) {
        let entities = domain.entities;
        let domainEntities = [];
        entities.forEach((entity) => {

            let attributes = entity.attributes;
            let entityData = new Entity(moduleName, entity.name, entity.documentation || '')
            attributes.forEach((attribute) => {
                entityData.attrs.push(attribute.name);
            })
            domainEntities.push(entityData);

        })
        return domainEntities;
    }

    parseMXDomain = function (domain) {
        let entities = domain.entities;
        let domainEntities = [];
        entities.forEach((entity) => {
            let attributes = entity.attributes;
            let associations = domain['associations'].filter(association => typeof association != 'number');
            let crossAssociations = domain['crossAssociations'].filter(association => typeof association != 'number');
            associations.splice(0, 0, ...crossAssociations);
            let mXEntity = new MxEntity(domain.container.id, entity.id, entity.name, entity.documentation || '',);
            attributes.forEach((attribute) => {
                let mXAttribute = new MxAttribute(attribute['name'], 'attr');
                mXEntity.attrs.push(mXAttribute);
            })

            associations.forEach(association => {
                let parentEnt = association['parent'];
                if (parentEnt.id === entity.id) {
                    let mXAttribute = new MxAttribute(association['name'], 'assoc');
                    mXEntity.attrs.push(mXAttribute);
                }
            })

            entity['accessRules'].forEach(accessRule => {
                //                            if (typeof accessRule === 'object'){
                let allowedRoles = accessRule['moduleRoles'].flatMap(allowedModuleRole => {
                    //                    if (typeof allowedModuleRole === 'string') {
                    return allowedModuleRole.qualifiedName;
                    //                    } return [];
                })
                let defaultAccesRights = accessRule['defaultMemberAccessRights'].name;
                let isCreateAllowed = accessRule['allowCreate'];
                let isDeleteAllowed = accessRule['allowDelete'];
                let xPath = accessRule['xPathConstraint'].replace(/\n/g, " ");
                accessRule['memberAccesses'].forEach(memberAccess => {
                    let rights = memberAccess['accessRights'].name;
                    let association = memberAccess['association'];
                    if (association) {
                        let associationQName = association.qualifiedName;
                        let parts = associationQName.split('.');
                        let attrName = parts[1]; //Allways 2 long: Module.Association Name
                        let attribute = this.findAttribute(mXEntity, attrName);
                        if (attribute) {
                            allowedRoles.forEach(role => {
                                attribute.addAccessRights({ role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed, xpath: xPath })
                            })
                        }
                    }
                    let attribute = memberAccess['attribute'];
                    if (attribute) {
                        let attributeQName = attribute.qualifiedName;
                        let parts = attributeQName.split('.');
                        let attrName = parts[2]; //Allways 3 long: Module.Entity.Attr
                        let mxAttribute = this.findAttribute(mXEntity, attrName);
                        if (mxAttribute) {
                            allowedRoles.forEach(role => {
                                mxAttribute.addAccessRights({ role: role, rights: rights, defaults: defaultAccesRights, create: isCreateAllowed, delete: isDeleteAllowed, xpath: xPath })
                            })
                        }
                    }
                })
            })
            domainEntities.push(mXEntity);
        })
        return domainEntities;
    }

    findAttribute = function(mxEntity, name){
        return mxEntity.attrs.find(attr=> attr.name === name);
    }
}


