var express = require('express');
var router = express.Router();
var pdfToText = require('../controller/pdfToText')

/* GET home page. */
router.get('/', pdfToText.get);

module.exports = router;
