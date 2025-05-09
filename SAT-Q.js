"use strict";

const fs = require("fs");
const { log } = require("console");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const Quality = require("./SAT-Analysis/Quality.js");
const QualityReport = require("./SAT-Analysis/QualityReport.js");

commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-i, --in <model json>', 'Path/Filename of the model json file ')
    .requiredOption('-o, --out <output file>', 'Path/Filenam of the result')
    .option('-e, --exclude <modules>', 'List of modules to exclude from analysis')
    .parse();
const options = commander.opts();

main();

function main() {
    let inFile = options.in;
    let outFile = options.out;
    let excludes;
    if (options.exclude) {excludes = options.exclude.split(' ');}
    let folder = config.get("outputFolder");
    let modelJSON = JSON.parse(fs.readFileSync(folder+'/'+inFile, 'utf8'));
    let model = MxModel.builder(modelJSON);
    
    let analysis = new Quality(model, excludes);
    let reporter = new QualityReport(outFile);
    console.log("====================== ANALYSING =======================");
    analysis.analyse(model);
    console.log("====================== REPORTING =======================");
    reporter.report(analysis);    
}
