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
app.listen(PORT, () => console.log(`server started at ${PORT}`));

module.exports = app;