const CheckModule = require("./CheckModule");
const pluralize = require('pluralize');

module.exports = class DomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DM1": "Attribute name should not start with the entity name",
            "DM2": "Attribute name should not contain underscores '_'",
            "DM3": "Entity name should be singular",
            "DM4": "Cross-domain association detected"
        };
        this.level = 'domainmodel';
    }

    check = function (model, entity) {
        this.setup(model, entity);
        let ignoreRuleAnnotations = entity.getIgnoreRuleAnnotations();

        if (pluralize.isPlural(entity.name)) {
            this.addErrors("DM3", ignoreRuleAnnotations, `${entity.name}`);
        }
        entity.attrs.forEach(attr => {
            let attrName = attr.name;
            if (attr.type != 'assoc' && attrName.startsWith(entity.name)) {
                this.addErrors("DM1", ignoreRuleAnnotations, `${entity.name}.${attr.name}`);
            }
            if (attr.type != 'assoc' && attrName.includes('_') && !attrName.startsWith('_')) {
                this.addErrors("DM2", ignoreRuleAnnotations, `${entity.name}.${attr.name}`);
            }
            this.checkCrossDomainAssociations(model, entity, attr, ignoreRuleAnnotations);
        })
        return this.errors;
    }

    checkCrossDomainAssociations = function (model, entity, attr, ignoreRuleAnnotations) {
        if (attr.type == 'assoc') {
            if ((attr.childID || attr.childName)  && attr.parentID) {
                let parentEntity = model.findEntity(attr.parentID);
                if (attr.parentID && attr.childName) { // for some silly reason childID is null in cross-domain associations
                    this.addErrors("DM4", ignoreRuleAnnotations, `${entity.name}.${attr.name} = > ${attr.childName}`);    
                }
            }
        }
    }
}