"use strict";

const fs = require("fs");
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
    .requiredOption('-m, --microflow <microflow>', 'Name of the microflow to parse')
    .option('-e, --exclude <modules>', 'List of modules to exclude from analysis')
    .option('-p, --prefix <prefixes>', 'List of prefixes to aggregate')
    .parse();
const options = commander.opts();
main();

function main() {
    let folder = config.get("outputFolder");
    let inFile = folder+'/'+options.in;
    let outFile = folder+'/'+options.out+'.txt';
    let microflowName = options.microflow;
    let excludes = options.exclude.split(' ');
    let prefixes = options.prefix.split(' ');
    let modelJSON = JSON.parse(fs.readFileSync(inFile, 'utf8'));
    let model = MxModel.builder(modelJSON);
    
    let analysis = new SequenceDiagram(model, excludes, prefixes, outFile);
//    let reporter = new SquatReport(outFile);
    analysis.analyse(model, microflowName);
    
    console.log("====================== REPORTING =======================");
    analysis.report(outFile);

}