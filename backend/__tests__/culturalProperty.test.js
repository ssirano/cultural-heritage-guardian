

const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const CulturalProperty = require('../src/models/CulturalProperty');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Cultural Property API', () => {
  it('should create a new cultural property', async () => {
    const res = await request(app)
      .post('/api/cultural-properties')
      .send({
        name: 'Test Property',
        type: 'Test Type',
        period: 'Test Period',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Test Property');
  });

  it('should read all cultural properties', async () => {
    const res = await request(app).get('/api/cultural-properties');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});