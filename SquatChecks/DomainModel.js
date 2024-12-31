const CheckModule = require("./CheckModule");
const pluralize = require('pluralize');

module.exports = class DomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DM1": "Attribute name should not starts with the entity name",
            "DM2": "Attribute name should not contain underscores '_'",
            "DM3": "Entity name should be singular"
        };
        this.level = 'domainmodel';
    }

    check = function (model, entity) {      
        this.setup(model, entity);
        let ignoreRuleAnnotations = entity.getIgnoreRuleAnnotations();
        
        if (pluralize.isPlural(entity.name)){
            this.addErrors("DM3", ignoreRuleAnnotations, `${entity.name}`);
        }
        entity.attrs.forEach(attr => {
            let attrName = attr.name;
            if (attrName.startsWith(entity.name)) {
                this.addErrors("DM1", ignoreRuleAnnotations, `${entity.name}.${attr}`);
            }
            if (attrName.includes('_')) {
                this.addErrors("DM2", ignoreRuleAnnotations, `${entity.name}.${attr}`);
            }
        })
        return this.errors;
    }
}