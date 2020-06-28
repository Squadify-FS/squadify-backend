import { getConnection, InsertResult, DeleteResult, UpdateResult } from 'typeorm';

import { Event, Group, User, UserGroup, UserEvent, Hashtag } from '../models'
import { INewEventDetails, IUserEventGroup, IUserEventInviter, IUserEvent, IUpdateEventDetails, IEventHashtag } from '../types/eventTypes';

const getUserEventRelation = async (userId: string, eventId: string): Promise<UserEvent | undefined> => {
  const relation = await getConnection()
    .getRepository(UserEvent)
    .findOne({ user: { id: userId }, event: { id: eventId } })

  if (relation) return relation
}


// simple create event function. returns (ids, raw, generatedmaps) for both event and the relation between the user and the event.
// user is the creator of the event, and has admin permission by default
// setting geolocation for event should be handled in the route using ***setEventGeolocationInDb (./geolocation)***
const insertEventToDb = async ({ userId, name, description, startTime, endTime, isPrivate }: INewEventDetails):
  Promise<{
    event: InsertResult;
    relation: InsertResult;
  } | undefined> => {
  try {
    // if (new Date(startTime) < new Date()) throw new Error('Cannot create an event for the past!')

    const event = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Event)
      .values({
        name,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        isPrivate
      })
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
const assignEventToGroup = async ({ userId, eventId, groupId }: IUserEventGroup):
  Promise<{
    group: Group;
    event: Event;
    user: User;
  } | undefined> => {
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
      if (userEventRelation && userEventRelation.permissionLevel < 1) throw new Error("User doesn't have enough permission")
    } else {
      if (!userEventRelation) { // assign the event to the user automatically if he doesnt already have it assigned
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

    return { group, event, user }

  } catch (ex) {
    console.log(ex)
  }
}

// does what it says. handles user group relation and permission level.
// MAYBE should unassign event from everybody who assigned it to their personal calendar?
const unassignEventFromGroup = async ({ userId, eventId, groupId }: IUserEventGroup):
  Promise<{
    group: Group;
    event: Event;
    user: User;
  } | undefined> => {
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
// TODO maybe add an inviteUserToEvent controller?
const assignEventToUser = async ({ userId, eventId, inviterId }: IUserEventInviter):
  Promise<{
    event: Event | undefined;
    relation: InsertResult;
  } | undefined> => {
  try {
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    if (event && event.isPrivate) {
      if (!inviterId) throw new Error('Inviter has no permission')

      const inviterRelationToEvent = await getConnection()
        .getRepository(UserEvent)
        .findOne({ user: { id: inviterId }, event: { id: eventId } })

      if (!inviterRelationToEvent || inviterRelationToEvent.permissionLevel < 1) throw new Error('User is not related or not enough permission')
    }

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserEvent)
      .values({
        inviter: { id: inviterId || undefined },
        user: { id: userId },
        event: { id: eventId },
        permissionLevel: inviterId ? 1 : 0
      })
      .returning('*')
      .execute()

    return { event, relation: relation.raw[0] }
  } catch (ex) {
    console.log(ex)
  }
}

// deletes relation between user and event. (remove from my personal calendar)
const unassignEventFromUser = async ({ userId, eventId }: IUserEvent): Promise<DeleteResult | undefined> => {
  try {

    const deletedRelation = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserEvent)
      .where({ user: { id: userId }, event: { id: eventId } })
      .execute()

    return deletedRelation
  } catch (ex) {
    console.log(ex)
  }
}

const getEventUsers = async (eventId: string) => {
  try {
    const results = await getConnection()
      .getRepository(UserEvent)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'user')
      .where('relation."eventId" = :eventId', { eventId })
      .getOne()

    return results
  } catch (ex) {
    console.log(ex)
  }
}

const getEventGroups = async (eventId: string) => {
  try {
    const results = await getConnection()
      .getRepository(Event)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.groups', 'groups', 'groups."isPrivate" = false')
      .where('relation."eventId" = :eventId', { eventId })
      .getOne()

    return results
  } catch (ex) {
    console.log(ex)
  }
}

