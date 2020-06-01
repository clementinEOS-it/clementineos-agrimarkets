const axios = require('axios');
const markets = require('../markets');
const async = require('async');
const html2json = require('html2json').html2json;
const _ = require('lodash');
const $ = require('cheerio');
const Entities = require('html-entities').AllHtmlEntities;

const entities = new Entities();

require('dotenv').config();

function decode(string) {
    return string.replace(/&#x([0-9a-f]{1,6});/ig, (entity, code) => {
      code = parseInt(code, 16);
  
      // Don't unescape ASCII characters, assuming they're encoded for a good reason
      if (code < 0x80) return entity;
  
      return String.fromCodePoint(code);
    });
}

let getRowTable = (childs, m, cb) => {

    var _result = [];

    _.forEach(childs, child => {

        var _row = {
            categoria: m.category,
            mercato: m.type,
            piazza: '',
            data: '',
            prodotto: '',
            prezzo: '',
            prezzo_num: 0,
            var: '',
            condizioni: ''
        };

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

                        // var v = entities.decode(item.text);
                        var v = decode(s);

                        if (i == 0) {
                            _row.piazza = v
                        } else if (i == 1) {
                            _row.data = v;
                        } else if (i == 2) {
                            _row.prodotto = v;
                        } else if (i == 3) {
                            var n = v.match(/\d+/g).map(Number);
                            _row.prezzo = v;
                            _row.prezzo_num = parseFloat(String(n).replace(/,/, '.'));
                        } else if (i == 4) {
                            _row.var = v;
                        } else if (i == 5) {
                            _row.condizioni = v;
                        }

                        // console.table('Row -> ' + JSON.stringify(_row));
                        
                    });
                }
            });

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
        }
    });

}

module.exports = {
    getPrices
}