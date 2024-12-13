"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
const { log } = require("console");

let model = new MxModel();


commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-m, --mpr <pmr file>', 'Path/Filename of the mpr under investigation ')
    .requiredOption('-o, --out <output file>', 'Path/Filenam of the result')
    .parse();
const options = commander.opts();
main();

function main() {
    let mpr = options.mpr;
    let outFile = options.out;
    let folder = config.get("outputFolder");
    let mprCollector = new MPRCollector(mpr);

    mprCollector.collect().then((model) => {
        fs.writeFileSync(folder+'/'+outFile+'.json',JSON.stringify(model, null, 2));
        console.log("====================== Ready =======================");
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
