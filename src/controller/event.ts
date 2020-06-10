import { getConnection } from 'typeorm';

import { Event, Group, Geolocation, User, UserGroup } from '../models'

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