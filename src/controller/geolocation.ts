import { getConnection } from "typeorm";
import { User, UserEvent, Event } from "../models";
import axios from 'axios'


//name explains its function
const setUserGeolocationInDb = async (userId: string, localized_address: string, latitude?: number, longitude?: number) => {
  try {

    if (latitude !== undefined && longitude !== undefined) {
      console.log('LATITUDE', latitude)
      console.log('LONGITUDE', longitude)
    } else {
      const location = (await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${localized_address}&key=${process.env.API_KEY}`))?.data;
      latitude = location.results[0].geometry.location.lat
      longitude = location.results[0].geometry.location.lng
    }
    // get geolocation repo from db
    await getConnection()
      .createQueryBuilder()
      .update(User)
      .set({ localized_address, latitude, longitude })
      .execute()

    const user = await getConnection().getRepository(User).findOne({ id: userId })
    if (!user) throw new Error('User not found')

    return user

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// returns the geolocation object that user has assigned
const getUserGeolocation = async (userId: string) => {
  try {

    const user = await getConnection().getRepository(User).findOne(userId)

    return { localized_addres: user?.localized_address, latitude: user?.latitude, longitude: user?.longitude }

  } catch (ex) {
    console.log(ex)
  }
}

// same as update user geolocation but with event
const setEventGeolocationInDb = async (userId: string, eventId: string, localized_address: string, latitude?: number, longitude?: number) => {
  try {

    const userRelationToEvent = await getConnection().getRepository(UserEvent).findOne({ user: { id: userId }, event: { id: eventId } })
    if (!userRelationToEvent) throw new Error('User not related to event')
    if (userRelationToEvent.permissionLevel < 1) throw new Error('No permission to perform this action')


    if (latitude !== undefined && longitude !== undefined) {
      console.log('LATITUDE', latitude)
      console.log('LONGITUDE', longitude)
    } else {
      const location = (await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${localized_address}&key=${process.env.API_KEY}`))?.data;
      latitude = Number(location.results[0].geometry.location.lat)
      longitude = Number(location.results[0].geometry.location.lng)
    }
    // get geolocation repo from db
    await getConnection()
      .createQueryBuilder()
      .update(Event)
      .set({ localized_address, latitude, longitude })
      .execute()

    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    if (!event) throw new Error('Cannot find event')


    return { event }

  } catch (ex) {
    console.log(ex)
  }
}

// gets geolocation corresponding to this event
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEventGeolocation = async (eventId: string, userId?: any) => {
  try {
    const event = await getConnection().getRepository(Event).findOne(eventId)

    return { localized_addres: event?.localized_address, latitude: event?.latitude, longitude: event?.longitude }

  } catch (ex) {
    console.log(ex)
  }
}

// STRETCH: fetch group activity based on geolocation through user's activity if the group is public

export {
  setUserGeolocationInDb,
  getUserGeolocation,
  setEventGeolocationInDb,
  getEventGeolocation
}