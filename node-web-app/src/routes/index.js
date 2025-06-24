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

    router.post('/execute', upload.fields([
        { name: 'inputFile', maxCount: 1 }
        , { name: 'diffFile', maxCount: 1 }
    ]), (req, res) => {
        const { satType, outputFile, appID, branchName, doDiff, cleanWorkingCopy, assessmentType, excludeModules, sdMicroflow, sdPrefixes } = req.body;

        const inputFile = req.files?.inputFile ? req.files.inputFile[0].path: null;
        const diffFile = req.files?.diffFile ? req.files.diffFile[0].path : null;


        console.log(`Executing ${satType}`);

        satController.executeSatProgram(satType, inputFile, appID, branchName, diffFile, doDiff, cleanWorkingCopy, assessmentType, excludeModules, sdMicroflow, sdPrefixes, outputFile)
            .then(result => {
                res.json(result);
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    });


    app.use('/', router);
}

module.exports = setRoutes;