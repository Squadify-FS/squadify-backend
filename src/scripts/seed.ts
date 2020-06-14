/* eslint-disable @typescript-eslint/no-unused-vars */
import { createConnection, getConnection } from "typeorm";
import { User, Group, Message, Event, Chat, UserUser, UserGroup, Geolocation, UserEvent, IOU, Hashtag } from "../models";

import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb, acceptFriendRequest } from '../controller/user'
import { insertNewGroupToDb, inviteUserToGroup, acceptInviteToGroup } from '../controller/group'

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
      Group,
      Message,
      Event,
      Chat,
      Geolocation,
      UserEvent,
      IOU,
      Hashtag
    ], // DB models go here, have to be imported on top of this file
    synchronize: true,
    logging: false,
  })

  const admin = await insertNewUserToDb({ firstName: 'admin', lastName: 'admin', password: 'password', email: 'admin@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user1 = await insertNewUserToDb({ firstName: 'user1', lastName: 'user1', password: 'password', email: 'user1@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user2 = await insertNewUserToDb({ firstName: 'user2', lastName: 'user2', password: 'password', email: 'user2@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user3 = await insertNewUserToDb({ firstName: 'user3', lastName: 'user3', password: 'password', email: 'user3@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })

  const group1 = await insertNewGroupToDb({ name: 'group1', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const group2 = await insertNewGroupToDb({ name: 'group2', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  console.log('GROUP1', group1?.group.identifiers[0], group1?.chat.identifiers[0])
  await inviteUserToGroup(group1?.group.identifiers[0].id, admin.identifiers[0].id, user1.identifiers[0].id)
  await inviteUserToGroup(group2?.group.identifiers[0].id, admin.identifiers[0].id, user1.identifiers[0].id)
  await acceptInviteToGroup(user1.identifiers[0].id, group1?.group.identifiers[0].id)
  await acceptInviteToGroup(user1.identifiers[0].id, group2?.group.identifiers[0].id)

  const relation1 = await sendFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const relation2 = await sendFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)
  const relation3 = await sendFriendRequest(admin.identifiers[0].id, user3.identifiers[0].id)
  const relation4 = await sendFriendRequest(user2.identifiers[0].id, user1.identifiers[0].id)
  const relation5 = await sendFriendRequest(user1.identifiers[0].id, user3.identifiers[0].id)
  const acceptRelation1 = await acceptFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  console.log('RELATION1 after accepted', relation1)
  console.log('RELATION2', relation2)

  // const adminFriends = await getUserFriendsFromDb(admin.identifiers[0].id)
  // const adminRequests = await getUserRequestsFromDb(admin.identifiers[0].id)
  // const user1Friends = await getUserFriendsFromDb(user1.identifiers[0].id)
  // const user1Requests = await getUserRequestsFromDb(user1.identifiers[0].id)
  // console.log('ADMIN FRIENDS', adminFriends)
  // console.log('ADMIN REQUESTS', adminRequests.sentRequests[0].friend)
  // console.log('ADMIN REQUESTS', adminRequests.incomingRequests[0].friend)
  // console.log('user1 friends', user1Friends)
  // console.log('user1 reqs', user1Requests.sentRequests[0].friend)
  // console.log('user1 reqs', user1Requests.incomingRequests[0].friend)



})()