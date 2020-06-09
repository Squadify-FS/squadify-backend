import { getConnection } from 'typeorm';

import { Message } from '../models'

const addMessageToChat = async (userId: string, chatId: string, text: string, imageUrl?: string) => {
  try {
    const message = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Message)
      .values({ user: { id: userId }, chat: { id: chatId }, text, imageUrl })
      .execute()

    return message
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

export {
  addMessageToChat
}