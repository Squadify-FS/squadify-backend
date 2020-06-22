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

describe('Event routes tests', () => {
  test('Create  and update event', async () => {
    const token = (await supertest(app).post('/auth/login').send({
      email: 'testuser@email.com',
      password: 'password'
    })).body.token

    const createRes = await supertest(app).post('/event/create').set({ 'Authorization': `Bearer ${token}` })
      .send({
        name: 'test event 1',
        description: 'test event 1 description',
        isPrivate: false,
        startTime: '2020-10-10 19:10:25-07',
        endTime: '2020-10-10 23:10:25-07',
        address: '5 Hanover Square',
        coordsOfEvent: {
          latitude: 40.704917,
          longitude: -74.008808
        }
      })

    expect(createRes.status).toEqual(201)
    expect(createRes.body).toHaveProperty('event')
    expect(createRes.body).toHaveProperty('geolocation')
    expect(createRes.body.event).toHaveProperty('name')
    expect(createRes.body.event).toHaveProperty('description')
    expect(createRes.body.geolocation).toHaveProperty('address')
    expect(createRes.body.geolocation).toHaveProperty('latitude')
    expect(createRes.body.geolocation).toHaveProperty('longitude')

    const updateRes = await supertest(app).post(`/event/update/${createRes.body.event.id}`).set({ 'Authorization': `Bearer ${token}` })
      .send({
        name: 'test event 1 updated',
        description: 'test event 1 updated description',
        isPrivate: false,
        startTime: '2020-10-10 19:10:25-07',
        endTime: '2020-10-10 23:10:25-07',
        address: '5 Hanover Square',
        coordsOfEvent: {
          latitude: 40.704917,
          longitude: -74.008808
        }
      })

    expect(updateRes.body.event.name).toEqual('test event 1 updated')
    expect(updateRes.body.event.description).toEqual('test event 1 updated description')
  })

  test('Assign event to self', async () => {
    const token = (await supertest(app).post('/auth/login').send({
      email: 'testuser@email.com',
      password: 'password'
    })).body.token

    const event = (await supertest(app).post('/event/create').set({ 'Authorization': `Bearer ${token}` })
      .send({
        name: 'test event 1',
        description: 'test event 1 description',
        isPrivate: false,
        startTime: '2020-10-10 19:10:25-07',
        endTime: '2020-10-10 23:10:25-07',
        address: '5 Hanover Square',
        coordsOfEvent: {
          latitude: 40.704917,
          longitude: -74.008808
        }
      })).body.event

    const res = await supertest(app).post('/event/assign_user').set({ 'Authorization': `Bearer ${token}` })
      .send({
        eventId: event.id,
      })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('event')
    expect(res.body).toHaveProperty('relation')
    expect(res.body.relation).toHaveProperty('userId')
    expect(res.body.relation.userId.length).toBeGreaterThan(0)
    expect(res.body.relation.eventId.length).toBeGreaterThan(0)

  })
})