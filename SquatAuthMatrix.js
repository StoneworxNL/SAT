"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
const SquatAnalysis = require("./SquatChecks/SquatAnalysis.js");
const SquatReport = require("./SquatReport.js");
const { log } = require("console");




commander
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-i, --in <model json>', 'Path/Filename of the model json file ')
    .requiredOption('-o, --out <output file>', 'Path/Filenam of the result')
    .parse();
const options = commander.opts();

main();

function main() {
    let inFile = options.in;
    let outFile = options.out;
    let report='module;entity;attribute;role;rights\n';
    let modelJSON = JSON.parse(fs.readFileSync(inFile, 'utf8'));
    let model = new MxModel(modelJSON);
    model.entities.forEach(entity=>{
        let module = model.getModule(entity.containerID);
        let attributes = entity.attrs;
        attributes.forEach(attribute=>{
            let rights = attribute.accessRights;
            rights.forEach(right=>{
                let roleParts = right.role.split('.');
                let role = roleParts[1];
                let appRoles = model.findAppRolesByModuleRole(right.role).flatMap(appRole => appRole.name);
                let appRoleInfo = (appRoles? ' ['+appRoles.join('/')+']':'');
                //report += (`${module.name};${entity.name};${attribute.name};${role}${appRoleInfo};${right.rights}\n`);
                appRoles.forEach(appRole=> 
                    report += (`${module.name};${entity.name};${attribute.name};${appRole};${right.rights}\n`)
                )
            })

        })
        
    })    
    fs.writeFileSync(outFile, report);
    
}


