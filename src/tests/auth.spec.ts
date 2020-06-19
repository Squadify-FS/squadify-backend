/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';

import supertest from 'supertest'
import { app } from '../index'

beforeAll(async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), 2000);
  });
});

// MUST DROP DATABASE AND CREATE DATABASE AFTER EACH TEST :(
describe('Register and login', () => {

  xtest('Create test user', async () => {
    const testuser = await supertest(app).post(`/auth/register`).send({
      firstName: 'testuser',
      lastName: 'testUser',
      email: 'testuser@email.com',
      password: 'password',
      dob: '2000-10-10',
      avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png'
    })
    expect(testuser.status).toEqual(200)
    expect(testuser.body).toHaveProperty('message')
    expect(testuser.body).toHaveProperty('token')
    expect(testuser.body.message).toEqual('Registered successfully')
    expect(testuser.body.token.length).toBeGreaterThan(5)
  })

  test('login test user', async () => {
    const res = await supertest(app).post('/auth/login').send({
      email: 'testuser@email.com',
      password: 'password'
    })
    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('token')
    expect(res.body.message).toEqual('Authenticated successfully')
    expect(res.body.token.length).toBeGreaterThan(5)
  })

  test('get /me', async () => {
    const token = (await supertest(app).post('/auth/login').send({
      email: 'testuser@email.com',
      password: 'password'
    })).body.token

    const res = await supertest(app).get(`/auth/me`).set({ 'Authorization': `Bearer ${token}` })

    expect(res.body).toHaveProperty('firstName')

  })
})