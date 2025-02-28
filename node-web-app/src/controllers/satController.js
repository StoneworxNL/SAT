class SatController {
    constructor() {
        this.satPrograms = ['SAT-L', 'SAT-C'];
    }

    renderHomePage(req, res) {
        res.render('index', { satPrograms: this.satPrograms });
    }

    async executeSat(req, res) {
        const { program, inputFile, outputFile } = req.body;

        if (!this.satPrograms.includes(program)) {
            return res.status(400).send('Invalid SAT program selected.');
        }

        try {
            const result = await this.executeSatProgram(program, inputFile, outputFile);
            res.json({ message: 'Execution successful', result });
        } catch (error) {
            res.status(500).send('Error executing SAT program: ' + error.message);
        }
    }

    async executeSatProgram(program, inputFile, outputFile) {
        const { executeSat } = require('../utils/satExecutor');
        console.log(`Executing ${program} with input file ${inputFile} and output file ${outputFile}`);                
        return await executeSat(program, inputFile, outputFile);
    }

    async processResult(req, res) {
        const { resultFile } = req.body;

        try {
            const processedData = await this.processResultFile(resultFile);
            res.json({ message: 'Processing successful', data: processedData });
        } catch (error) {
            res.status(500).send('Error processing result file: ' + error.message);
        }
    }

    async processResultFile(resultFile) {
        const { processResult } = require('../utils/satProcessor');
        return await processResult(resultFile);
    }
}

module.exports = SatController;