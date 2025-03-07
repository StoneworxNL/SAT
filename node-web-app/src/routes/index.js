const express = require('express');
const multer = require('multer');
const router = express.Router();
const SatController = require('../controllers/satController');

const upload = multer({ dest: 'uploads/' });
const satController = new SatController();

function setRoutes(app) {
    router.get('/', (req, res) => {
        res.render('index');
    });

    router.post('/execute', upload.single('inputFile'), (req, res) => {
        const { satType, outputFile, appID, branchName, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes } = req.body;
        const inputFile = req.file.path;

        console.log(`Executing ${satType}`);

        satController.executeSatProgram(satType, inputFile, appID, branchName, cleanWorkingCopy, qualityAssessment, authorisationMatrix, sequenceDiagram, excludeModules, sdMicroflow, sdPrefixes, outputFile)
            .then(result =>  {
                res.json(result);
            })           
            .catch(err => { 
                res.status(500).json({ error: err.message });
            });
    });


    app.use('/', router);
}

module.exports = setRoutes;