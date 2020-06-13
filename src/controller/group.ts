import { getConnection, InsertResult } from 'typeorm';

import { Group, UserGroup, Chat, User } from '../models'

interface IGroupInterface {
  name: string;
  isPrivate: boolean;
  creatorId: string;
  friendIds?: string[];
}

/*
FUNCTION WILL:
  create new group
  attach new chat to it
  attach creator of group as admin by creating relation in UserGroup join table
  send invitations to users admin invited when creating group in frontend form by creating relation in UserGroup join table
  return newly created group and chat
*/
const insertNewGroupToDb = async ({ name, isPrivate, creatorId, friendIds }: IGroupInterface) => {
  try {

    const group: InsertResult = await getConnection() //create group and get id
      .createQueryBuilder()
      .insert()
      .into(Group)
      .values({ name, isPrivate })
      .returning('*')
      .execute()
    const groupId: string = group.identifiers[0].id;

    const chat: InsertResult = await getConnection() // create chat, assign group to it and get id
      .createQueryBuilder()
      .insert()
      .into(Chat)
      .values({ group: { id: groupId } })
      .returning('*')
      .execute()
    const chatId: string = chat.identifiers[0].id;

    await getConnection() // assign chat back to group previously created
      .createQueryBuilder()
      .update(Group)
      .set({ chat: { id: chatId } })
      .where({ id: groupId })
      .returning('*')
      .execute();

    const adminRelation = await getConnection() // create relation between group and admin (note accepted is set to true)
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ user: { id: creatorId }, group: { id: groupId }, permissionLevel: 2, accepted: true })
      .returning('*')
      .execute();

    if (friendIds) { // invite users to join group, by setting accepted to false
      friendIds.map(async (userId: string): Promise<InsertResult> => {
        return await getConnection()
          .createQueryBuilder()
          .insert()
          .into(UserGroup)
          .values({ user: { id: userId }, group: { id: groupId }, permissionLevel: 1, accepted: false })
          .returning('*')
          .execute();
      })
    }


    return { group, chat, adminRelation, friends: friendIds }
  } catch (ex) {
    console.log(ex)
  }
}

const updateGroupInfo = async (groupId: string, name?: string, isPrivate?: boolean, avatarUrl?: string) => {
  try {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Group)
      .set({ name, isPrivate, avatarUrl })
      .where({ id: groupId })
      .returning('*')
      .execute();

    return result
  } catch (ex) {
    console.log(ex)
  }
}

const setGroupFollowersReadOnly = async (groupId: string, followersReadOnly: boolean) => {
  try {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Group)
      .set({ followersReadOnly })
      .where({ id: groupId })
      .returning('*')
      .execute();

    return result
  } catch (ex) {
    console.log(ex)
  }
}

const deleteGroup = async (groupId: string, adminId: string) => {
  try {
    const adminRelation = await getConnection()
      .getRepository(UserGroup)
      .findOne({ user: { id: adminId }, group: { id: groupId } });
    if (adminRelation && adminRelation.permissionLevel < 1) throw new Error("You don't have admin permission in this group")

    const deletedRelations = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserGroup)
      .where({ group: { id: groupId } })
      .execute()

    const deletedGroup = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(Group)
      .where({ id: groupId })

    return { deletedGroup, deletedRelations }

  } catch (ex) {
    console.log(ex)
  }
}

const getUserGroups = async (userId: string) => {
  try {
    const groups: Group[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."userId" = :userId AND relation.accepted = true`, { userId })
      .getMany()
      .then(relations => relations.map(relation => relation.group))

    return groups
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const getUserGroupInvitations = async (userId: string) => {
  try {
    const sentInvitations: User[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'user')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."inviterId" = :userId AND relation.accepted = false`, { userId })
      .getMany()
      .then(relations => relations.map(relation => relation.user))

    const receivedInvitations: {
      inviter: User;
      group: Group;
    }[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.inviter', 'inviter')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."userId" = :userId AND relation.accepted = false`, { userId })
      .getMany()
      .then(relations => relations.map(relation => ({ inviter: relation.inviter, group: relation.group })))

    return { sentInvitations, receivedInvitations }

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
    if (group.isPrivate && inviterRelationWithGroup.permissionLevel < 1) throw new Error("You don't have permission to perform this action")


    const newRelation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ inviter: { id: inviterId }, user: { id: inviteeId }, group: { id: groupId }, permissionLevel: 1, accepted: false })
      .returning('*')
      .execute();

    return newRelation

  } catch (ex) {
    console.log(ex)
  }
}

const acceptInviteToGroup = async (userId: string, groupId: string) => {
  try {
    const relation = await getConnection()
      .createQueryBuilder()
      .update(UserGroup)
      .set({ accepted: true })
      .where({ user: { id: userId }, group: { id: groupId } })
      .execute()

    return relation
  } catch (ex) {
    console.log(ex)
  }
}

const rejectInviteToGroup = async (userId: string, groupId: string) => {
  try {
    const deletedRelation = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserGroup)
      .where({ user: { id: userId }, group: { id: groupId } })
      .execute()

    return deletedRelation
  } catch (ex) {
    console.log(ex)
  }
}

const removeUserFromGroup = async (removerId: string, userId: string, groupId: string) => {
  try {
    if (removerId !== userId) { // used to manage if user is leaving group or admin is removing them
      const removerRelationToGroup = await getConnection()
        .getRepository(UserGroup)
        .findOne({ user: { id: removerId }, group: { id: groupId } });
      if (!removerRelationToGroup || removerRelationToGroup.permissionLevel < 2) throw new Error("You don't have permission to perform this action")
    }

    const deletedRelation = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserGroup)
      .where({ user: { id: userId }, group: { id: groupId } })
      .execute()

    return deletedRelation
  } catch (ex) {
    console.log(ex)
  }
}

const followPublicGroup = async (userId: string, groupId: string) => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    if (!group) throw new Error('Something went wrong finding group')

    if (group.isPrivate) throw new Error('Cannot follow a private group. Invitation only.')

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ user: { id: userId }, group: { id: groupId }, permissionLevel: 0, accepted: false })
      .returning('*')
      .execute();

    return relation
  } catch (ex) {
    console.log(ex)
  }
}

export {
  insertNewGroupToDb,
  deleteGroup,
  updateGroupInfo,
  getUserGroups,
  getUserGroupInvitations,
  inviteUserToGroup,
  acceptInviteToGroup,
  rejectInviteToGroup,
  removeUserFromGroup,
  followPublicGroup,
  setGroupFollowersReadOnly
}