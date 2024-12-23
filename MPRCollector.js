const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const MxModel = require("./MxModel/MxModel");

class MPRCollector {
    constructor(mpr) {
        this.mpr = mpr;
    }

    collect() {
        const db = new sqlite3.Database(this.mpr);
        let model = new MxModel();
        console.log("FOOBAR");
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.each("SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit", (err, row) => {
                    if (err) {
                        console.log(err.message)
                    };
                    const doc = BSON.deserialize(row.contents);
                    let container = row.container;
                    let docType = doc['$Type'];


                    let containerID = container.toString('base64');
                    switch (docType) {
                        case 'Security$ProjectSecurity':
                            model.parseSecurity(doc);
                            break;
                        case 'Navigation$NavigationDocument':
                            model.parseMenus(doc, container);
                            break
                        case 'Menus$MenuDocument':
                            model.parseMenu(doc, container);
                            break
                        case 'Projects$ModuleImpl':
                            model.parseModule(doc);
                            break;
                        case 'Projects$Project':
                            model.parseModule(doc);
                            break;
                        case 'DomainModels$DomainModel':
                            model.parseDomain(doc, container);
                            break;
                        case 'Microflows$Microflow':
                            model.parseMicroflow(doc, container);
                            break;
                        case 'Projects$ModuleSettings':
                            // console.log(JSON.stringify(doc, null, 4));
                            break;
                        case 'Projects$Folder':
                            model.parseFolder(doc, container);
                            break;
                        case 'Forms$Page':
                            model.parsePage(doc, container);
                            break;
                        default:
                            //console.log('Not Implemented: '+docType);                
                            break;
                    }
                }, () => {

                    resolve(model);
                });
            });
            db.close();
        })
    }
}

module.exports = MPRCollector;

