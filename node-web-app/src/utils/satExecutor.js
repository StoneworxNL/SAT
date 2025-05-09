const { execSync } = require('child_process');
const fs = require('fs');
const config = require('config');
const workingDir = config.get('workingDir');

function executeSat(program, inputFile, appID, branchName, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes, outputFile) {    
    let extractCommand;
    let satQOutput = outputFile;
    let analyseCommand;
    let excludeModulesFlag = excludeModules ? '-e '+excludeModules : '';
    if (program.toUpperCase() === 'SAT-L') {
        if (!inputFile || !outputFile)  {
            throw new Error('inputFile and outputFile are mandatory for SAT-L program.');
        }
        console.log(`Executing ${workingDir}/SAT-L with input file ${inputFile} and output file ${outputFile}`);
        extractCommand = `node "${workingDir}/SAT-L.js" -m ${inputFile} -o ${outputFile}`;
    } else if (program.toUpperCase() === 'SAT-C') {
        if (!appID || !branchName || !outputFile)  {
            throw new Error('appID, branchName and  and outputFile are mandatory for SAT-C program.');
        }
        let clean = cleanWorkingCopy === 'true' ? '-c' : '';
        extractCommand = `node  "${workingDir}/SAT-C.js" -a ${appID} -b ${branchName} -o ${outputFile} ${clean}`;
    } else {
        throw new Error('Invalid program specified. Use "SAT-L" or "SAT-C".');
    }

    try {
        execSync(extractCommand);
        if (qualityAssessment === 'true') {
            analyseCommand = `node "${workingDir}/SAT-Q.js" -i ${outputFile}.json -o ${satQOutput}-Q ${excludeModulesFlag}`;
            let resultLog = execSync(analyseCommand);
            const resultString = resultLog.toString();
            const match = resultString.match(/\[outputfile:(.*?)\]/);
            outputFile = match ? `<a href="${match[1]}" download>${match[1]}</a>` : outputFile;
        }
        if (authorisationMatrix === 'true') {
            analyseCommand = `node "${workingDir}/SAT-AM.js" -i ${outputFile}.json -o ${satQOutput}-AM ${excludeModulesFlag}`;
            execSync(analyseCommand);
        }
        if (sequenceDiagram === 'true') {
            analyseCommand = `node "${workingDir}/SAT-SD.js" -i ${outputFile}.json -o ${satQOutput}-${sdMicroflow} -m ${sdMicroflow} -p ${sdPrefixes}  ${excludeModulesFlag}`;
            execSync(analyseCommand);
        }
        console.log(`${program} executed successfully. Output saved to ${outputFile}`);
        if (inputFile) {fs.unlinkSync(inputFile)}
        return {"success": true, "outputFile": outputFile};
    } catch (error) {
        console.error(`Error executing ${program}:`, error.message);
        throw error;
    }
}

module.exports = { executeSat };