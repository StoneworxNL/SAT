
const fs = require("fs");
const config = require("config");

class SquatReport {
    constructor(reportName) {
        this.reportName = reportName;
    }

    report = function (analysis) {
        let dateTimeString = this.getDateTimeString();
        let reports = analysis.reportedErrors;
        let errorCodes = analysis.errorCodes;
        let folder = config.get("outputFolder");
        this.reportFileName = `${folder}/${this.reportName}_${dateTimeString}.csv`;
        console.log("Writing to " + this.reportFileName);
        fs.writeFileSync(this.reportFileName, 'Module;Microflow;Code;Description;Info\n');
        reports.forEach(item => {
            let theDocument = item.document;
            item.errors.forEach((err) => {
                try {
                    switch (item.type) {
                        case 'app':
                            fs.appendFileSync(this.reportFileName, 'APP;' + theDocument + ';' + err.code + ';' + errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                            break;
                        case 'domainmodel':
                            //let [domainModel, entityName, mfPrefix] = this.nameParts(theDocument)
                            fs.appendFileSync(this.reportFileName, item.module + ';' + theDocument + ';' + err.code + ';' + errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                            break;
                        case 'microflow':
                            fs.appendFileSync(this.reportFileName, item.module + ';' + theDocument + ';' + err.code + ';' + errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                            break;
                        case 'menu':
                            let menuName = item.document;
                            fs.appendFileSync(this.reportFileName, 'Menu' + ';' + theDocument + ';' + err.code + ';' + errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                            break;
                        case 'page':
                            fs.appendFileSync(this.reportFileName, item.module + ';' + theDocument + ';' + err.code + ';' + errorCodes[err.code] + ';' + (err.comment || '') + '\n');
                            break;
                        default:
                            console.log('Cannot determine: ' + item.type);
                    }
                } catch (err) {
                    console.error(err);
                }
            })
        })
    }


    getDateTimeString() {
        let now = new Date();
        let year = now.getFullYear();
        let month = ('00' + (now.getMonth() + 1).toString()).slice(-2);
        let day = ('00' + now.getDate().toString()).slice(-2);
        let hour = ('00' + now.getHours().toString()).slice(-2);
        let minute = ('00' + now.getMinutes().toString()).slice(-2);
        return `${year}${month}${day}_${hour}${minute}`;
    }
}
module.exports = SquatReport;