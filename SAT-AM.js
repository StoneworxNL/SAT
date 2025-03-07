"use strict";

const fs = require("fs");
const config = require("config");
const { program: commander } = require('commander');

const MxModel = require("./MxModel/MxModel.js");
const MPRCollector = require("./MPRCollector.js")
const SquatAnalysis = require("./SAT-Analysis/Quality.js");
const SquatReport = require("./SAT-Analysis/QualityReport.js");
const { log } = require("console");




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
    let includeAppstore = config.get("includeAppstore");

    let folder = config.get("outputFolder");
    let modelJSON = JSON.parse(fs.readFileSync(folder+'/'+inFile, 'utf8'));
    let model = MxModel.builder(modelJSON);
    let dateTimeString = getDateTimeString();
    let reportFileName = `${folder}/${outFile}_${dateTimeString}.csv`;
    
    let report='module;fromAppstore;entity;persistent;attribute;type;app role;module role;rights;defaults;create;delete;xpath\n';
    model.entities.forEach(entity=>{
        let excludeModule;
        let module = model.getModule(entity.containerID);
        if(!module){module = {'fromAppStore': false};}
        if (excludes) {
            excludeModule = excludes.find(exclude => exclude === module.name);
        }   
        if (!excludeModule) {
            if (includeAppstore || !module.fromAppStore) {
                let attributes = entity.attrs;
                attributes.forEach(attribute=>{
                    let rights = attribute.accessRights;
                    rights.forEach(right=>{
                        let roleParts = right.role.split('.');
                        let role = roleParts[1];
                        let appRoles = model.findAppRolesByModuleRole(right.role).flatMap(appRole => appRole.name);
                        let appRoleInfo = (appRoles? ' ['+appRoles.join('/')+']':'');
                        //report += (`${module.name};${entity.name};${entity.isPersistent};${attribute.name};${role}${appRoleInfo};${right.rights}\n`);
                        appRoles.forEach(appRole=> 
                            report += (`${module.name};${module.fromAppStore};${entity.name};${entity.isPersistent};${attribute.name};${attribute.type};${appRole};${role};${right.rights};${right.defaults};${right.create};${right.delete};${right.xpath}\n`)
                        )
                    })
                })
            }
        }
        
    })    
    fs.writeFileSync(reportFileName, report);
    
}

function getDateTimeString() {
    let now = new Date();
    let year = now.getFullYear();
    let month = ('00' + (now.getMonth() + 1).toString()).slice(-2);
    let day = ('00' + now.getDate().toString()).slice(-2);
    let hour = ('00' + now.getHours().toString()).slice(-2);
    let minute = ('00' + now.getMinutes().toString()).slice(-2);
    return `${year}${month}${day}_${hour}${minute}`;
}

