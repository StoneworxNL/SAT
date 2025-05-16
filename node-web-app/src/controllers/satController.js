
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

class SatController {
    constructor() {
        this.satPrograms = ['SAT-L', 'SAT-C'];
    }

    renderHomePage(req, res) {
        res.render('index', { satPrograms: this.satPrograms });
    }


    async executeSatProgram(program, inputFile, appID, branchName, diffFile, doDiff, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes, outputFile) {
        const { executeSat } = require('../utils/satExecutor');
        console.log(`Executing ${program} with input file ${inputFile} and output file ${outputFile}`);
        return await executeSat(program, inputFile, diffFile, doDiff, appID, branchName, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes, outputFile);
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