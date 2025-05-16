const { execSync } = require('child_process');
const fs = require('fs');
const config = require('config');
const { log } = require('console');
const workingDir = config.get('workingDir');

function executeSat(program, inputFile, diffFile, doDiff, appID, branchName, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes, outputFile) {    
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
            let resultString = resultLog.toString();
            let match = resultString.match(/\[outputfile:(.*?)\]/);
            outputFile = match ? match[1] : outputFile;
            outputLink = match ? `<a href="${outputFile}" download="${outputFile}">${outputFile}</a>` : outputFile;
            if (doDiff) {
                const diffCommand = `node "${workingDir}/SAT-D.js" -1 ${outputFile} -2 ${diffFile} -o ${satQOutput}-D.txt `;
                resultLog = execSync(diffCommand);  
                resultString = resultLog.toString();
                let match = resultString.match(/\[outputfile:(.*?)\]/);
                diffResultFile = match ? match[1] : outputFile;
                outputLink = match ? `${outputLink}<br/><a href="${diffResultFile}" download="${diffResultFile}">${diffResultFile}</a>` : diffResultFile;
            }
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
        return {"success": true, "outputFile": outputLink};
    } catch (error) {
        console.error(`Error executing ${program}:`, error.message);
        throw error;
    }
}

module.exports = { executeSat };