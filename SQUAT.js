"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
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
    mprCollector.collect().then((model)=>{
        console.log("DONE: " + JSON.stringify(model, null, 2));
        console.log("WOOOHOO");
    });

    // switch (moduleCode) {
    //     case 'SD':
    //         module = "./analysis/SequenceDiagram";
    //         break
    //     case 'MQ':
    //         module = "./analysis/ModelQuality";
    //         break
    //     default:
    //         console.log("No module specified");
    //         break
    // }
    // const AnalysisModule = require(module);

    // let analysis = new AnalysisModule(appID, excludes, prefixes);

    // wc.loadWorkingCopy(appID, nickname, branch, clear).then(([model, workingCopy]) => {
    //     analysis.collect(model, branch, workingCopy, documentName).then(() => {
    //         analysis.analyse().then(() => {
    //             analysis.report(nickname);
    //             console.log("READY");
    //         }).catch((e) => { console.log(e) });
    //     });
    // }).catch((e) => {
    //     console.log(e.message)
    // });
}