// gets all the events in my calendar
const getUserEvents = async (userId: string): Promise<Event[] | undefined> => {
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
const getGroupEvents = async (groupId: string): Promise<Event[] | undefined> => {
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
const updateEvent = async ({ userId, eventId, name, description, startTime, endTime, isPrivate }: IUpdateEventDetails): Promise<UpdateResult | undefined> => {
  try {
    const userRelation = await getUserEventRelation(userId, eventId)
    if (!userRelation || userRelation.permissionLevel < 1) throw new Error('No relation or permission level insufficient')

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
const searchEventsUsingRadius = async (radius: number, latitude: number, longitude: number): Promise<Event[] | undefined> => {
  try {
    const radiusInKM = radius * 0.621371
    const latitudeTolerance = (1 / 110.54) * radiusInKM
    const longitudeTolerance = (1 / (111.320 * Math.cos(Number(latitude)))) * radiusInKM

    const results: Event[] = await getConnection()
      .getRepository(Event)
      .createQueryBuilder('event')
      .where(`event."latitude" BETWEEN (:latitude - ${latitudeTolerance}) AND (:latitude + ${latitudeTolerance})`, { latitude })
      .andWhere(`event."longitude" BETWEEN (:longitude - ${longitudeTolerance}) AND (:longitude + ${longitudeTolerance})`, { longitude })
      .limit(50) //TODO
      .getMany()

    return results

  } catch (ex) {
    console.log(ex)
  }
}

const insertHashtagToDb = async (text: string): Promise<Hashtag | undefined> => {
  try {

    const hashtag = new Hashtag()
    hashtag.text = `#${text}`
    await getConnection().manager.save(hashtag)

    return hashtag

  } catch (ex) {
    console.log(ex)
  }
}

const assignHashtagToEvent = async ({ hashtagId, eventId }: IEventHashtag):
  Promise<{
    event: Event;
    hashtag: Hashtag;
  } | undefined> => {
  try {
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
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

const unassignHashtagFromEvent = async ({ hashtagId, eventId }: IEventHashtag) => {
  try {
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ id: hashtagId })

    if (event && hashtag) {

      await getConnection()
        .createQueryBuilder()
        .relation(Event, 'hashtags')
        .of(event)
        .remove(hashtag)

      return { event, hashtag }
    }
  } catch (ex) {
    console.log(ex)
  }
}

const getHashtagByText = async (text: string): Promise<Hashtag | undefined> => {
  try {
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ text: `#${text}` })
    return hashtag
  } catch (ex) {
    console.log(ex)
  }
}

const getEventHashtags = async (eventId: string): Promise<Hashtag[] | undefined> => {
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

const getHashtagById = async (id: string): Promise<Hashtag | undefined> => {
  try {
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ id })
    return hashtag
  } catch (ex) {
    console.log(ex)
  }
}

const searchHashtags = async (searchVal: string): Promise<Hashtag[] | undefined> => {
  try {

    const results = await getConnection()
      .getRepository(Hashtag)
      .createQueryBuilder('hashtag')
      .where(`hashtag."text" ILIKE '%${searchVal}%'`)
      .getMany()

    return results

  } catch (ex) {
    console.log(ex)
  }
}

// uses event's name and hashtags to fetch events based on a string search value
const searchEventsByName = async (searchVal: string): Promise<Event[] | undefined> => {
  try {

    const results = await getConnection()
      .getRepository(Event)
      .createQueryBuilder('event')
      .where(`event."name" ILIKE '%${searchVal}%'`)
      .andWhere(`event."isPrivate" = false`)
      .getMany()

    return results

  } catch (ex) {
    console.log(ex)
  }
}

const searchEventsByHashtags = async (searchVal: string): Promise<Event[] | undefined> => {
  try {

    const results = await getConnection()
      .getRepository(Hashtag)
      .createQueryBuilder('hashtag')
      .leftJoinAndSelect('hashtag.events', 'events')
      .where(`hashtag."text" ILIKE '%${searchVal}%'`)
      .getMany()
      .then(hashtags => hashtags.reduce((acc: Event[], curr) => {
        curr.events = curr.events.filter(event => !event.isPrivate) //TODO
        curr.events.filter(event => !acc.find(e => e.id === event.id)).forEach(event => acc.push(event))// TODOOOOOOOO
        return acc
      }, []))

    return results

  } catch (ex) {
    console.log(ex)
  }
}

export {
  insertEventToDb,
  assignEventToGroup,
  unassignEventFromGroup,
  getUserEventRelation,
  assignEventToUser,
  unassignEventFromUser,
  getUserEvents,
  getGroupEvents,
  getEventUsers,
  getEventGroups,
  updateEvent,
  searchHashtags,
  searchEventsUsingRadius,
  searchEventsByName,
  searchEventsByHashtags,
  getHashtagByText,
  getHashtagById,
  insertHashtagToDb,
  assignHashtagToEvent,
  unassignHashtagFromEvent,
  getEventHashtags
}