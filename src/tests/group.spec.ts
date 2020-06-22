/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';

import supertest from 'supertest'
import { app } from '../index'

let token

beforeAll(async () => {
  token = (await supertest(app).post('/auth/login').send({
    email: 'testuser@email.com',
    password: 'password'
  })).body.token
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 2000);
  });
});

describe('Group tests', () => {
  test('test', async () => {
    console.log('groups test')
  })
})