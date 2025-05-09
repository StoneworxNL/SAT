const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const SatController = require('./controllers/satController');
const setRoutes = require('./routes/index');


const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


setRoutes(app);

app.get('/', (req, res) => satController.renderHomePage(req, res));
app.post('/execute', upload.single('inputFile'), (req, res) => satController.executeSat(req, res));
app.get('/output/:file', (req, res) => {
    // Assuming files are stored in the &quot;files&quot; folder
    const filePath = path.join(__dirname, '../../output', req.params.file);

    // Use res.download() to initiate the file download
    res.download(filePath, (err) => {
        if (err) {
            // Handle errors, such as file not found
            res.status(404).send('File not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;