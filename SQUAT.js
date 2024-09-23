"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
const SquatAnalysis = require("./SquatChecks/SquatAnalysis.js");
const { log } = require("console");

let model = new MxModel();


commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-m, --mpr <pmr file>', 'Path/Filename of the mpr under investigation ')
    .requiredOption('-o, --out <output file>', 'Path/Filenam of the result')
    .parse();

const options = commander.opts();
let outFileName;
main();

function main() {
    let mpr = options.mpr;
    let outFile = options.out;
    let mprCollector = new MPRCollector(mpr);
    console.log("==================================== COLLECTING DATA: " + mpr);

    mprCollector.collect().then((model) => {
        console.log(JSON.stringify(model, null, 2));
        let analysis = new SquatAnalysis();
        console.log("====================== ANALYSING =======================");
        analysis.analyse(model);
        console.log(JSON.stringify(analysis.reportedErrors, null, 2));

    });
}

