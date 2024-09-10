const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Mendix/Mx106DemoApp-main_2/Mx106DemoApp.mpr');

const MxModel = require("./MxModel/MxModel");
const Module = require("./MxModel/Module");
const Entity = require("./MxModel/Entity");
const Microflow = require("./MxModel/Microflow");
let model = new MxModel();

db.serialize(() => {
    db.each("SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit", (err, row) => {
        const doc = BSON.deserialize(row.contents);
        let container = row.container;
        let docType = doc['$Type'];
        switch (docType) {
            case 'Security$ProjectSecurity':
                parseSecurity(doc);
                break;
            case 'DomainModels$DomainModel':
                parseDomain(doc, container);
                break;
            case 'Microflows$Microflow':
                parseMicroflow(doc, container);
                break;
            case 'Projects$ModuleImpl':
                parseModules(doc);
                break;
            case 'Projects$ModuleSettings':
            //                console.log(JSON.stringify(doc, null, 4));

            default:
                //console.log('Not Implemented: '+docType);                
                break;
        }
    }, () => {
        console.log("DONE: " + JSON.stringify(model, null, 2));
    });
});
db.close();

function parseSecurity(doc) {
    model.security = { 'enableDemoUsers': doc['EnableDemoUsers'] };
}

function parseModules(doc) {
    let moduleName = doc['Name'];
    let moduleID = doc['$ID'].toString('base64');
    let appStore = doc['FromAppStore'];
    let newModule = new Module(moduleID, moduleName, appStore)
    let modules = model.modules;
    modules.push(newModule);
}

function parseDomain(doc, container) {
    let containerID = container.toString('base64');
    console.log(`Domain for: ${containerID}`);
    let domainEntities = doc['Entities'];
    if (domainEntities.length > 1) {
        domainEntities.forEach(domainEntity => {
            if (typeof domainEntity != 'number') {
                let attributes = [];
                let entityName = domainEntity['Name'];
                let documentation = domainEntity['Documentation'];
                let attrs = domainEntity['Attributes'];
                attrs.forEach(attr =>{
                    if (attr['$Type'] && attr['$Type']==='DomainModels$Attribute'){
                        attributes.push(attr['Name']);
                    }
                });
                let entity = new Entity(containerID, entityName, documentation);
                entity.attrs = attributes
                model.domain.push(entity);
            }
        });
    }
}


function parseMicroflow(doc, container) {
    let containerID = container.toString('base64');
    let microflowName = doc['Name'];
    console.log(`Microflow ${microflowName} in: ${containerID}`);
    let flows = doc['Flows'];
    let actions = doc['ObjectCollection']['Objects'];
    flows.forEach(flow =>{
        if (flow['$Type'] && flow['$Type'] ==='Microflows$SequenceFlow'){
            console.log('FLOW');
            console.log(JSON.stringify(flow, null, 2));            
        }
    })
    actions.forEach(action => {
        if (action['$Type']){
            let actionID = action['$ID'].toString('base64');
            let actionType = action['$Type'];
            console.log(`${actionType);
            switch (actionType){
                case 'Microflows$LoopedActivity':
                    console.log(JSON.stringify(action, null, 2));
                    
                    break;
                default:

            }
        }
    })

}
