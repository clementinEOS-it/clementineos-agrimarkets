var express         = require('express');
var router          = express.Router();
var priceCtrl       = require('../controllers/prices');
const eos           = require('eosblockchain');
const cors          = require('cors');
var _               = require('lodash')

require('dotenv').config();

const whitelist = require('../whitelist');

router.get('/', function(req, res, next) {

    var options = {
        table : 'markets',
        limit: (req.query.limit || -1)
    };

    eos.getTable(req.app.locals.eos.smartContracts.agrimarkets, 
                 options, 
                 (error, response) => {
        
        if (error) {
            res.status(500).json({});
        } else {

            var r = _.sortBy(response, item => {
                return item.date_at
            });
            
            res.status(200).json(r);
        }
    });
    
});

router.post('/', cors(whitelist.cors), function(req, res, next) {

    console.log('Sending to BLOCKCHAIN ...');
  
    priceCtrl.run(req.app.locals.eos.smartContracts.agrimarkets, 
            'post', 
            req.body, 
            (err, result) => {

        if (err) {
            res.status(500).json(result);
        } else {
            res.status(200).json(result);
        };

    });
    
});

module.exports = router;
