const express = require('express');
const router = express.Router();
const SatController = require('../controllers/satController');

const satController = new SatController();

function setRoutes(app) {
    router.get('/', (req, res) => {
        res.render('index');
    });

    router.post('/execute', (req, res) => {
        const { inputFile, outputFile, satType } = req.body;
        console.log(`Executing ${satType} with inputs:`, inputFile);     
        satController.executeSatProgram(satType, inputFile, outputFile)
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