/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';

import supertest from 'supertest'
import { app } from '../index'

beforeAll(async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 2000);
  });
});

// const token = (await supertest(app).post('/auth/login').send({
//   email: 'testuser@email.com',
//   password: 'password'
// })).body.token

