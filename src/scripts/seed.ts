/* eslint-disable @typescript-eslint/no-unused-vars */
import { resolve } from 'path';
import { config } from 'dotenv'
config()

import { createConnection } from "typeorm";
import { User, Group, Message, Event, Chat, UserUser, UserGroup, Geolocation, UserEvent, IOU, Hashtag } from "../models";

import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb, acceptFriendRequest, getUserFromDb, deleteFriend, searchUsersByEmail, getChatFromGroup, addMessageToChat, getMessagesFromChat, insertEventToDb, assignEventToGroup, getUserEvents, getGroupEvents, assignEventToUser, insertHashtagToDb, assignHashtagToEvent, getHashtagByText, getEventHashtags, searchHashtags, searchEventsByName, searchEventsByHashtags } from '../controller'
import { insertNewGroupToDb, inviteUserToGroup, acceptInviteToGroup, getGroupUsers, deleteGroup, getUserGroups, getGroupFromDb, followPublicGroup, setGroupFollowersReadOnly, updateGroupInfo, setGroupIsPrivate, getGroupFriends, getGroupFollowers, getGroupUserInvitations, rejectInviteToGroup, removeUserFromGroup, getUserGroupInvitations, searchGroupsByName } from '../controller'

import "reflect-metadata";

(async () => {
  await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER, //can be changed, but each of us would have to make a user with this username in their psql
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
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
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // users
  const admin = await insertNewUserToDb({ firstName: 'admin', lastName: 'admin', password: 'password', email: 'admin@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user1 = await insertNewUserToDb({ firstName: 'user1', lastName: 'user1', password: 'password', email: 'user1@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user2 = await insertNewUserToDb({ firstName: 'user2', lastName: 'user2', password: 'password', email: 'user2@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const user3 = await insertNewUserToDb({ firstName: 'user3', lastName: 'user3', password: 'password', email: 'user3@gmail.com', dob: '08-10-1995', avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })

  const group1 = await insertNewGroupToDb({ name: 'group1', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  const group2 = await insertNewGroupToDb({ name: 'group2', isPrivate: false, creatorId: admin.identifiers[0].id, avatarUrl: 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png' })
  console.log('GROUP1', group1?.group.identifiers[0], group1?.chat.identifiers[0])
  await inviteUserToGroup(group1?.group.identifiers[0].id, admin.identifiers[0].id, user1.identifiers[0].id)
  await inviteUserToGroup(group2?.group.identifiers[0].id, admin.identifiers[0].id, user1.identifiers[0].id)
  await acceptInviteToGroup({ userId: user1.identifiers[0].id, groupId: group1?.group.identifiers[0].id })
  await acceptInviteToGroup({ userId: user1.identifiers[0].id, groupId: group2?.group.identifiers[0].id })

  const relation1 = await sendFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  const relation2 = await sendFriendRequest(admin.identifiers[0].id, user2.identifiers[0].id)
  const relation3 = await sendFriendRequest(admin.identifiers[0].id, user3.identifiers[0].id)
  const relation4 = await sendFriendRequest(user2.identifiers[0].id, user1.identifiers[0].id)
  const relation5 = await sendFriendRequest(user1.identifiers[0].id, user3.identifiers[0].id)
  console.log('RELATION1 before accepted', relation1)
  const acceptRelation1 = await acceptFriendRequest(admin.identifiers[0].id, user1.identifiers[0].id)
  console.log('RELATION1 after accepted', relation1)
  console.log('RELATION2', relation2)

  const adminFriends = await getUserFriendsFromDb(admin.identifiers[0].id)
  const adminRequests = await getUserRequestsFromDb(admin.identifiers[0].id)
  const user1Friends = await getUserFriendsFromDb(user1.identifiers[0].id)
  const user1Requests = await getUserRequestsFromDb(user1.identifiers[0].id)
  const emailSearch = await searchUsersByEmail('user')
  const adminEntity = await getUserFromDb('', admin.identifiers[0].id)
  await deleteFriend(admin.identifiers[0].id, user2.identifiers[0].id)
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // groups
  /**
   * inviteUserToGroup 1
   * acceptInviteToGroup 1
   * getGroupUsers 1
   * deleteGroup 2
   * 
   */

  await inviteUserToGroup(group1?.group.identifiers[0].id, admin.identifiers[0].id, user1.identifiers[0].id)
  await inviteUserToGroup(group1?.group.identifiers[0].id, admin.identifiers[0].id, user2.identifiers[0].id)
  await acceptInviteToGroup({ userId: user1.identifiers[0].id, groupId: group1?.group.identifiers[0].id })

  console.log('**********FOLLOW PUBLIC GROUP (USER1, GROUP2)**********\n', await followPublicGroup({ userId: user1.identifiers[0].id, groupId: group2?.group.identifiers[0].id }))


  const group1Entity = await getGroupFromDb(group1?.group.identifiers[0].id)
  const peopleInGroup1 = await getGroupUsers(group1?.group.identifiers[0].id)
  const friendsInGroup1 = await getGroupFriends(group1?.group.identifiers[0].id)

  console.log("**********GET ADMIN'S GROUPS: SHOULD BE GROUP1 AND GROUP2**********\n", await getUserGroups(admin.identifiers[0].id))
  console.log('**********GET ADMIN INVITATIONS: SHOULD BE 1 SENT TO USER2 IN GROUP1**********\n', (await getUserGroupInvitations(admin.identifiers[0].id)).sentInvitations[0])
  console.log('**********GET user2 INVITATIONS: SHOULD BE 1 INCOMING FROM ADMIN TO GROUP1**********\n', (await getUserGroupInvitations(user2.identifiers[0].id)).receivedInvitations[0])

  console.log('**********GROUP1 ENTITY**********\n', group1Entity)
  console.log('**********PEOPLE IN GROUP 1: SHOULD BE ADMIN AND USER1**********\n', peopleInGroup1)
  console.log('**********FRIENDS IN GROUP 1: SHOULD BE USER1 AND ADMIN**********\n', friendsInGroup1)
  console.log('**********GROUP1 INVITATIONS: SHOULD RETURN USER2**********\n', await getGroupUserInvitations(group1?.group.identifiers[0].id))
  await rejectInviteToGroup({ userId: user2.identifiers[0].id, groupId: group1?.group.identifiers[0].id })
  console.log('**********GROUP1 INVITATIONS AFTER REJECT: SHOULD RETURN NONE**********\n', await getGroupUserInvitations(group1?.group.identifiers[0].id))
  console.log('**********SET GROUP 1 AS PUBLIC: SHOULD RETURN UPDATE RESULT (ISPRIVATE = FALSE)**********\n', await setGroupIsPrivate({ userId: admin.identifiers[0].id, groupId: group1?.group.identifiers[0].id }, false))



  console.log('**********GROUP2 FOLLOWERS: SHOULD BE USER1**********\n', await getGroupFollowers(group2?.group.identifiers[0].id))
  console.log('**********UPDATE GROUP2 INFO: RETURN UPDATE RESULT**********\n', await updateGroupInfo(group2?.group.identifiers[0].id, 'group2 new name', 'https://66.media.tumblr.com/79a1ac638d6e50f1fa5d760be1d8a51a/tumblr_inline_ojk654MOr11qzet7p_250.png'))
  console.log('**********SET READ ONLY GROUP2: RETURN UPDATE RESULT (READONLY = TRUE)**********\n', await setGroupFollowersReadOnly({ userId: admin.identifiers[0].id, groupId: group2?.group.identifiers[0].id }, false))
  await removeUserFromGroup(admin.identifiers[0].id, { userId: user1.identifiers[0].id, groupId: group2?.group.identifiers[0].id })
  console.log('**********GROUP2 FOLLOWERS AFTER REMOVAL BY ADMIN: SHOULD BE NONE**********\n', await getGroupFollowers(group2?.group.identifiers[0].id))

  console.log('**********DELETE GROUP 2**********\n', await deleteGroup({ groupId: group2?.group.identifiers[0].id, userId: admin.identifiers[0].id }))

  console.log('**********SEARCH GROUPS BY NAME: SHOULD RETURN ARRAY WITH GROUP1 (GROUP2 IS DELETED)**********\n', await searchGroupsByName('group'))

  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // chat
  const chat1 = await getChatFromGroup(group1?.group.identifiers[0].id)
  if (!chat1) throw new Error('Chat not found')
  console.log('CHAT1', chat1)
  const message1 = await addMessageToChat({ userId: admin.identifiers[0].id, chatId: chat1?.id, groupId: group1?.group.identifiers[0].id, text: "this is message 1 by admin into group1's chat" })
  const message2 = await addMessageToChat({ userId: user1.identifiers[0].id, chatId: chat1?.id, groupId: group1?.group.identifiers[0].id, text: "this is message 2 by user1 into group1's chat" })
  console.log("**********GET MESSAGES FROM GROUP1'S CHAT: SHOULD RETURN 2 MESSAGES**********\n", await getMessagesFromChat(chat1.id))

  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // *********************************************************************************************************************
  // events

  const event1 = await insertEventToDb({ userId: admin.identifiers[0].id, name: 'Event 1', description: 'Description for event 1', startTime: new Date('2020-10-10 19:10:25-07'), isPrivate: false })
  const event2 = await insertEventToDb({ userId: admin.identifiers[0].id, name: 'Event 2', description: 'Description for event 2', startTime: new Date('2020-11-11 12:00:00-00'), isPrivate: false })

  console.log('EVENT 1', event1)
  console.log('EVENT 2', event2)
  await assignEventToGroup({ userId: admin.identifiers[0].id, groupId: group1?.group.identifiers[0].id, eventId: event1?.event.identifiers[0].id })
  await assignEventToGroup({ userId: admin.identifiers[0].id, groupId: group1?.group.identifiers[0].id, eventId: event2?.event.identifiers[0].id })

  await assignEventToUser({ userId: user1.identifiers[0].id, eventId: event1?.event.identifiers[0].id })

  console.log("**********ADMIN'S EVENTS: EXPECT EVENT 1 AND 2**********\n", await getUserEvents(admin.identifiers[0].id))
  console.log("**********GROUP1'S EVENTS: EXPECT EVENT 1 AND 2**********\n", await getGroupEvents(group1?.group.identifiers[0].id))
  console.log("**********USER1'S EVENTS: EXPECT ONLY EVENT 1**********\n", await getUserEvents(user1.identifiers[0].id))

  const hashtag1 = await insertHashtagToDb('hashtag1')
  const hashtag2 = await insertHashtagToDb('hashtag2')

  console.log('HASHTAG 1 && 2', [hashtag1, hashtag2])
  if (!event1 || !event2 || !hashtag1 || !hashtag2) throw new Error('Not found')

  console.log('TEST', await assignHashtagToEvent({ hashtagId: hashtag1.id, eventId: event1?.event.identifiers[0].id }))
  console.log('TEST', await assignHashtagToEvent({ hashtagId: hashtag1.id, eventId: event2?.event.identifiers[0].id }))

  console.log('TEST', await assignHashtagToEvent({ hashtagId: hashtag2.id, eventId: event1?.event.identifiers[0].id }))
  console.log('TEST', await assignHashtagToEvent({ hashtagId: hashtag2.id, eventId: event1?.event.identifiers[0].id }))

  console.log('GET HASHTAG1 BY TEXT', await getHashtagByText('hashtag1'))

  console.log('EVENT1 HASHTAGS: H1 AND H2', await getEventHashtags(event1?.event.identifiers[0].id))
  console.log('EVENT2 HASHTAGS: H1', await getEventHashtags(event2?.event.identifiers[0].id))

  console.log('SEARCH HASHTAGS', await searchHashtags('hashtag'))
  console.log('SEARCH EVENTS', await searchEventsByName('vent'))
  console.log('SEARCH EVENTS BY HASHTAGS', await searchEventsByHashtags('hashtag'))


})()