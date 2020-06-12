import { getConnection } from 'typeorm';

import { Event, Group, User, UserGroup } from '../models'

// interface NewEventDetails {
//   name: string;
//   description: string;
//   dateAndTime: Date;
//   isPrivate: boolean;
// }

//TODO
const insertEventToDb = async (userId: string, name: string, description: string, dateAndTime: Date, isPrivate: boolean) => {
  try {
    const user = await getConnection().getRepository(User).findOne({ id: userId });
    if (!user) throw new Error('Something went wrong finding user')
    // const event = await getConnection()
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Event)
    //   .values({ name, description, dateAndTime, isPrivate })
    //   .returning('*')
    //   .execute();

    const event = new Event()
    event.name = name
    event.description = description
    event.dateAndTime = dateAndTime
    event.isPrivate = isPrivate

    user.events.push(event)

    await getConnection().manager.save(event)
    await getConnection().manager.save(user)

    return event

  } catch (ex) {
    console.log(ex)
  }
}

const assignEventToGroup = async (userId: string, eventId: string, groupId: string) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    const event = await getConnection().getRepository(Event).findOne({ id: eventId })
    const user = await getConnection().getRepository(User).findOne({ id: userId })

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
      .relation(Event, 'users')
      .of(event)
      .add(user);

    return { group, event }

  } catch (ex) {
    console.log(ex)
  }
}

export {
  insertEventToDb,
  assignEventToGroup
}