require('dotenv').config();
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_HOST), null);
const request = require('supertest');
const app = require('./index');
describe('ethereum private chain test', () => {
  it('get current block', async () => {
    const res = await request(app)
    .get('/');
    console.log(res.text);
    expect(res.statusCode).toEqual(200);
    expect(res).toHaveProperty('text');
  });
  it('send transaction test', async (done) => {
    const res = await request(app)
    .post('/send')
    .send({
      "from" : "0xC13035006DA1A02339971C8464a9f6a3272F7A45",
      "to" : "0xE780fA3626d82Ee199A880c1453De612437B3772",
      "amount" : "1",
      "privKey": process.env.PRIV_KEY,
      "data": "test data jlsdjkflsd lsdjkfldjs"
    });
    expect(res.statusCode).toEqual(200);
    done();
  });
  it('send signed transaction test', async (done) => {
    const from = '0xC13035006DA1A02339971C8464a9f6a3272F7A45'; 
    const nonce = await web3.eth.getTransactionCount(from);
    const gasPrice = await web3.eth.getGasPrice();
    const rawTx = {
      "from" : "0xC13035006DA1A02339971C8464a9f6a3272F7A45",
      "to" : "0xE780fA3626d82Ee199A880c1453De612437B3772",
      "amount" : "1",
      "nonce" : nonce,
      "gasPrice" : gasPrice
    };
    const estimateGas = await web3.eth.estimateGas(rawTx);
    rawTx.gas = Math.floor(estimateGas * 1.1);
    const tr = await web3.eth.accounts.signTransaction(rawTx, process.env.PRIV_KEY);
    const res = await request(app)
    .post('/sendSignedTR')
    .send(tr);
    expect(res.statusCode).toEqual(200);
    done();
  });
})