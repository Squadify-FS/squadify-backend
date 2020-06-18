import { getConnection } from 'typeorm';

import { Message, UserGroup, Group, Chat } from '../models'


// adds message to chat (kinda like sendMessage). Handles the permission levels and if the user is permitted to write messages in the chat. 
// also has an imageUrl option in case the message contains an image, which could be handled with an S3 imageUrl that then is displayed in the frontend.
// returns the message object (identifiers, raw and generatedmaps)
const addMessageToChat = async ({ userId, chatId, groupId, text, imageUrl }: INewMessageInterface) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })

    const relation = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: userId }, group: { id: groupId } })
    if (!relation) throw new Error('User is not part of this chat')
    if (group && group.followersReadOnly) {
      if (relation.permissionLevel < 1) throw new Error('Group is set to followers read only.')
    }


    const message = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Message)
      .values({ user: { id: userId }, chat: { id: chatId }, text, imageUrl })
      .returning('*')
      .execute();

    return message
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// gets the group's assigned chat entity
const getChatFromGroup = async (groupId: string) => {
  try {
    const group = await getConnection()
      .getRepository(Group)
      .findOne(groupId, { relations: ['chat'] })
    return group?.chat

  } catch (ex) {
    console.log(ex)
  }
}

// gets the chat's messages. Should be modified later for pagination.
const getMessagesFromChat = async (chatId: string) => {
  try {
    const chat = await getConnection()
      .getRepository(Chat)
      .findOne(chatId, { relations: ['messages'] })
    return chat?.messages

  } catch (ex) {
    console.log(ex)
  }
}

export {
  addMessageToChat,
  getChatFromGroup,
  getMessagesFromChat
}