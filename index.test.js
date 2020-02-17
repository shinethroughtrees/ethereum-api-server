require('dotenv').config();
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
  it('send transaction test', async () => {
    const res = await request(app)
    .post('/transaction')
    .send({
      "from" : "0xC13035006DA1A02339971C8464a9f6a3272F7A45",
      "to" : "0xE780fA3626d82Ee199A880c1453De612437B3772",
      "amount" : "1",
      "privKey": process.env.PRIV_KEY,
      "data": "test data jlsdjkflsd lsdjkfldjs"
    });
    expect(res.statusCode).toEqual(404);
    
  });
})