import { Repository, getConnection } from "typeorm";
import { User, Geolocation, UserEvent, Event } from "../models";
import { getUserEventRelation } from "./event";

// general purpose controller to create new geolocations
const insertGeolocationToDb = async (latitude: number, longitude: number, address?: string, city?: string, region?: string, postalCode?: string, country?: string) => {
  try {

    let localized_address = ''
    if (address) localized_address += `${address}, `
    if (city) localized_address += `${city}, `
    if (region) localized_address += `${region}, `
    if (postalCode) localized_address += `${postalCode}, `
    if (country) localized_address += `${country}`

    const result = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Geolocation)
      .values({ latitude, longitude, localized_address, address, city, region, postalCode, country })
      .returning('*')
      .execute()

    return result
  } catch (ex) {
    console.log(ex)
  }
}

//name explains its function
const setUserGeolocationInDb = async (userId: string, localized_address?: string, latitude?: number, longitude?: number):
  Promise<{
    user: User;
    geolocation: Geolocation;
  }> => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation) // get geolocation repo from db

    const user = await getConnection().getRepository(User).findOne({ id: userId })
    if (!user) throw new Error('User not found')

    //remove user from old relation with geolocation TODO onUpdate and onDelete CASCADE
    const oldGeolocation = await geolocationRepo.findOne({ id: user.geolocation.id })
    if (oldGeolocation) {
      oldGeolocation.users = oldGeolocation.users.filter((user: User) => user.id !== userId)
      await getConnection().manager.save(oldGeolocation);
    }

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.localized_address = :localized_address`,
        { localized_address: localized_address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      await getConnection()
        .createQueryBuilder()
        .relation(Geolocation, 'users')
        .of(existingGeolocation)
        .add(user)
      user.geolocation = existingGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(existingGeolocation)

      return { user, geolocation: existingGeolocation }

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ localized_address: localized_address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      await getConnection()
        .createQueryBuilder()
        .relation(Geolocation, 'users')
        .of(newGeolocation)
        .add(user)
      user.geolocation = newGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(newGeolocation)

      return { user, geolocation: newGeolocation }
    }
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// returns the geolocation object that user has assigned
const getUserGeolocation = async (userId: string): Promise<Geolocation | undefined> => {
  try {

    const user = await getConnection()
      .getRepository(User)
      .findOne(userId, { relations: ['geolocation'] })

    return user?.geolocation

  } catch (ex) {
    console.log(ex)
  }
}

// same as update user geolocation but with event
const setEventGeolocationInDb = async (userId: string, eventId: string, localized_address?: string, latitude?: number, longitude?: number):
  Promise<{
    event: Event;
    geolocation: Geolocation;
  } | undefined> => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation);
    console.log(eventId, 'geolocation');

    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    if (!event) throw new Error('Cannot find event')

    const userRelationToEvent = await getConnection().getRepository(UserEvent).findOne({ user: { id: userId }, event: { id: eventId } })
    if (!userRelationToEvent) throw new Error('User not related to event')
    if (userRelationToEvent.permissionLevel < 1) throw new Error('No permission to perform this action')

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.localized_address = :localized_address`,
        { localized_address: localized_address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      await getConnection()
        .createQueryBuilder()
        .relation(Geolocation, 'events')
        .of(existingGeolocation)
        .add(event)
      event.geolocation = existingGeolocation
      await getConnection().manager.save(event)
      await getConnection().manager.save(existingGeolocation)
      return { event, geolocation: existingGeolocation }

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ localized_address: localized_address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      await getConnection()
        .createQueryBuilder()
        .relation(Geolocation, 'events')
        .of(newGeolocation)
        .add(event)
      event.geolocation = newGeolocation
      await getConnection().manager.save(event)
      await getConnection().manager.save(newGeolocation)

      return { event, geolocation: newGeolocation }
    }

  } catch (ex) {
    console.log(ex)
  }
}

// gets geolocation corresponding to this event
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEventGeolocation = async (eventId: string, userId?: any): Promise<Geolocation | undefined> => {
  try {
    const event = await getConnection()
      .getRepository(Event)
      .findOne(eventId, { relations: ['geolocation'] })
    if (event && event.isPrivate) {
      const userRelationToEvent = await getUserEventRelation(userId, eventId)
      if (!userRelationToEvent || userRelationToEvent.permissionLevel < 1) throw new Error('No permission for this event')
    }

    return event?.geolocation

  } catch (ex) {
    console.log(ex)
  }
}

// STRETCH: fetch group activity based on geolocation through user's activity if the group is public

export {
  insertGeolocationToDb,
  setUserGeolocationInDb,
  getUserGeolocation,
  setEventGeolocationInDb,
  getEventGeolocation
}