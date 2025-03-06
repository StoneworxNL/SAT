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
        const { satType, outputFileSATL, outputFileSATC, appID, brancheName } = req.body;
        const inputFile = req.file;

        console.log(`Executing ${satType} with inputs:`, inputFile.path);
        const outputFile = satType.toUpperCase() === 'SAT-L' ? outputFileSATL : outputFileSATC;

        satController.executeSatProgram(satType, inputFile.path, outputFile)
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