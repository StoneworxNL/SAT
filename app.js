"use strict";

const fs = require("fs");

const { program: commander } = require('commander');
var wc = require('./mxworkingcopy');

// Usage: node app.js --help for help

commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-n, --nickname <nickname>', 'Nickname under which data is stored')
    .requiredOption('-d, --documentName <document>', 'Qualified name of document to analyse.')
    .requiredOption('-a, --appid <appid>', 'AppID of the mendix project')
    .requiredOption('-b, --branch <branch name>', 'Branch of the mendix project')
    .requiredOption('-m, --module <module name', 'Analysis module to use: SD=sequence Diagram,')
    .option('-e, --excludes [exclude....]', 'Modules to exclude from analysis', commaSeparatedList)
    .option('-p, --prefixes [prefix...]', 'Prefixes to aggregate as one', commaSeparatedList)
    .parse();

const options = commander.opts();
let outFileName;
var appID = "";
var branch = "";
var excludes;
var prefixes;
var moduleCode;
main();

function commaSeparatedList(value) {
    return value.split(',');
}

function main() {
    const nickname = options.nickname;
    const documentName = options.documentName;
    appID = options.appid;
    branch = options.branch;
    excludes = options.excludes ? options.excludes : undefined;
    prefixes = options.prefixes ? options.prefixes : undefined;
    moduleCode = options.module ? options.module : 'SD';

    switch (moduleCode){
        case 'SD': 
            module = "./analysis/SequenceDiagram";
            break
        case 'MQ': 
            module = "./analysis/MicroflowQuality";
            break
        default:
            console.log("No module specified");
            break
    }
    const AnalysisModule = require(module);
    
    outFileName = nickname + '_analysis.txt';
    let analysis = new AnalysisModule(excludes, prefixes, outFileName);
    wc.loadWorkingCopy(appID, nickname, branch).then((model) => {
        analysis.analyse(model, documentName).then(() => {
            fs.writeFile(outFileName, '', function (err) {
                if (err) throw err;
                console.log('File is created successfully.');
            });
            analysis.report();
        });
    });
}

