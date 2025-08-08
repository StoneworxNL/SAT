"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');
const { OnlineWorkingCopy } = require("mendixplatformsdk");
const AdmZip = require("adm-zip");

var wc = require('./mxworkingcopy');
const AnalysisModule = require("./analysis/ModelQuality");

// Usage: node app.js --help for help

commander
    .version('1.5.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-a, --appid <appid>', 'AppID of the mendix project')
    .requiredOption('-b, --branch <branch name>', 'Branch of the mendix project')
    .requiredOption('-o, --out <output file>', 'Filenam of the result')
    .option('-c, --clear', 'Clear workingcopy')
    .parse();

const options = commander.opts();
let outFileName;
var appID = "";
var branch = "";
var clear;
main();

function commaSeparatedList(value) {
    return value.split(',');
}

function main() {
    appID = options.appid;
    branch = options.branch;
    outFileName = options.out;
    clear = options.clear ? options.clear : false;
    let folder = config.get("outputFolder");

    let analysis = new AnalysisModule(appID);
    let targetfileEntry = '';

    wc.loadWorkingCopy(appID, branch, clear).then(([model, workingCopy]) => {
        model.exportMpk(folder+'/temp_model.mpk').then((exportMpkResponse) => {
            // reading archives
            var zip = new AdmZip(folder+'/temp_model.mpk');
            var zipEntries = zip.getEntries(); // an array of ZipEntry records - add password parameter if entries are password protected


            zipEntries.forEach(function (zipEntry) {                

                if (zipEntry.entryName.endsWith('.mpr')) {
                    targetfileEntry = zipEntry.entryName;
                }
            });


            // extracts the specified file to the specified location
            zip.extractEntryTo(/*entry name*/ targetfileEntry, /*target path*/ folder+'/', /*maintainEntryPath*/ false, /*overwrite*/ true);
        });
    }).catch((e) => {
        console.log(e.message)
    }); 
}



function getDateTimeString(){
    let now = new  Date();
    let year = now.getFullYear();
    let month = ('00'+(now.getMonth()+1).toString()).slice(-2);
    let day = ('00'+now.getDate().toString()).slice(-2);
    let hour = ('00'+ now.getHours().toString()).slice(-2);
    let minute = ('00'+now.getMinutes().toString()).slice(-2);
    return `${year}${month}${day}_${hour}${minute}`;
}