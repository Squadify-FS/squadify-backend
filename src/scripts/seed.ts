import { createConnection, getConnection } from "typeorm";
import { User, Group, Message, Event, Chat, UserUser, UserGroup, UserGeolocation, EventGeolocation, Geolocation } from "../models";

import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb, acceptFriendRequest } from '../controller/user'
import { insertNewGroupToDb } from '../controller/group'

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
  const user3 = await insertNewUserToDb({ firstName: 'user3', lastName: 'user3', password: 'password', email: 'user3@gmail.com', dob: '08-10-1995' })


  const group1 = await insertNewGroupToDb({ name: 'group1', isPrivate: false, creatorId: admin.identifiers[0].id, invitedUsersIds: [user1.identifiers[0].id, user2.identifiers[0].id] })
  console.log('GROUP1', group1?.group.identifiers[0], group1?.chat.identifiers[0])


  const relation1 = await sendFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const relation2 = await sendFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)
  const relation3 = await sendFriendRequest(admin.identifiers[0].id, user3.identifiers[0].id)

  const relation4 = await sendFriendRequest(user2.identifiers[0].id, user1.identifiers[0].id)
  const relation5 = await sendFriendRequest(user1.identifiers[0].id, user3.identifiers[0].id)

  const acceptedRelation1 = await acceptFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)

  console.log('RELATION1 after accepted', relation1)
  console.log('RELATION2', relation2)
  console.log('RELATION3', relation3)
  console.log('RELATION4', relation4)
  console.log('RELATION5', relation5)


  const adminFriends = await getUserFriendsFromDb(admin.identifiers[0].id)
  const adminRequests = await getUserRequestsFromDb(admin.identifiers[0].id)

  const user1Friends = await getUserFriendsFromDb(user1.identifiers[0].id)
  const user1Requests = await getUserRequestsFromDb(user1.identifiers[0].id)


  // THIS IS HOW TO GET FRIENDS AND REQUESTS NOW
  // const test = await getConnection() // gets all friends and requests
  //   .getRepository(UserUser)
  //   .createQueryBuilder('relation')
  //   .leftJoinAndSelect('relation.friend', 'friend')
  //   .where(`relation."userId" = :userId OR relation."friendId" = :userId`, { userId: admin.identifiers[0].id })
  //   .getMany()

  // console.log('TEST', test)

  // const test2 = await getConnection() //gets incoming requests
  //   .getRepository(UserUser)
  //   .createQueryBuilder('relation')
  //   .leftJoinAndSelect('relation.user', 'user')
  //   .where(`relation."friendId" = :userId`, { userId: user2.identifiers[0].id })
  //   .andWhere(`relation."accepted" = false`)
  //   .getMany()

  // console.log('TEST2', test2)

  console.log('ADMIN FRIENDS', adminFriends)
  console.log('ADMIN REQUESTS', adminRequests.sentRequests[0].friend)
  console.log('ADMIN REQUESTS', adminRequests.incomingRequests[0].friend)

  console.log('user1 friends', user1Friends)
  console.log('user1 reqs', user1Requests.sentRequests[0].friend)
  console.log('user1 reqs', user1Requests.incomingRequests[0].friend)

})()