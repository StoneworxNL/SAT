"use strict";

const fs = require("fs");
const { log } = require("console");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const PlaywrightBuilder = require("./SAT-UI/PlaywrightBuilder.js");

commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-i, --in <model json>', 'Path/Filename of the model json file ')
    .requiredOption('-o, --out <output path>', 'Path where the resulting files are written')
    .option('-e, --exclude <modules>', 'List of modules to exclude from analysis')
    .parse();
const options = commander.opts();

main();

function main() {
    let inFile = options.in;
    let outPath = options.out;
    let modelJSON = JSON.parse(fs.readFileSync(inFile, 'utf8'));
    //let model = MxModel.builder(modelJSON);    
    let builder = new PlaywrightBuilder(modelJSON, outPath);

    console.log("====================== WRITING FILES =======================");
    builder.report();    
}
