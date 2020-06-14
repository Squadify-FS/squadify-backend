import { getConnection } from 'typeorm';

import { Message, UserGroup, Group, Chat } from '../models'

const addMessageToChat = async (userId: string, chatId: string, groupId: string, text: string, imageUrl?: string) => {
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