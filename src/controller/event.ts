import { getConnection, getRepository } from 'typeorm';

import { Event, Group, User, UserGroup, UserEvent, Geolocation, Hashtag } from '../models'

// interface NewEventDetails {
//   name: string;
//   description: string;
//   dateAndTime: Date;
//   isPrivate: boolean;
// }

// TODO
const insertEventToDb = async (userId: string, name: string, description: string, isPrivate: boolean, startTime: Date, endTime?: Date) => {
  try {
    const user = await getConnection().getRepository(User).findOne({ id: userId });
    if (!user) throw new Error('Something went wrong finding user')
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

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserEvent)
      .values({
        user: { id: userId },
        permissionLevel: 2
      })
      .returning('*')
      .execute()

    return { group, event }

  } catch (ex) {
    console.log(ex)
  }
}

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
        inviter: { id: inviterId },
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

const fetchEventsUsingRadius = async (geolocationId: string, radius: number) => {
  try {
    const location = await getConnection().getRepository(Geolocation).findOne({ id: geolocationId })

    if (location) {
      const radiusInKM = radius * 0.621371
      const latitudeTolerance = (1 / 110.54) * radiusInKM
      const longitudeTolerance = (1 / (111.320 * Math.cos(Number(location.latitude.toFixed(4))))) * radiusInKM

      const results = await getConnection()
        .createQueryBuilder()
        .select()
        .from(Geolocation, 'location')
        .leftJoinAndSelect('location.events', 'location')
        .where(`location."latitude" BETWEEN (location."latitude" - ${latitudeTolerance}) AND (location."latitude" + ${latitudeTolerance})`)
        .andWhere(`location."longitude" BETWEEN (location."longitude" - ${longitudeTolerance}) AND (location."longitude" + ${longitudeTolerance})`)
        .limit(50) //TODO
        .getMany()
        .then(geolocations => geolocations.reduce((acc: Event[], curr: Geolocation) => {
          acc.concat(curr.events)
          return acc
        }, []))

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

const fetchEventsUsingNameOrTags = async (searchVal: string) => {
  try {

    const nameResults = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Event, 'event')
      .leftJoin('event.hashtags', 'hashtag')
      .where(`event.name LIKE "%${searchVal}%"`)
      .getMany()

    const hashtagResults = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Hashtag, 'hashtag')
      .leftJoinAndSelect('hashtag.events', 'events')
      .where(`hashtag.text LIKE "%${searchVal}%"`)
      .getMany()
      .then(hashtags => hashtags.reduce((acc: Event[], curr) => {
        acc.concat(curr.events)
        return acc
      }, []))

    return [...nameResults, hashtagResults]

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
  updateEvent,
  fetchEventsUsingRadius,
  fetchEventsUsingNameOrTags
}