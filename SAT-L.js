"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
const SquatAnalysis = require("./SquatChecks/SquatAnalysis.js");
const SquatReport = require("./SquatReport.js");
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
    // let analysis = new SquatAnalysis();
    // let reporter = new SquatReport(outFile);
    // console.log("==================================== COLLECTING DATA: " + mpr);

    mprCollector.collect().then((model) => {
        fs.writeFileSync(folder+'/'+outFile+'.json',JSON.stringify(model, null, 2));
        console.log("====================== Ready =======================");
    });
}

