const { execSync } = require('child_process');
const fs = require('fs');
const config = require('config');
const { log } = require('console');
const workingDir = config.get('workingDir');
const outputFolder = config.get('outputFolder');
const mendixProjects = process.env.MendixProjects || '';
// Now you can use mendixProjects as a local variable in your code

function executeSat(inputFolder, diffFile, doDiff, assessmentType, excludeModules, sdMicroflow, sdPrefixes, outputFile) {
    let extractCommand;
    let satQOutput = outputFile;
    let analyseCommand;
    let excludeModulesFlag = excludeModules ? '-e ' + excludeModules : '';
    let unlinkIt = true;
    if ( !inputFolder || !outputFile) {
        throw new Error('inputFolder and outputFile are mandatory for SAT-L program.');
    }
        inputFile = mendixProjects + "\\" +inputFolder; //pass the folder as input file to SAT-L
        unlinkIt = false;
    console.log(`Executing ${workingDir}/SAT-L with input file ${inputFile} and output file ${outputFile}`);
    extractCommand = `node "${workingDir}/SAT-L.js" -m ${inputFile} -o ${outputFile}`;
    console.log(extractCommand);

    try {
        let outputLink;
        execSync(extractCommand);
        if (assessmentType === 'Q') {
            analyseCommand = `node "${workingDir}/SAT-Q.js" -i ${outputFile}.json -o ${satQOutput}-Q ${excludeModulesFlag}`;
            let resultLog = execSync(analyseCommand);
            outputLink = parseCommandOutput(resultLog);
            if (doDiff) {
                const diffCommand = `node "${workingDir}/SAT-D.js" -1 ${outputFile} -2 ${diffFile} -o ${satQOutput}-D.txt `;
                resultLog = execSync(diffCommand);
                resultString = resultLog.toString();
                let match = resultString.match(/\[outputfile:(.*?)\]/);
                diffResultFile = match ? match[1] : outputFile;
                outputLink = match ? `${outputLink}<br/><a href="${diffResultFile}" download="${diffResultFile}">${diffResultFile}</a>` : diffResultFile;
            }
        }
        if (assessmentType === 'AM') {
            analyseCommand = `node "${workingDir}/SAT-AM.js" -i ${outputFile}.json -o ${satQOutput}-AM ${excludeModulesFlag}`;
            execSync(analyseCommand);
        }
        if (assessmentType === 'SD') {
            analyseCommand = `node "${workingDir}/SAT-SD.js" -i ${outputFile}.json -o ${satQOutput}-${sdMicroflow} -m ${sdMicroflow}  ${excludeModulesFlag}`;
            analyseCommand += (sdPrefixes ? ` -p ${sdPrefixes}` : '');
            let resultLog = execSync(analyseCommand);
            outputLink = parseCommandOutput(resultLog);
        }
        console.log(`SAT executed successfully. Output saved to ${outputFile}`);
        return { "success": true, "outputFile": outputLink };
    } catch (error) {
        console.error(`Error executing ${program}:`, error.message);
        throw error;
    }

    function parseCommandOutput(resultLog) {
        let resultString = resultLog.toString();
        let match = resultString.match(/\[outputfile:(.*?)\]/);
        outputFile = match ? match[1] : outputFile;
        outputLink = match ? `<a href="${outputFile}" download="${outputFile}">${outputFile}</a>` : outputFile;
        return outputLink;
    }
}

module.exports = { executeSat };