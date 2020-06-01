var express = require('express');
var router = express.Router();
var priceCtrl = require('../controllers/prices');

require('dotenv').config();

router.get('/markets', function(req, res, next) {
  
    priceCtrl.getPrices((err, response) => {
        if (err) {
            res.status(500).send(response);
        } else {
            res.status(200).send(response);
        }
    })
    
});

module.exports = router;
