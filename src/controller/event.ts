import { getConnection } from 'typeorm';

import { Event, Group, User, UserGroup, UserEvent, Geolocation, Hashtag } from '../models'
import { insertGeolocationToDb } from './geolocation';

// interface NewEventDetails {
//   name: string;
//   description: string;
//   dateAndTime: Date;
//   isPrivate: boolean;
// }

// simple create event function. returns (ids, raw, generatedmaps) for both event and the relation between the user and the event.
// user is the creator of the event, and has admin permission by default
// setting geolocation for event should be handled in the route using ***setEventGeolocationInDb (./geolocation)***
const insertEventToDb = async (userId: string, name: string, description: string, isPrivate: boolean, startTime: Date, endTime?: Date) => {
  try {
    const event = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Event)
      .values({ name, description, startTime, endTime, isPrivate })
      .returning('*')
      .execute();

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserEvent)
      .values({
        user: { id: userId },
        event: { id: event.identifiers[0].id },
        permissionLevel: 2
      })
      .returning('*')
      .execute()

    return { event, relation }
  } catch (ex) {
    console.log(ex)
  }
}

// creates relation between group and event. handles user permission to perform assignation of events in the group. (only Admins and Friends can)
// returns the group and the event which were connected, as well as the user in order to handle WHO assigned the event in frontend
// also handles what kind of permission the user had with the event in the first place. Only hosts and admins can assign private events to groups.
// if the user has no relation to a public event, it creates it when running this function, therefore ssuming they assign it because they're going. 
// Might change that last thing in the future
const assignEventToGroup = async (userId: string, eventId: string, groupId: string) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    const user = await getConnection().getRepository(User).findOne({ id: userId })

    if (!group || !event || !user) throw new Error('Something went wrong')

    const userGroupRelation = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: userId }, group: { id: groupId } })
    if (!userGroupRelation) throw new Error('User is not in group')
    if (userGroupRelation.permissionLevel < 1) throw new Error('User does not have permission to perform this action')

    const userEventRelation = await getConnection()
      .getRepository(UserEvent)
      .findOne({ user: { id: userId }, event: { id: eventId } })

    if (event.isPrivate) {
      if (!userEventRelation || userEventRelation.permissionLevel < 1) throw new Error("User cannot assign private event if there's no relation")
    } else {
      if (!userEventRelation) {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(UserEvent)
          .values({
            user: { id: userId },
            permissionLevel: 0
          })
          .returning('*')
          .execute()
      }
    }

    await getConnection()
      .createQueryBuilder()
      .relation(Event, 'groups')
      .of(event)
      .add(group);

    await getConnection()
      .createQueryBuilder()
      .relation(Group, 'events')
      .of(group)
      .add(event);

    return { group, event, user }

  } catch (ex) {
    console.log(ex)
  }
}

// does what it says. handles user group relation and permission level.
// MAYBE should unassign event from everybody who assigned it to their personal calendar?
const unassignEventFromGroup = async (userId: string, eventId: string, groupId: string) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    const user = await getConnection().getRepository(User).findOne({ id: userId })

    if (!group || !event || !user) throw new Error('Something went wrong')

    const userGroupRelation = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: userId }, group: { id: groupId } })
    if (!userGroupRelation) throw new Error('User is not in group')
    if (userGroupRelation.permissionLevel < 1) throw new Error('User does not have permission to perform this action')

    await getConnection()
      .createQueryBuilder()
      .relation(Event, 'groups')
      .of(event)
      .remove(group);

    await getConnection()
      .createQueryBuilder()
      .relation(Group, 'events')
      .of(group)
      .remove(event);

    return { group, event, user }

  } catch (ex) {
    console.log(ex)
  }
}

