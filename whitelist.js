var _ = require('lodash');
require('dotenv').config();

var origins = ['http://block.clementineos.it/'];
var msgError = 'Not allowed by CORS';

let isWhiteList = (origin) => {
  return (_.indexOf(origins, origin) != -1)
};

let socket = (origin, callback) => {

  if (process.env.ENV == 1) {
    origins.push('*');
  };  

  console.log('ORIGIN CORS SOCKET: ' + origin);
  console.table(origins);

  if (isWhiteList(origin)) {
    callback(null, true);
  } else {
    callback(msgError, false);
  }
};

var cors = {
  origin: function (origin, callback) {

    if (process.env.ENV == 1) {
      origins.push('*');
    };

    console.log('ORIGIN CORS API: ' + origin);
    console.table(origins);

    if (isWhiteList(origin)) {
      callback(null, true)
    } else {
      callback(new Error(msgError))
    }
  }
};

module.exports = {
    socket,
    cors
};