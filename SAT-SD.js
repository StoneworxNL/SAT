"use strict";

const fs = require("fs");
const { log } = require("console");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const SequenceDiagram = require("./SAT-SD/SequenceDiagram.js");
const SquatReport = require("./SquatReport.js");

commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-i, --in <model json>', 'Path/Filename of the model json file ')
    .requiredOption('-o, --out <output file>', 'Path/Filenam of the result')
    .requiredOption('-m, --microflow <microflow>, Name of the microflow to parse')
    .parse();
const options = commander.opts();

main();

function main() {
    let inFile = options.in;
    let outFile = options.out;
    let folder = config.get("outputFolder");
    
    let analysis = new SequenceDiagram();
    let reporter = new SquatReport(outFile);
    let modelJSON = JSON.parse(fs.readFileSync(folder+'/'+inFile, 'utf8'));
    let model = MxModel.builder(modelJSON);
    console.log("====================== REPORTING =======================");
    reporter.report(analysis);

}