// creates user event relation. handles if the event is private and if the user was invited to the event 
// in that case, handles the permission level for both.
const assignEventToUser = async (userId: string, eventId: string, inviterId?: string) => {
  try {
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    if (inviterId) {
      const inviterRelationToEvent = await getConnection()
        .getRepository(UserEvent)
        .findOne({ user: { id: inviterId }, event: { id: eventId } })
      if (event && event.isPrivate) {
        if (!inviterRelationToEvent || inviterRelationToEvent.permissionLevel < 1) throw new Error('User is not related or not enough permission')
      }
    }

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserEvent)
      .values({
        inviter: { id: inviterId || undefined },
        user: { id: userId },
        permissionLevel: inviterId ? 1 : 0
      })
      .returning('*')
      .execute()

    return { event, relation }
  } catch (ex) {
    console.log(ex)
  }
}

// deletes relation between user and event. (remove from my personal calendar)
const unassignEventFromUser = async (userId: string, eventId: string) => {
  try {

    const deletedRelation = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserEvent)
      .where({ user: { id: userId }, event: { id: eventId } })

    return deletedRelation
  } catch (ex) {
    console.log(ex)
  }
}

// gets all the events in my calendar
const getUserEvents = async (userId: string) => {
  try {
    const events: Event[] = await getConnection()
      .getRepository(UserEvent)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.event', 'event')
      .where(`relation."userId" = :userId`, { userId })
      .getMany()
      .then(relations => relations.map(relation => relation.event))

    return events
  } catch (ex) {
    console.log(ex)
  }
}

// finds group with the events in it and returns the events
const getGroupEvents = async (groupId: string) => {
  try {
    const results: Event[] | undefined = await getConnection()
      .getRepository(Group)
      .findOne(groupId, { relations: ['events'] })
      .then(group => {
        if (group) return group.events
      })

    return results
  } catch (ex) {
    console.log(ex)
  }
}

// updates event info and privacy setting. handles user permission to perform this action
const updateEvent = async (userId: string, eventId: string, name: string, description: string, startTime: Date, endTime: Date, isPrivate?: boolean) => {
  try {
    const userRelation = await getConnection()
      .getRepository(UserEvent)
      .findOne({ user: { id: userId }, event: { id: eventId } })
    if (!userRelation || userRelation.permissionLevel < 1) throw new Error('No relation or permission level error')

    if ((isPrivate === true || isPrivate === false)) {
      if (userRelation.permissionLevel < 2) throw new Error('No permission to set privacy')
      else await getConnection()
        .createQueryBuilder()
        .update(Event)
        .set({ isPrivate })
        .where({ id: eventId })
        .returning('*')
        .execute();
    }

    const updatedEvent = await getConnection()
      .createQueryBuilder()
      .update(Event)
      .set({ name, description, startTime, endTime })
      .where({ id: eventId })
      .returning('*')
      .execute();

    return updatedEvent

  } catch (ex) {
    console.log(ex)
  }
}

