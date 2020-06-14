import { getConnection } from 'typeorm';

import { Event, Group, User, UserGroup, UserEvent } from '../models'

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

// const updateEvent = async (eventId: string) => {

// }

export {
  insertEventToDb,
  assignEventToGroup,
  unassignEventFromGroup,
  assignEventToUser,
  unassignEventFromUser,
  getUserEvents
}