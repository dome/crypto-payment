const Tx = require("ethereumjs-tx");
const Web3 = require("web3");
const TOKEN_ABI = require("./abi");
const axios = require("axios");

async function getConfirmations(txHash) {
  try {
    // Instantiate web3 with HttpProvider
    const web3 = new Web3(process.env.INFURA_URL);

    // Get transaction details
    const trx = await web3.eth.getTransaction(txHash);
    // Get current block number
    const currentBlock = await web3.eth.getBlockNumber();

    // When transaction is unconfirmed, its block number is null.
    // In this case we return 0 as number of confirmations
    return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber;
  } catch (error) {
    console.log(error);
  }
}

function confirmEtherTransaction(event, confirmations = 10) {
  const txHash = event.transactionHash;
  setTimeout(async () => {
    // Get current number of confirmations and compare it with sought-for value
    const trxConfirmations = await getConfirmations(txHash);
    console.log(
      "Transaction with hash " +
        txHash +
        " has " +
        trxConfirmations +
        " confirmation(s)"
    );
    var paid = false;
    if (trxConfirmations >= confirmations) {
      const web3 = new Web3(process.env.INFURA_URL);
      // Handle confirmation event according to your business logic

      console.log(
        "Transaction with hash " + txHash + " has been successfully confirmed"
      );
      if (paid) {
        console.log("Pay already !!!");
      } else {
        // transfer bolo to
        var amount = web3.utils.toHex(
          parseInt(event.returnValues["_value"]) * 15
        );
        console.log(
          "Transfer Bollo " + amount + " to " + event.returnValues["_to"]
        );
        var myAddress = "0x4Fbd49c841c2f891b8e04B887B9C5035BE7c7209";
        const privKey = "[private key]";
        var privateKey = Buffer.from(privKey, "hex");
        var toAddress = event.returnValues["_from"];
        count = await web3.eth.getTransactionCount(myAddress, "pending");
        const bolo_addr = "0x1921168344840d1Ca5aCd82e8815F24582D4AD27";
        var contract = new web3.eth.Contract(TOKEN_ABI, bolo_addr, {
          from: myAddress,
        });
        var txData = {
          from: myAddress,
          gasPrice: web3.utils.toHex(20 * 1e9),
          gasLimit: web3.utils.toHex(50000),
          to: bolo_addr,
          value: "0x0",
          data: contract.methods.transfer(toAddress, amount).encodeABI(),
          nonce: web3.utils.toHex(count),
        };
        const transaction = new Tx(txData);
        transaction.sign(privateKey);
        const serializedTx = transaction.serialize().toString("hex");
        //web3.eth.sendSignedTransaction("0x" + serializedTx);
        web3.eth.sendSignedTransaction("0x" + serializedTx,function (err, hash) {
            if (!err) {
              console.log(hash)

              console.log("Check Referal : " + toAddress.toLowerCase());
              axios
                .get(
                  "https://asia-southeast2-bollo-849a1.cloudfunctions.net/getReferral/" +
                    toAddress.toLowerCase()
                )
                .then((resp) => {
                  if (resp.data.data != null) {
                    // Covers 'undefined' as well
                    console.log(resp.data.data.accountAddress);
                    toAddress = resp.data.data.accountAddress;
                    amount = amount * 0.2; // Referal 20%
                    var txData = {
                      from: myAddress,
                      gasPrice: web3.utils.toHex(20 * 1e9),
                      gasLimit: web3.utils.toHex(1210000),
                      to: bolo_addr,
                      value: "0x0",
                      data: contract.methods.transfer(toAddress, amount).encodeABI(),
                      nonce: web3.utils.toHex(count + 1),
                    };
                    const transaction = new Tx(txData);
                    transaction.sign(privateKey);
                    const serializedTx = transaction.serialize().toString("hex");
                    console.log(serializedTx);
                    //web3.eth.sendSignedTransaction("0x" + serializedTx);
                    web3.eth.sendSignedTransaction(
                      "0x" + serializedTx,
                      function (err, hash) {
                        if (!err) console.log(hash);
                        else console.log(err);
                      }
                    );
                  }
                })
                .catch((err) => {
                  //console.error("No referal");
                });
      
            }else {
              console.log(err)
            }
          }
        );
      }
      return;
    }
    // Recursive call
    return confirmEtherTransaction(txHash, confirmations);
  }, 30 * 1000);
}

module.exports = confirmEtherTransaction;
