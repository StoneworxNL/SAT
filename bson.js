const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Mendix/Mx106DemoApp-main_2/Mx106DemoApp.mpr');

const MxModel = require("./MxModel/MxModel.js");
let model = new MxModel();

db.serialize(() => {
    db.each("SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit", (err, row) => {
        const doc = BSON.deserialize(row.contents);
        let container = row.container;
        let docType = doc['$Type'];
        switch (docType) {
            case 'Security$ProjectSecurity':
                model.parseSecurity(doc);
                break;
            case 'Projects$ModuleImpl':
                model.parseModule(doc);
                break;
            case 'DomainModels$DomainModel':
                model.parseDomain(doc, container);
                break;
            case 'Microflows$Microflow':
                model.parseMicroflow(doc, container);
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


