/* eslint-disable @typescript-eslint/no-unused-vars */
import { createConnection, getConnection } from "typeorm";
import { User, Group, Message, Event, Chat, UserUser, UserGroup, Geolocation, UserEvent, IOU, Hashtag } from "../models";

import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb, acceptFriendRequest, getUserFromDb, deleteFriend, searchUserByEmail } from '../controller/user'
import { insertNewGroupToDb, inviteUserToGroup, acceptInviteToGroup, getGroupUsers, deleteGroup, getUserGroups } from '../controller/group'

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

  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // users
  const admin = await insertNewUserToDb({ firstName: 'admin', lastName: 'admin', password: 'password', email: 'admin@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user1 = await insertNewUserToDb({ firstName: 'user1', lastName: 'user1', password: 'password', email: 'user1@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user2 = await insertNewUserToDb({ firstName: 'user2', lastName: 'user2', password: 'password', email: 'user2@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user3 = await insertNewUserToDb({ firstName: 'user3', lastName: 'user3', password: 'password', email: 'user3@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })

  const relation1 = await sendFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const relation2 = await sendFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)
  const relation3 = await sendFriendRequest(admin.identifiers[0].id, user3.identifiers[0].id)
  const relation4 = await sendFriendRequest(user2.identifiers[0].id, user1.identifiers[0].id)
  const relation5 = await sendFriendRequest(user1.identifiers[0].id, user3.identifiers[0].id)
  const acceptRelation1 = await acceptFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const acceptRelation2 = await acceptFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)

  const adminFriends = await getUserFriendsFromDb(admin.identifiers[0].id)
  const adminRequests = await getUserRequestsFromDb(admin.identifiers[0].id)
  const user1Friends = await getUserFriendsFromDb(user1.identifiers[0].id)
  const user1Requests = await getUserRequestsFromDb(user1.identifiers[0].id)

  const adminEntity = await getUserFromDb('', admin.identifiers[0].id)
  await deleteFriend(admin.identifiers[0].id, user2.identifiers[0].id)
  const emailSearch = await searchUserByEmail('user')



  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // groups
  const group1 = await insertNewGroupToDb({ name: 'group1', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })

  const group2 = await insertNewGroupToDb({ name: 'group2', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })

  const peopleInGroup1 = await getGroupUsers(group1?.group.identifiers[0].id,)

  console.log()

  /**
   * inviteUserToGroup 1
   * acceptInviteToGroup 1
   * getGroupUsers 1
   * deleteGroup 1
   * 
   */
})()