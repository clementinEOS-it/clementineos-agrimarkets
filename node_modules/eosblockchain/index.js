const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const fetch = require('node-fetch');                                    // node only; not needed in browsers
const { TextEncoder, TextDecoder } = require('util');                   // node only; native TextEncoder/Decoder

let signatureProvider; 
let rpc, api;

// init blockchain 
let init = (options) => {

    console.info('**** Connected to EOS BLOCKCHAIN Network -> ' + options.url + '\n---------------\n');

    signatureProvider = new JsSignatureProvider([options.signatureKey]);
    
    rpc = new JsonRpc(options.url, { 
        fetch 
    });

    api = new Api({ 
        rpc, 
        signatureProvider, 
        textDecoder: new TextDecoder(), 
        textEncoder: new TextEncoder() 
    });

};

// run action
let run = async (contract, action, data, cb) => {

    var actions = [{
        account: contract.account,
        name: action,
        authorization: [{
            actor: contract.account,
            permission: "active"
        }],
        data: data
    }];

    try {

        const result = await api.transact({
            actions: actions
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
            broadcast: true,
            sign: true
        });
        
        cb(false, result);

    } catch (e) {

        console.error('\n ------\n Caught exception run Action -> ' + e);

        if (e instanceof RpcError) {
            cb(true, JSON.stringify(e.json, null, 2));
        }

    };

};

// Get data table from Blokchain network
let getTable = async (contract, options, cb) => {

    var _config = {
        json: true,                 // Get the response as json
        code: contract.account,     // Contract that we target
        scope: contract.account,    // Account that owns the data
        table: options.table,               // Table name
        limit: options.limit,               // Here we limit to 1 to get only row
        reverse: false,             // Optional: Get reversed data
        show_payer: false           // Optional: Show ram payer
    };

    try {
        const resp = await rpc.get_table_rows(_config);
        cb(false, resp.rows);

    } catch (e) {
        
        console.log('\nCaught exception by Get Data Table ' + e);
        console.log('\nOptions ' + JSON.stringify(config));

        if (e instanceof RpcError) {
            cb(true, JSON.stringify(e.json, null, 2));
        }
    }

};

module.exports = {
    init,
    rpc,
    api,
    run,
    getTable
};