// uses geolocation to draw a circle around and fetch all the events in those geolocations and return them
const searchEventsUsingRadius = async (geolocationId: string, radius: number, latitude?: number, longitude?: number) => {
  try {
    let location = await getConnection().getRepository(Geolocation).findOne({ id: geolocationId })

    if (!location) {
      if (latitude && longitude) {
        const newGeolocationId = (await insertGeolocationToDb(latitude, longitude))?.identifiers[0].id
        location = await getConnection().getRepository(Geolocation).findOne({ id: newGeolocationId })
      } else {
        throw new Error('Something went wrong')
      }
    }

    if (location) {
      const radiusInKM = radius * 0.621371
      const latitudeTolerance = (1 / 110.54) * radiusInKM
      const longitudeTolerance = (1 / (111.320 * Math.cos(Number(location.latitude.toFixed(4))))) * radiusInKM

      const results: Event[] = await getConnection()
        .createQueryBuilder()
        .select()
        .from(Geolocation, 'location')
        .leftJoinAndSelect('location.events', 'location')
        .where(`location."latitude" BETWEEN (location."latitude" - ${latitudeTolerance}) AND (location."latitude" + ${latitudeTolerance})`)
        .andWhere(`location."longitude" BETWEEN (location."longitude" - ${longitudeTolerance}) AND (location."longitude" + ${longitudeTolerance})`)
        .limit(50) //TODO
        .getMany()
        .then(geolocations => geolocations.reduce((acc: Event[], curr: Geolocation) => {
          curr.events = curr.events.filter(event => !event.isPrivate)
          acc.concat(curr.events)
          return acc
        }, [])) //TODO

      // const results = await getConnection()
      //   .createQueryBuilder()
      //   .select()
      //   .from(Event, 'event')
      //   .leftJoin('event.geolocation', 'geolocation')
      //   .where(`event.geolocation."latitude" BETWEEN (event.geolocation."latitude" - ${latitudeTolerance}) AND (event.geolocation."latitude" + ${latitudeTolerance})`)
      //   .andWhere(`event.geolocation."longitude" BETWEEN (event.geolocation."longitude" - ${longitudeTolerance}) AND (event.geolocation."longitude" + ${longitudeTolerance})`)
      //   .limit(50) //TODO
      //   .getMany()

      return results
    }
  } catch (ex) {
    console.log(ex)
  }
}

// uses event's name and hashtags to fetch events based on a string search value
const searchEventsByName = async (searchVal: string) => {
  try {

    const results = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Event, 'event')
      .leftJoin('event.hashtags', 'hashtag')
      .where(`event.name LIKE "%${searchVal}%"`)
      .andWhere(`event."isPrivate" = false`)
      .getMany()

    return results

  } catch (ex) {
    console.log(ex)
  }
}

const searchEventsByHashtags = async (searchVal: string) => {
  try {

    const results = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Hashtag, 'hashtag')
      .leftJoinAndSelect('hashtag.events', 'events')
      .where(`hashtag.text LIKE "%${searchVal}%"`)
      .getMany()
      .then(hashtags => hashtags.reduce((acc: Event[], curr) => {
        curr.events = curr.events.filter(event => !event.isPrivate) //TODO
        acc.concat(curr.events)
        return acc
      }, []))

    return results

  } catch (ex) {
    console.log(ex)
  }
}

const getEventHashtags = async (eventId: string) => {
  try {
    const results = await getConnection()
      .getRepository(Event)
      .findOne(eventId, { relations: ['hashtags'] })
      .then(event => event?.hashtags)

    return results
  } catch (ex) {
    console.log(ex)
  }
}


const getHashtagByText = async (text: string) => {
  try {
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ text })
    return hashtag
  } catch (ex) {
    console.log(ex)
  }
}

const getHashtagById = async (id: string) => {
  try {
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ id })
    return hashtag
  } catch (ex) {
    console.log(ex)
  }
}

const insertHashtagToDb = async (text: string) => {
  try {

    const hashtag = new Hashtag()
    hashtag.text = text
    await getConnection().manager.save(hashtag)

    return hashtag

  } catch (ex) {
    console.log(ex)
  }
}

const assignHashtagToEvent = async (hashtagId: string, eventId: string) => {
  try {
    const event = await getConnection().getRepository(Hashtag).findOne({ id: eventId })
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ id: hashtagId })

    if (event && hashtag) {

      await getConnection()
        .createQueryBuilder()
        .relation(Event, 'hashtags')
        .of(event)
        .add(hashtag)

      return { event, hashtag }
    }
  } catch (ex) {
    console.log(ex)
  }
}


export {
  insertEventToDb,
  assignEventToGroup,
  unassignEventFromGroup,
  assignEventToUser,
  unassignEventFromUser,
  getUserEvents,
  getGroupEvents,
  updateEvent,
  searchEventsUsingRadius,
  searchEventsByName,
  searchEventsByHashtags,
  getHashtagByText,
  getHashtagById,
  insertHashtagToDb,
  assignHashtagToEvent,
  getEventHashtags
}