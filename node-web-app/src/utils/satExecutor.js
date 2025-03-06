const { execSync } = require('child_process');
const fs = require('fs');
const config = require('config');
const workingDir = config.get('workingDir');

function executeSat(program, inputFile, outputFile) {    
    let extractCommand;
    let satQOutput = outputFile + '-SATQ';
    let analyseCommand = `node "${workingDir}/SAT-Q.js" -i ${outputFile}.json -o ${satQOutput}`;
    if (program.toUpperCase() === 'SAT-L') {
        if (!inputFile || !outputFile)  {
            throw new Error('inputFile and outputFile are mandatory for SAT-L program.');
        }
        console.log(`Executing ${workingDir}/SAT-L with input file ${inputFile} and output file ${outputFile}`);
        extractCommand = `node "${workingDir}/SAT-L.js" -m ${inputFile} -o ${outputFile}`;
    } else if (program.toUpperCase() === 'SAT-C') {
        extractCommand = `sat-c-executable ${inputFile} > ${outputFile}`;
    } else {
        throw new Error('Invalid program specified. Use "SAT-L" or "SAT-C".');
    }

    try {
        execSync(extractCommand);
        execSync(analyseCommand);
        console.log(`${program} executed successfully. Output saved to ${outputFile}`);
        fs.unlinkSync(inputFile);
        return {"success": true, "outputFile": outputFile};
    } catch (error) {
        console.error(`Error executing ${program}:`, error.message);
        throw error;
    }
}

module.exports = { executeSat };