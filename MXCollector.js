const { BSON, EJSON, ObjectId, UUID } = require('bson');
const fs = require("fs");
const config = require("config");
const MxModel = require("./MxModel/MxModel");
let folder = config.get("outputFolder");

class MXCollector {
    constructor(mx) {
        this.mx = mx;
    }

    collect() {
        let mxJSON = JSON.parse(fs.readFileSync(folder + '/' + this.mx, 'utf8'));
        let model = new MxModel();
        return new Promise((resolve, reject) => {
            let units = mxJSON.units;
            units.forEach(doc => {
                let docType = doc['$Type'];
                console.log(docType);
                let container = doc['$ContainerID'];
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
                    case 'Projects$Module':
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
                    case 'Microflows$Rule':
                        model.parseMicroflow(doc, container);
                        break;
                    case 'Projects$ModuleSettings':
                        // console.log(JSON.stringify(doc, null, 4));
                        break;
                    case 'Projects$Folder':
                        model.parseFolder(doc, container);
                        break;
                    case 'Forms$Page':
                    case 'Pages$Page':                        
                        model.parsePage(doc, container);
                        break;
                    default:
                        console.log('Not Implemented: ' + docType);
                        break;
                }

            })
            // const doc = BSON.deserialize(row.contents);
            // let container = row.container;

            resolve(model);

        });
    };

}

module.exports = MXCollector;

