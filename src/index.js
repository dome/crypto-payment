require('./env')

const watcher = require('./watcher')


//watcher.watchEtherTransfers()
//console.log('Started watching Ether transfers')

watcher.watchTokenTransfers()
console.log('Started watching '+process.env.TOKEN_CONTRACT_ADDRESS+' token transfers to '+process.env.WALLET_TO+'\n')
