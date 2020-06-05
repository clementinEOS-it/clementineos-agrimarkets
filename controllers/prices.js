const axios = require('axios');
const markets = require('../markets');
const async = require('async');
const html2json = require('html2json').html2json;
const _ = require('lodash');
const $ = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;
const crypto = require('crypto');
const moment = require('moment');

const entities = new Entities();

require('dotenv').config();
const eosNet = require('../eos')(process.env.ACCOUNT)

var api_url;

if (process.env.TEST == 1) {
    api_url = 'http://localhost:3003/markets/';
} else {
    api_url = 'http://agrimarkets.clementineos.it/markets/';
};

function decode(string) {
    return string.replace(/&#x([0-9a-f]{1,6});/ig, (entity, code) => {
      code = parseInt(code, 16);
  
      // Don't unescape ASCII characters, assuming they're encoded for a good reason
      if (code < 0x80) return entity;
  
      return String.fromCodePoint(code);
    });
};

let getKey = (keys, data) => {

    var _k = '';

    _.forEach(keys, k => {
        _k += String(k).replace("'","") + '_' 
    });

    _k += moment(data).unix();

    var crypto_key = crypto.createHash("sha256")
        .update(_k)
        .digest("hex");

    return crypto_key;
};

let getRowTable = (childs, m, cb) => {

    var _result = [];
    var keys = [];
    var d;

    _.forEach(childs, child => {

        var _row = {
            id_hash: '',
            category: m.category,
            type: m.type,
            city: '',
            date_at: '',
            product: '',
            price: '',
            price_num: 0,
            condition: ''
        };

        keys.push(m.category);
        keys.push(m.type);

        if (child.node == 'element' && child.tag == 'tr') {

            var i = 0;

            _.forEach(child.child, c => {

                if (c.node == 'element') {

                    if (c.tag == 'th') {
                        i = 0;
                    } else {
                        i++;
                    };

                    _.forEach(c.child, item => {

                        var s;

                        if (typeof item.text == 'undefined') {
                            s = '';
                        } else {
                            s = String(item.text).replace('&#xFFFD;','°');
                            s = String(s).replace('&apos;','\'');
                        };

                        var v = decode(s);

                        if (i == 0) {
                            _row.city = v
                            keys.push(v);
                        } else if (i == 1) {
                            _row.date_at = v;
                        } else if (i == 2) {
                            _row.product = v;
                        } else if (i == 3) {
                            var n = v.match(/\d+/g).map(Number);
                            _row.price = v;
                            _row.price_num = parseFloat(String(n).replace(/,/, '.'));
                        } else if (i == 5) {
                            _row.condition = v;
                        };

                        // 
                        
                    });
                }
            });

            _row.id_hash = getKey(keys, _row.date_at);
            // console.table('Row -> ' + JSON.stringify(_row));
            _result.push(_row);

        };
    });

    cb(_result);
    
};

let getPrices = (cb) => {

    var _data = [];
    var _error = [];

    async.each(markets, (m, callback) => {

        axios.get(m.url).then(response => {

            console.log('Get data by -> ' + m.url);
            
            var h = $(m.element, response.data, {
                decodeEntities: true
            }).html();
            
            var j = html2json(JSON.stringify(h));

            _.forEach(j.child, child => {
                if (child.tag == 'tbody') {
                    getRowTable(child.child, m, r => {
                        _data = _.concat(_data, r);
                    });
                };
            });

            callback();

        }).catch(error => {
            // handle error
            console.error(error);
            _error.push(m);
            callback(error);
        });

    }, (err) => {
        if (err) {
            cb(err, _error);
        } else {
            console.log('----> Scraping n.' + _.size(_data) + ' elements. OK!');
            cb(false, _data);
        };
    });
};

let isNew = (api_data, item) => {

    var element = _.find(api_data, { 
        'id_hash': item.id_hash
    });

    if (typeof element == 'undefined') {
        console.log('***** New opendata element funded *****');
        console.table(item);
    } else {
        console.log('Opendata id -> ' + element.id_hash + ' already updated.');
    };

    return (typeof element == 'undefined');

};

let send = (socket, data, api_data, cb) => {

    var _response = {
        blocks: [],
        errors: []  
    };

    var processed, error;

    async.eachSeries(data, (d, callback) => {

        if (isNew(api_data, d) || _.size(data) == 0) {

            var contract = eosNet.smartContracts.agrimarkets;

            run(contract, 'post', d, (err, response) => {

                if (err) {
                    console.error('Error to send data blockchain ....');
                    _response.errors.push(JSON.stringify(d));
                    callback();
                } else {

                    // var resp = JSON.parse(response);
                    error = response.error;
                    processed = response.data.processed;
                    
                    console.log('receiving data from API Send .... Error -> ' + error.value + ' Block Num -> ' + processed.block_num);
                    
                    if (error.value) {
                        console.error('Error ...');
                        _response.errors.push(JSON.stringify(resp_data.error));
                        console.table(resp_data.error);
                        socket.emit('error', resp_data.error);
                    } else {
                        _response.blocks.push(processed);
                        console.log('sending socket n.' + _.size(_response.blocks));
                        socket.emit('block', JSON.stringify(processed));
                    };

                    callback();
                }
            });
        } else {
            socket.emit('update', 'Last transactions: ' + d.key + ' - ' + d.dateISO);
            callback();
        };

    }, err => {
        cb(_.size(_response.errors) > 0, _response);
    });
    
};

let getAPI = (cb) => {

    axios.get(api_url).then(data => {
        cb(false, data);
    }).catch(error => {
        // handle error
        console.error(error);
        cb(true, error);
    });

};

let update = (socket, cb) => {

    var result;
    var api_data;

    async.series({
        one: function(callback) {

            getAPI((err, data) => {
                if (err) {
                    callback(err, 'Error to get Data Table from Blockchain');
                } else {
                    api_data = data.data;
                    callback(null, 'Ok to get Data Table from Blockchain');
                }
            });

        },
        two: function(callback){

            getPrices((err, data) => {

                var msg = 'sending n.' + _.size(data) + ' data to Blockchain network ... ';
                console.info(msg);
                socket.emit('update', msg);
        
                if (!err && (_.size(data) > 0)) {
                    result = data;
                    callback(null, 'Ok to send data to blockchain ... ');
                } else if (err) {
                    var msg = 'Can\'t read source url opendata!';
                    console.warn('error', msg);
                    socket.emit('error', msg);
                    callback(err, msg);
                };
            }); 

        }
    }, function(err, results) {
        if (err) {
            cb(true, results);
        } else if (_.size(result) > 0) {
            send(socket, 
                 result, 
                 api_data, 
                 cb);
        };
    });

};

let run = (contract, action, data, cb) => {

    eos.run(contract, action, data, (err, result) => {

        var _r = {
            data: result,
            error: {
                value: false,
                actions: [],
                description: {},
                created_at: 0
            }
        };

        if (err) {
            
            _r.data = {};
            _r.error = {
                value: true,
                actions: actions,
                description: result,
                created_at: moment().toISOString()
            };

            console.error('ERROR -> ' + moment().toISOString());

        } else {
            console.info('OK -> ' + moment().toISOString());
        };

        cb(err, _r);

    });
};

module.exports = {
    getPrices
}