import { createConnection } from "typeorm";
import { User, Group, Message, Event, Chat, UserUser, UserGroup, UserGeolocation, EventGeolocation, Geolocation } from "../models";

import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb } from '../controller/user'

import "reflect-metadata";

(async () => {
  await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres', //can be changed, but each of us would have to make a user with this username in their psql
    database: 'squadify_db',
    password: '123456',
    entities: [
      User,
      UserUser,
      UserGroup,
      UserGeolocation,
      Group,
      Message,
      Event,
      EventGeolocation,
      Chat,
      Geolocation
    ], // DB models go here, have to be imported on top of this file
    synchronize: true,
    logging: false,
  })

  const admin = await insertNewUserToDb({ firstName: 'admin', lastName: 'admin', password: 'password', email: 'admin@gmail.com', dob: '08-10-1995' })
  const user1 = await insertNewUserToDb({ firstName: 'user1', lastName: 'user1', password: 'password', email: 'user1@gmail.com', dob: '08-10-1995' })
  const user2 = await insertNewUserToDb({ firstName: 'user2', lastName: 'user2', password: 'password', email: 'user2@gmail.com', dob: '08-10-1995' })

  console.log('ADMIN ID', admin.identifiers[0].id)
  console.log('USER1', user1.identifiers[0])
  console.log('USER2', user2.identifiers[0])

  /*
  const relation1 = await sendFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const relation2 = await sendFriendRequest(user1.identifiers[0].id, user2.identifiers[0].id)
  const relation3 = await sendFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)

  console.log(relation1, relation2, relation3)

  const adminFriends = await getUserFriendsFromDb(admin.identifiers[0].id)
  const adminRequests = await getUserRequestsFromDb(admin.identifiers[0].id)

  console.log('ADMIN FRIENDS', adminFriends)
  console.log('ADMIN REQUESTS', adminRequests)
  */
})()