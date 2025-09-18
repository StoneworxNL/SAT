const fs = require("fs");
const { BSON, EJSON, ObjectId, UUID } = require('bson');
const sqlite3 = require('sqlite3').verbose();
const MxModel = require("./MxModel/MxModel");

class MPRCollector {
    constructor(mpr, mprFolder) {
        this.mpr = mpr;
        this.mprFolder = mprFolder;
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
                db.get("SELECT _ProductVersion FROM _MetaData", (err, row) => {
                    if (err) {
                        console.log(err.message);
                    } else if (row) {
                        model.productVersion = row._ProductVersion;
                    }
                    // Compare version numbers numerically instead of lexicographically
                    let isLessThan1024 = this.isVersionLessThan(model.productVersion, '10.24');
                    let query = isLessThan1024
                        ? "SELECT UnitID, ContainerID as container, ContainmentName, Contents as contents from Unit"
                        : "SELECT UnitID, ContainerID as container, ContainmentName from Unit";
                    db.each(query, (err, row) => {
                        if (err) {
                            console.log(err.message)
                        };
                        let doc = {};
                        let unitID = MPRCollector.uint8ArrayToUUID(row.UnitID);
                        if (isLessThan1024) {
                            doc = BSON.deserialize(row.contents);                
                        } else {
                            const unitIDStr = unitID.replace(/-/g, '');
                            const xx = unitIDStr.substring(0, 2);
                            const yy = unitIDStr.substring(2, 4);
                            const path = `${this.mprFolder}/mprcontents/${xx}/${yy}/${unitID}.mxunit`;
                            try {
                                const fileContents = fs.readFileSync(path);
                                doc = BSON.deserialize(fileContents);
                            } catch (e) {
                                console.log(`Failed to read file ${path}:`, e.message);
                            }
                        }
                        let container = row.container;
                        let docType = doc['$Type'];
                        let containerID = MPRCollector.uint8ArrayToUUID(container);
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
            });
        })
        db.close();
    }

    isVersionLessThan(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na < nb) return true;
            if (na > nb) return false;
        }
        return false;
    }
}

module.exports = MPRCollector;

