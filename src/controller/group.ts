import { getConnection, InsertResult, getRepository, UpdateResult, DeleteResult } from 'typeorm';
import { generateHashForName } from "../common/functions";
import { Group, UserGroup, Chat, User } from '../models'
import { INewGroupInterface, IUserGroupIds } from '../types/groupTypes';

const getUserGroupRelation = async (userId: string, groupId: string): Promise<UserGroup | undefined> => {
  const relation = await getConnection()
    .getRepository(UserGroup)
    .findOne({ user: { id: userId }, group: { id: groupId } })

  if (relation) return relation
}


/*
FUNCTION WILL:
  create new group
  attach new chat to it
  attach creator of group as admin by creating relation in UserGroup join table
  send invitations to users admin invited when creating group in frontend form by creating relation in UserGroup join table
  return newly created group and chat
*/
const insertNewGroupToDb = async ({ name, isPrivate, creatorId, friendIds, followersReadOnly, avatarUrl }: INewGroupInterface):
  Promise<{
    group: InsertResult;
    chat: InsertResult;
    adminRelation: InsertResult;
    friends: string[] | undefined;
  } | undefined> => {
  try {

    let hashedName = `${name}${generateHashForName()}`
    const alreadyExists = await getConnection().getRepository(Group).findOne({ name: hashedName }) // might not event need this due to possibilities of the hash (62 ^ 6 = 56 billion) TODO
    if (alreadyExists) {
      hashedName = `${name}${generateHashForName()}`
    }

    const group: InsertResult = await getConnection() //create group and get id
      .createQueryBuilder()
      .insert()
      .into(Group)
      .values({ name: hashedName, isPrivate, avatarUrl, followersReadOnly })
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

// returns the group entity
const getGroupFromDb = async (groupId: string): Promise<Group | undefined> => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId });
    if (group) {
      return group;
    }
  } catch (ex) {
    console.log(ex)
  }
}

// must be sent the info that is going to be changed aswell as the info that won't be changed
const updateGroupInfo = async (groupId: string, name: string, avatarUrl: string): Promise<UpdateResult | undefined> => {
  try {
    let hashedName = `${name}${generateHashForName()}`
    const alreadyExists = await getConnection().getRepository(Group).findOne({ name: hashedName }) // might not event need this due to possibilities of the hash (62 ^ 6 = 56 billion) TODO
    if (alreadyExists) {
      hashedName = `${name}${generateHashForName()}`
    }

    const result = await getConnection()
      .createQueryBuilder()
      .update(Group)
      .set({ name: hashedName, avatarUrl })
      .where({ id: groupId })
      .returning('*')
      .execute();

    return result
  } catch (ex) {
    console.log(ex)
  }
}

const setGroupIsPrivate = async ({ userId, groupId }: IUserGroupIds, isPrivate: boolean): Promise<UpdateResult | undefined> => {
  try {
    const adminRelation = await getUserGroupRelation(userId, groupId)
    if (adminRelation && adminRelation.permissionLevel < 2) throw new Error("You don't have admin permission in this group")

    const result = await getConnection()
      .createQueryBuilder()
      .update(Group)
      .set({ isPrivate })
      .where({ id: groupId })
      .returning('*')
      .execute();

    return result
  } catch (ex) {
    console.log(ex)
  }
}

