const Entity = require("./Entity");
const MxEntity = require("../MxModel/Entity");
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
                        let domainEntities = this.parseDomain(domain, moduleName);
                        domains.push(...domainEntities);
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
            let mXEntity = new MxEntity(domain.container.id, entity.name, entity.documentation || '');
            attributes.forEach((attribute) => {
                mXEntity.attrs.push(attribute.name);
            })
            domainEntities.push(mXEntity);

        })
        return domainEntities;
    }
}
