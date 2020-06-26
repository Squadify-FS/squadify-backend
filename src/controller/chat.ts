import { getConnection, InsertResult } from 'typeorm';

import { Message, UserGroup, Group, Chat, User } from '../models'
import { INewMessageInterface } from '../types/groupTypes';


// adds message to chat (kinda like sendMessage). Handles the permission levels and if the user is permitted to write messages in the chat. 
// also has an imageUrl option in case the message contains an image, which could be handled with an S3 imageUrl that then is displayed in the frontend.
// returns the message object (identifiers, raw and generatedmaps)
const addMessageToChat = async ({ userId, chatId, groupId, text, imageUrl }: INewMessageInterface): Promise<InsertResult> => {
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

    const user = await getConnection()
      .getRepository(User)
      .findOne(userId)

    return message
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// gets the group's assigned chat entity
const getChatFromGroup = async (groupId: string): Promise<Chat | undefined> => {
  try {
    const group = await getConnection()
      .getRepository(Group)
      .findOne(groupId, { relations: ['chat'] })
    return group?.chat

  } catch (ex) {
    console.log(ex)
  }
}

// gets the chat's messages. Should be modified later for pagination. Also add orderBy. TODO
const getMessagesFromChat = async (chatId: string): Promise<Message[] | undefined> => {
  try {
    const messages = await getConnection()
      .getRepository(Message)
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .where('message."chatId" = :chatId', { chatId })
      .orderBy('message."createdAt"', 'DESC')
      .getMany()

    return messages

  } catch (ex) {
    console.log(ex)
  }
}

export {
  addMessageToChat,
  getChatFromGroup,
  getMessagesFromChat
}