// change the status of the group so that followers cant write in the chat
const setGroupFollowersReadOnly = async ({ userId, groupId }: IUserGroupIds, followersReadOnly: boolean): Promise<UpdateResult | undefined> => {
  try {
    const adminRelation = await getUserGroupRelation(userId, groupId)
    if (adminRelation && adminRelation.permissionLevel < 2) throw new Error("You don't have admin permission in this group")

    const group = await getRepository(Group).findOne({ id: groupId })
    if (group && group.isPrivate) throw new Error('Read only is always true as default for private group')

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

// deletes the group and all its relations. Only admins can delete it.
const deleteGroup = async ({ userId, groupId }: IUserGroupIds):
  Promise<{
    deletedGroup: DeleteResult;
    deletedUserRelations: DeleteResult;
  } | undefined> => {
  try {
    const adminRelation = await getUserGroupRelation(userId, groupId)
    if (adminRelation && adminRelation.permissionLevel < 2) throw new Error("You don't have admin permission in this group")

    const deletedUserRelations = await getConnection()
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
      .execute()

    return { deletedGroup, deletedUserRelations }

  } catch (ex) {
    console.log(ex)
  }
}

// gets all the users that are in the group
const getGroupUsers = async ({ userId, groupId }: IUserGroupIds): Promise<User[] | undefined> => {
  try {
    const relation = await getConnection().getRepository(UserGroup).findOne({ user: { id: userId }, group: { id: groupId } })
    const group = await getConnection().getRepository(Group).findOne(groupId)

    if (group && group.isPrivate) {
      if (!relation || relation.permissionLevel < 1) throw new Error("Can't look at user from privat group if not in it")
    }

    const users: User[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'group')
      .where(`relation."groupId" = :groupId AND relation.accepted = true`, { groupId })
      .getMany()
      .then(relations => relations.map(relation => relation.user))

    return users
  } catch (ex) {
    console.log(ex)
  }
}
// returns only the users that have more permission than followers
const getGroupFriends = async (groupId: string): Promise<User[] | undefined> => {
  try {
    const users: User[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'user')
      .where(`relation."groupId" = :groupId AND relation.accepted = true AND relation."permissionLevel" > 0`, { groupId })
      .getMany()
      .then(relations => relations.map(relation => relation.user))

    return users
  } catch (ex) {
    console.log(ex)
  }
}

// returns the users that have only follower permission to the group
const getGroupFollowers = async (groupId: string): Promise<User[] | undefined> => {
  try {
    const users: User[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'user')
      .where(`relation."groupId" = :groupId AND relation.accepted = true AND relation."permissionLevel" < 1`, { groupId })
      .getMany()
      .then(relations => relations.map(relation => relation.user))

    return users
  } catch (ex) {
    console.log(ex)
  }
}

// returns the users that have been invited to the group
const getGroupUserInvitations = async (groupId: string):
  Promise<{
    inviter: User;
    user: User;
    group: Group;
  }[] | undefined> => {
  try {
    const invitations: { inviter: User; user: User; group: Group; }[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.inviter', 'inviter')
      .leftJoinAndSelect('relation.user', 'user')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."groupId" = :groupId AND relation.accepted = false`, { groupId })
      .getMany()
      .then(relations => relations.map(relation => ({ inviter: relation.inviter, user: relation.user, group: relation.group })))

    return invitations
  } catch (ex) {
    console.log(ex)
  }
}

// returns a user's groups, whatever the permission level
const getUserGroups = async (userId: string): Promise<Group[]> => {
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

// returns the invitations to groups that the user has sent AND the ones he has received
const getUserGroupInvitations = async (userId: string): Promise<{
  sentInvitations: {
    inviter: User;
    user: User;
    group: Group;
  }[];
  receivedInvitations: {
    inviter: User;
    user: User;
    group: Group;
  }[];
}> => {
  try {
    const sentInvitations: {
      inviter: User;
      user: User;
      group: Group;
    }[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.inviter', 'inviter')
      .leftJoinAndSelect('relation.user', 'user')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."inviterId" = :userId AND relation.accepted = false`, { userId })
      .getMany()
      .then(relations => relations.map(relation => ({ inviter: relation.inviter, user: relation.user, group: relation.group })))

    const receivedInvitations: {
      inviter: User;
      user: User;
      group: Group;
    }[] = await getConnection()
      .getRepository(UserGroup)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.inviter', 'inviter')
      .leftJoinAndSelect('relation.user', 'user')
      .leftJoinAndSelect('relation.group', 'group')
      .where(`relation."userId" = :userId AND relation.accepted = false`, { userId })
      .getMany()
      .then(relations => relations.map(relation => ({ inviter: relation.inviter, user: relation.user, group: relation.group })))

    return { sentInvitations, receivedInvitations }

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// creates a relation where accepted = false (meaning it's an invitation) and handles permission levels for the inviter
const inviteUserToGroup = async (groupId: string, inviterId: string, inviteeId: string): Promise<InsertResult | undefined> => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    if (!group) throw new Error('Something went wrong in querying group')

    const inviterRelationWithGroup = await getUserGroupRelation(inviterId, groupId)
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

// sets the relation to accepted
const acceptInviteToGroup = async ({ userId, groupId }: IUserGroupIds): Promise<UpdateResult | undefined> => {
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

// rejects the invite and completely deletes the relation
const rejectInviteToGroup = async ({ userId, groupId }: IUserGroupIds): Promise<DeleteResult | undefined> => {
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

// removes a user from a group. handles permission level if the user is not the one LEAVING the group, but rather being KICKED OUT
// can also be used for unfollowing a group
const removeUserFromGroup = async (removerId: string, { userId, groupId }: IUserGroupIds): Promise<DeleteResult | undefined> => {
  try {
    if (removerId !== userId) { // used to manage if user is leaving group or admin is removing them
      const removerRelationToGroup = await getUserGroupRelation(removerId, groupId)
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

// creates a relation with permissionLevel 0 to a group
const followPublicGroup = async ({ userId, groupId }: IUserGroupIds): Promise<InsertResult | undefined> => {
  try {
    const group = await getConnection().getRepository(Group).findOne({ id: groupId })
    if (!group) throw new Error('Something went wrong finding group')

    if (group.isPrivate) throw new Error('Cannot follow a private group. Invitation only.')

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserGroup)
      .values({ user: { id: userId }, group: { id: groupId }, permissionLevel: 0, accepted: true })
      .returning('*')
      .execute();

    return relation
  } catch (ex) {
    console.log(ex)
  }
}

// uses the group name to return an array of groups 
const searchGroupByName = async (name: string): Promise<Group[] | undefined> => {
  try {
    const results: Group[] = await getConnection()
      .getRepository(Group)
      .createQueryBuilder('group')
      .where(`group.name ILIKE '%${name}%'`)
      .getMany()

    return results
  } catch (ex) {
    console.log(ex)
  }
}
// NOT OPTIMAL SOLUTIONS FOR SEARCH, GOES THROUGH ALL THE DATABASE TO FIND. NOT SCALABLE OPTION
const searchGroupByHash = async (hash: string): Promise<Group[] | undefined> => {
  try {
    const results: Group[] = await getConnection()
      .getRepository(Group)
      .createQueryBuilder('group')
      .select()
      .where(`group.name LIKE '%#${hash}%'`)
      .getMany()

    return results
  } catch (ex) {
    console.log(ex)
  }
}


export {
  insertNewGroupToDb,
  getGroupFromDb,
  deleteGroup,
  updateGroupInfo,
  getUserGroupRelation,
  getGroupUsers,
  getGroupFriends,
  getGroupFollowers,
  getGroupUserInvitations,
  getUserGroups,
  getUserGroupInvitations,
  inviteUserToGroup,
  acceptInviteToGroup,
  rejectInviteToGroup,
  removeUserFromGroup,
  followPublicGroup,
  setGroupIsPrivate,
  setGroupFollowersReadOnly,
  searchGroupByName,
  searchGroupByHash
}