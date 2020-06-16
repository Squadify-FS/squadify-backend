import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection, UpdateResult, DeleteResult } from 'typeorm';

import { User, UserUser, Hashtag } from '../models'

import { TokenBody } from '../common/functions'
import { IRegisterBody } from '../routes/auth'


const generateJwt = ({ id, email, firstName, lastName }: TokenBody) => {
  return jwt.sign({ id, email, firstName, lastName }, process.env.JWT_SECRET || 'SHHHHHH', {
    expiresIn: '1h',
  });
};

const hashAndSaltPassword = (plaintextPassword: string) => {
  return bcrypt.hashSync(plaintextPassword, 10);
};

const comparePassword = (plaintextPassword: string, hashedPassword: string) => {
  return bcrypt.compareSync(plaintextPassword, hashedPassword);
};

const insertNewUserToDb = async ({ firstName, lastName, password, email, dob, avatarUrl }: IRegisterBody) => {
  try {
    //TODO MANAGE ADDRESS AND LOCATION INPUT WITH GOOGLE MAPS STUFF ETC
    const user = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ firstName, lastName, email, dob, password: hashAndSaltPassword(password), avatarUrl })
      .returning('*')
      .execute();
    return user;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
};

const getUserFromDb = async (email?: string, id?: string) => {
  try {
    if (id) {
      const user = await getConnection().getRepository(User).findOne({ id });
      return user;
    }
    const user = await getConnection().getRepository(User).findOne({ email });
    return user;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
};

const getUserFriendsFromDb = async (userId: string) => {
  try {
    const result: User[] = await getConnection()
      .getRepository(UserUser)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.friend', 'friend')
      .where(`relation."userId" = :userId`, { userId })
      .andWhere(`relation."accepted" = true`)
      .getMany()
      .then(relations => relations.map(relation => relation.friend))

    return result;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const getUserRequestsFromDb = async (userId: string) => {
  try {
    const sentRequests: User[] = await getConnection()
      .getRepository(UserUser)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.friend', 'friend')
      .where(`relation."userId" = :userId`, { userId })
      .andWhere(`relation."accepted" = false`)
      .getMany()
      .then(relations => relations.map(relation => relation.friend))

    const incomingRequests: User[] = await getConnection()
      .getRepository(UserUser)
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.user', 'user')
      .where(`relation."friendId" = :userId`, { userId })
      .andWhere(`relation."accepted" = false`)
      .getMany()
      .then(relations => relations.map(relation => relation.user))

    return { sentRequests, incomingRequests }
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}


const deleteFriend = async (userId: string, friendId: string) => {
  try {

    const deletedRelation = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserUser)
      .where(` "userId" = :userId AND "friendId" = :friendId`, { userId, friendId })
      .orWhere(`"userId" = :friendId AND "friendId" = :userId`, { userId, friendId })
      .returning('*')
      .execute()

    return deletedRelation
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const sendFriendRequest = async (requesterId: string, requestedId: string) => {
  try {

    const relation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserUser)
      .values({
        user: { id: requesterId },
        friend: { id: requestedId }
      })
      .returning('*')
      .execute();

    return relation

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const acceptFriendRequest = async (requesterId: string, requestedId: string) => {
  try {
    const acceptedRelation: UpdateResult = await getConnection()
      .createQueryBuilder()
      .update(UserUser)
      .set({ accepted: true })
      .where(`"userId" = :requesterId AND "friendId" = :requestedId`, { requesterId, requestedId })
      .orWhere(`"userId" = :requestedId AND "friendId" = :requesterId`, { requesterId, requestedId })
      .returning('*')
      .execute();

    const inverseRelation = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(UserUser)
      .values({
        user: { id: requestedId },
        friend: { id: requesterId },
        accepted: true
      })
      .returning('*')
      .execute();

    return ({ message: 'success', acceptedRelation, inverseRelation })
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const rejectFriendRequest = async (requesterId: string, requestedId: string) => {
  try {

    const deletedRequestRelation: DeleteResult = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserUser)
      .where('"userId" = :requesterId AND "friendId" = :requestedId', { requesterId, requestedId })
      .orWhere('"userId" = :requestedId AND "friendId" = :requesterId', { requesterId, requestedId })
      .returning('*')
      .execute();

    return deletedRequestRelation

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const updateUser = async (userId: string, firstName?: string, lastName?: string, email?: string, password?: string, avatarUrl?: string) => {
  try {
    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder()
      .update(User)
      .set({ firstName, lastName, email, password, avatarUrl })
      .where({ id: userId })
      .returning('*')
      .execute();
    return user;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}


const assignHashtagToUser = async (hashtagId: string, userId: string) => {
  try {
    const user = await getConnection().getRepository(User).findOne({ id: userId })
    const hashtag = await getConnection().getRepository(Hashtag).findOne({ id: hashtagId })

    if (user && hashtag) {

      await getConnection()
        .createQueryBuilder()
        .relation(User, 'hashtags')
        .of(user)
        .add(hashtag)

      return { user, hashtag }
    }
  } catch (ex) {
    console.log(ex)
  }
}

const getUserHashtags = async (userId: string) => {
  try {
    const results = await getConnection()
      .getRepository(User)
      .findOne(userId, { relations: ['hashtags'] })
      .then(user => user?.hashtags)

    return results
  } catch (ex) {
    console.log(ex)
  }
}

export {
  insertNewUserToDb,
  getUserFromDb,
  generateJwt,
  comparePassword,
  getUserFriendsFromDb,
  getUserRequestsFromDb,
  deleteFriend,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  updateUser,
  assignHashtagToUser,
  getUserHashtags
}