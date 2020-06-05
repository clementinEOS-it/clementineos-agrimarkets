var _ = require('lodash');

var origins = ['http://agrimarkets.clementineos.it/',
               'http://localhost:3003/'];

var cors = {
  origin: function (origin, callback) {
    console.log('ORIGIN: ' + origin);
    if (_.indexOf(origins, origin) != -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
};

module.exports = {
    origins,
    cors
};