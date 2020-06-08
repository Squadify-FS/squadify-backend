import { getConnection, InsertResult } from 'typeorm';

import { User, Group, UserGroup, Chat } from '../models'

interface INewGroupInterface {
  name: string;
  isPrivate: boolean;
  creatorId: string;
  invitedUsersIds?: string[];
}

/*
FUNCTION WILL:
  create new group
  attach new chat to it
  attach creator of group as admin by creating relation in UserGroup join table
  send invitations to users admin invited when creating group in frontend form by creating relation in UserGroup join table
  return newly created group and chat
*/
const insertNewGroupToDb = async ({ name, isPrivate, creatorId, invitedUsersIds }: INewGroupInterface) => {
  try {

    const group: InsertResult = await getConnection() //create group and get Id
      .createQueryBuilder()
      .insert()
      .into(Group)
      .values({ name, isPrivate })
      .execute()
    const groupId: string = group.identifiers[0].id;

    const chat: InsertResult = await getConnection() // create chat, assign group to it and get Id
      .createQueryBuilder()
      .insert()
      .into(Chat)
      .values({ group: { id: groupId } })
      .execute()
    const chatId: string = chat.identifiers[0].id;

    await getConnection() // assign chat back to group previously created
      .createQueryBuilder()
      .update(Group)
      .set({ chat: { id: chatId } })
      .where({ id: groupId })
      .execute();

    await getConnection() // create relation between group and admin (note accepted is automatically true)
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ user: { id: creatorId }, group: { id: groupId }, permissionLevel: 1, accepted: true })
      .execute();

    if (invitedUsersIds) { // invite users to join group, by setting accepted to false
      invitedUsersIds.forEach(async (userId: string): Promise<void> => {
        await getConnection()
          .createQueryBuilder()
          .insert()
          .into(UserGroup)
          .values({ user: { id: userId }, group: { id: groupId }, permissionLevel: 0, accepted: false })
          .execute();
      })
    }

    return { group, chat }
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const inviteUserToGroup = async (groupId: string, inviterId: string, inviteeId: string) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    if (!group) throw new Error('Something went wrong in querying group')

    const inviterRelationWithGroup = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: inviterId }, group: { id: groupId } });
    if (!inviterRelationWithGroup) throw new Error('User is not part of this group!!')
    if (group.isPrivate) {
      if (inviterRelationWithGroup.permissionLevel < 1) throw new Error("You don't have permission to perform this action")
    }

    const newRelation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ user: { id: inviteeId }, group: { id: groupId }, permissionLevel: 0, accepted: false })
      .execute();

    return newRelation

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}


export {
  insertNewGroupToDb,
  inviteUserToGroup
}