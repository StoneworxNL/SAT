const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const SatController = require('./controllers/satController');
const setRoutes = require('./routes/index');
const config = require('config');

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;