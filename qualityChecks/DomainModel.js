const CheckModule = require("./CheckModule");

module.exports = class DomainModel extends CheckModule {
    constructor(options) {
        super(options);
        this.errorCodes = {
            "DM1": "Attribute name that starts with entity"
        };
        this.level = 'domainmodel';
    }

    check = function (mfQuality, entity) {
        let errors = [];

        let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(entity);
        entity.attrs.forEach(attr => {
            if (attr.startsWith(entity.name)) {
                this.addErrors(errors, "DM1", ignoreRuleAnnotations, `${entity.name}.${attr}`);
            }
        })

        // let allowedJava = this.options.allowedJava;
        // let mfActions = mfQuality.hierarchy[microflow].actions;
        // let java = mfActions.find((action) => {
        //     return action.type == 'Microflows$JavaActionCallAction'
        // })
        // if (java) {
        //     let mf = mfQuality.hierarchy[microflow].mf;
        //     let mfObjects = mf.objectCollection.objects;
        //     let ignoreRuleAnnotations = mfQuality.getIgnoreRuleAnnotations(microflow);
        //     mfObjects.forEach((mfObject) => {
        //         if (mfObject.structureTypeName === 'Microflows$ActionActivity') {
        //             let json = mfObject.toJSON();
        //             if (json.action.$Type === 'Microflows$JavaActionCallAction') {
        //                 let javaAction = json.action.javaAction;
        //                 let isAllowed = allowedJava.find((allowedJavaName)=> allowedJavaName === javaAction);
        //                 if (!isAllowed){
        //                     let errorHandling = json.action.errorHandlingType;
        //                     if (!(errorHandling.startsWith('Custom'))) {
        //                         this.addErrors(errors, "EH1", ignoreRuleAnnotations);
        //                     }
        //                 }
        //             }
        //         }
        //     })
        // }
        return errors;
    }
}