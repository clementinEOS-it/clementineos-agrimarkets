const _ = require('lodash');

var networks = [
    {
        account: 'gqeaceafdbkq',
        url: 'https://api.testnet.eos.io',
        smartContracts: {
            agrimarkets: {
                account: 'gqeaceafdbkq',
                code: 'gqeaceafdbkq', 
                scope: 'gqeaceafdbkq'
            }
        }
    },
    {
        account: 'iaqvrxpyvqgw',
        url: 'https://api.testnet.eos.io',
        smartContracts: {
            agrimarkets: {
                account: 'iaqvrxpyvqgw',
                code: 'iaqvrxpyvqgw', 
                scope: 'iaqvrxpyvqgw'
            }
        }
    },
    {
        account: 'sxrzkuxwuxju',
        url: 'https://api.testnet.eos.io',
        smartContracts: {
            agrimarkets: {
                account: 'sxrzkuxwuxju',
                code: 'sxrzkuxwuxju', 
                scope: 'sxrzkuxwuxju'
            }
        }
    },
    {
        account: 'clementine35',
        url: 'https://jungle2.cryptolions.io',
        smartContracts: {
            agrimarkets: {
                account: 'clementine35',
                code: 'clementine35', 
                scope: 'clementine35'
            }
        }
    },
    {
        account: 'follwhirab33',
        url: 'https://api-bostest.blockzone.net',
        smartContracts: {
            agrimarkets: {
                account: 'follwhirab33',
                code: 'follwhirab33', 
                scope: 'follwhirab33'
            }
        }
    },
    {
        account: 'gzilenieos33',
        url: 'https://testnet.eos.miami',
        smartContracts: {
            agrimarkets: {
                account: 'gzilenieos33',
                code: 'gzilenieos33', 
                scope: 'gzilenieos33'
            }
        }
    },
    {
        account: 'local',
        url: 'http://localhost:8888',
        smartContracts: {
            agrimarkets: {
                account: 'eosio',
                code: 'eosio', 
                scope: 'eosio'
            }
        }
    }
]

let get = account => {

    var i = _.findIndex(networks, o => { 
        return o.account == account; 
    });

    if (i == -1) {
        return networks[0];
    } else {
        return networks[i];
    }

}

module.exports = get;
