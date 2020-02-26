require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser')
const Web3 = require('web3');
const app = express();
const PORT = 8080;
const OPTIONS = {
  defaultBlock: "latest",
  transactionConfirmationBlocks: 1,
  transactionBlockTimeout: 5,
  transactionPollingTimeout: 480
};
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_HOST), null, OPTIONS);
const sendTransaction = async (body) => {
  // console.log("sending transaction => ", body);
  const from = body.from;
  const to = body.to;
  const amount = web3.utils.toWei(body.amount, 'ether');
  const privKey = body.privKey;
  // const nonce = body.nonce;
  // const gas = body.gas;
  const data = web3.utils.stringToHex(body.data);
  const nonce = await web3.eth.getTransactionCount(from);
  const gasPrice = await web3.eth.getGasPrice();
  console.log("gas price => ", gasPrice);
  console.log("nonce => ", nonce);
  var rawTx = {
    from: from,
    to: to,
    value: amount,
    gasPrice: gasPrice,
    nonce: nonce,
    data: data
  } 
  const estimateGas = await web3.eth.estimateGas(rawTx);
  rawTx.gas = Math.floor(estimateGas * 1.1);
  console.log(`estimated gas is ${estimateGas}, but more gas input as ${rawTx.gas}`);
  const tr = await web3.eth.accounts.signTransaction(rawTx, privKey);
  web3.eth.sendSignedTransaction(tr.rawTransaction)
  .on('confirmation',(confirmationNumber, receipt) => {
      console.log('=> confirmation: ', confirmationNumber);
  })
  .on('transactionHash', hash => {
      console.log('=> hash');
      console.log(hash);
  })
  .on('receipt', receipt => {
      console.log('=> receipt');
      console.log(receipt);
  })
  .on('error', console.error);
}
const sendSignedTransaction = async (tr) => {
  web3.eth.sendSignedTransaction(tr.rawTransaction)
  .on('confirmation',(confirmationNumber, receipt) => {
      console.log('=> confirmation: ', confirmationNumber);
  })
  .on('transactionHash', hash => {
      console.log('=> hash');
      console.log(hash);
  })
  .on('receipt', receipt => {
      console.log('=> receipt');
      console.log(receipt);
  })
  .on('error', console.error);
}
const getTransactionsByAccount = async (myaccount, startBlockNumber, endBlockNumber) => {

  if (endBlockNumber == null || endBlockNumber == "") {
    endBlockNumber = await web3.eth.getBlockNumber();
    console.log("Using endBlockNumber: " + endBlockNumber);
  }
  if (startBlockNumber == null || startBlockNumber == "") {
    startBlockNumber = endBlockNumber - 1000;
    console.log("Using startBlockNumber: " + startBlockNumber);
  }
  console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
  var Trs = [];
  for (var i = startBlockNumber; i <= endBlockNumber; i++) {
    if (i % 1000 == 0) {
      console.log("Searching block " + i);
    }
    var block = await web3.eth.getBlock(i, true);
    if (block != null && block.transactions != null) {
      block.transactions.forEach( function(e) {
        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
          console.log("  tx hash          : " + e.hash + "\n"
            + "   nonce           : " + e.nonce + "\n"
            + "   blockHash       : " + e.blockHash + "\n"
            + "   blockNumber     : " + e.blockNumber + "\n"
            + "   transactionIndex: " + e.transactionIndex + "\n"
            + "   from            : " + e.from + "\n" 
            + "   to              : " + e.to + "\n"
            + "   value           : " + e.value + "\n"
            + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
            + "   gasPrice        : " + e.gasPrice + "\n"
            + "   gas             : " + e.gas + "\n"
            + "   input           : " + e.input);
            const tr = {
              tx_hash          : e.hash,
                 nonce           : e.nonce,
                 blockHash       : e.blockHash, 
                 blockNumber     : e.blockNumber, 
                 transactionIndex: e.transactionIndex, 
                 from            : e.from,
                 to              : e.to,
                 value           : e.value, 
                 time            : block.timestamp + new Date(block.timestamp * 1000).toGMTString(),
                 gasPrice        : e.gasPrice,
                 gas             : e.gas,
                 input           : e.input
            }
            Trs.push(tr);
        }
      })
    }
  }
  return Trs;
};
app.use(bodyParser.json());
app.get('/', async (req, res) => {
    const blocknumber = await web3.eth.getBlockNumber();
    res.status(200).send(`current block number = ${blocknumber}`);

});
// 계좌이체 
app.post('/send', async (req, res) => {
  await sendTransaction(req.body);
  res.send("sending transaction");
});
// 계좌이체 
app.post('/sendSignedTR', async (req, res) => {
  await sendSignedTransaction(req.body);
  res.send("sending signed transaction");
});
// 계좌조회 
app.post('/inspect', async (req, res) => {
  const result = await web3.eth.getBalance(req.body.address);
  const resultEther = web3.utils.fromWei(result, 'ether');
  res.send(`${req.body.address} has ${resultEther.toString()} coins`);
});
// 현재 block 
app.post('/currentBlock', async (req, res) => {
  const blockNumber = await web3.eth.getBlockNumber();
  res.send(`current block number is ${blockNumber}`);
});
app.post('/getGasPrice', async (req, res) => {
  const gasPrice = await web3.eth.getGasPrice();
  res.send(`gas price is ${gasPrice}`);
});
// 시작 블록, 끝 블록 사이에 존재하는 모든 트랜젝션을 리턴.
app.post('/getTransactionsByAccount', async (req, res) => {
  const address = req.body.address;
  const startBlock = req.body.startBlock;
  const endBlock = req.body.endBlock;
  const trs = await getTransactionsByAccount(address, startBlock, endBlock);
  res.send(trs);
});
app.listen(PORT, () => console.log(`server started at ${PORT}`));

module.exports = app;