import { getConnection } from 'typeorm';

import { Message, UserGroup } from '../models'

const addMessageToChat = async (userId: string, chatId: string, groupId: string, text: string, imageUrl?: string) => {
  try {
    const relation = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: userId }, group: { id: groupId } })
    if (!relation) throw new Error('User is not part of this chat')

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

export {
  addMessageToChat
}