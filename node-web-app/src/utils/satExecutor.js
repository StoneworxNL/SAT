const { execSync } = require('child_process');

function executeSat(program, inputFile, outputFile) {
    let extractCommand;
    let satQOutput = outputFile+'-SATQ';
    let analyseCommand = `node SAT-Q.js -i ${outputFile}_SATL.json -o ${satQOutput}`;
    if (program.toUpperCase() === 'SAT-L') {
        console.log(`Executing SAT-L with input file ${inputFile} and output file ${outputFile}`);   
        process.chdir('..'); 
        extractCommand = `node SAT-L.js -m ${inputFile} -o ${outputFile}`;
    } else if (program.toUpperCase() === 'SAT-C') {
        extractCommand = `sat-c-executable ${inputFile} > ${outputFile}`;
    } else {
        throw new Error('Invalid program specified. Use "SAT-L" or "SAT-C".');
    }

    try {
        execSync(extractCommand);
        execSync(analyseCommand);
        console.log(`${program} executed successfully. Output saved to ${outputFile}`);
    } catch (error) {
        console.error(`Error executing ${program}:`, error.message);
        throw error;
    }
}

module.exports = { executeSat };