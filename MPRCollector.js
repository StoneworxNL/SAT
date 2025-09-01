const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const MxModel = require("./MxModel/MxModel");

class MPRCollector {
    constructor(mpr) {
        this.mpr = mpr;
    }

    static uint8ArrayToUUID(uint8Array) {
        if (!(uint8Array instanceof Uint8Array) || uint8Array.length !== 16) {
            throw new Error("Input must be a Uint8Array of length 16");
        }

        const hex = [...uint8Array].map(b => b.toString(16).padStart(2, '0'));

        // Apply little-endian conversion to the first three fields
        const timeLow = hex.slice(0, 4).reverse().join('');
        const timeMid = hex.slice(4, 6).reverse().join('');
        const timeHiAndVersion = hex.slice(6, 8).reverse().join('');

        // Remaining fields are big-endian
        const clockSeq = hex.slice(8, 10).join('');
        const node = hex.slice(10, 16).join('');

        return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
    }

    collect() {
        const db = new sqlite3.Database(this.mpr);
        let model = new MxModel();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.each("SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit", (err, row) => {
                    if (err) {
                        console.log(err.message)
                    };
                    const doc = BSON.deserialize(row.contents);

                    let container = row.container;
                    let docType = doc['$Type'];                  
                    
                    let containerID = MPRCollector.uint8ArrayToUUID(container);
                    console.log(container + ' ==> ' + containerID + ':  ' + doc['Name']);
                    switch (docType) {
                        case 'Security$ProjectSecurity':
                            model.parseSecurity(doc);
                            break;
                        case 'Navigation$NavigationDocument':
                            model.parseMenus(doc, containerID);
                            break
                        case 'Menus$MenuDocument':
                            model.parseMenu(doc, containerID);
                            break
                        case 'Projects$ModuleImpl':
                            model.parseModule(doc);
                            break;
                        case 'Projects$Project':
                            model.parseModule(doc);
                            break;
                        case 'DomainModels$DomainModel':
                            model.parseDomain(doc, containerID);
                            break;
                        case 'Microflows$Microflow':
                            model.parseMicroflow(doc, containerID);
                            break;
                        case 'Microflows$Rule':
                            model.parseMicroflow(doc, containerID);
                            break;
                        case 'Projects$ModuleSettings':
                            // console.log(JSON.stringify(doc, null, 4));
                            break;
                        case 'Projects$Folder':
                            model.parseFolder(doc, containerID);
                            break;
                        case 'Forms$Page':
                            model.parsePage(doc, containerID);
                            break;
                        case 'Forms$Snippet':
                            model.parsePage(doc, containerID);
                            break;
                        case 'Forms$Layout':
                            model.parseLayout(doc, containerID);
                            break;
                        default:
                            // console.log('Not Implemented: ' + docType);
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

