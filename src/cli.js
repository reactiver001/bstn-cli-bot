const bstnClient = require('./client')
const fs = require('fs')
const readline = require('readline')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

fs.readdir('./config/', function (err, profiles) {
    console.log('Select the profile that you would like to use.')
    for (i in profiles) {
        let profileName = profiles[i].split('.json')[0]
        console.log(` [${i}] ${profileName}`)
    }
    rl.question('', (ans) => {
        let profile = require('../config/' + profiles[parseInt(ans)])

        rl.question('Enter a variant to buy.\n', function(variant) {
            let client = new bstnClient(profile)
            client.buy(variant)
        })
    })
})