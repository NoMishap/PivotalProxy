var express = require('express');
var router = express.Router();
var alive = require('../controller/alive')

/* GET home page. */
router.get('/', alive.check);

module.exports = router;
