import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection, UpdateResult, DeleteResult, InsertResult } from 'typeorm';

import { User, UserUser, Hashtag } from '../models'

import { TokenBody, generateHashForName } from '../common/functions'
import { IRegisterBody } from '../routes/auth'


const generateJwt = ({ id, email, firstName, lastName }: TokenBody): string => {
  return jwt.sign({ id, email, firstName, lastName }, process.env.JWT_SECRET || 'SHHHHHH', {
    expiresIn: '1h',
  });
};

const hashAndSaltPassword = (plaintextPassword: string): string => {
  return bcrypt.hashSync(plaintextPassword, 10);
};

const comparePassword = (plaintextPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plaintextPassword, hashedPassword);
};

// creates a new user and assigns a hash number to the firstName and lastName
const insertNewUserToDb = async ({ firstName, lastName, password, email, dob, avatarUrl }: IRegisterBody): Promise<InsertResult> => {
  try {
    //TODO MANAGE ADDRESS AND LOCATION INPUT WITH GOOGLE MAPS STUFF ETC
    const hash = generateHashForName()
    const hashedFirstName = `${firstName}${hash}`
    const hashedLastName = `${lastName}${hash}`

    const user = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ firstName: hashedFirstName, lastName: hashedLastName, email, dob, password: hashAndSaltPassword(password), avatarUrl })
      .returning('*')
      .execute();
    return user;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
};

// gets user using email OR id
const getUserFromDb = async (email?: string, id?: string): Promise<User | undefined> => {
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

// gets the friends from the user
const getUserFriendsFromDb = async (userId: string): Promise<User[]> => {
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

// gets the user's sent friend requests and received friend requests
const getUserRequestsFromDb = async (userId: string):
  Promise<{
    sentRequests: User[];
    incomingRequests: User[];
  }> => {
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

// deletes a friend relation between to users
const deleteFriend = async (userId: string, friendId: string): Promise<DeleteResult> => {
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

// creates a friends relation (one way only) where it is not accepted yet
const sendFriendRequest = async (requesterId: string, requestedId: string): Promise<{
  relation: InsertResult;
  requestedUser: User | undefined;
}> => {
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

    const requestedUser = await getConnection().getRepository(User).createQueryBuilder('user').where(`user.id = :requestedId`, { requestedId }).getOne()

    return { relation, requestedUser }

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// sets accepted to true for previous created relation, and creates inverse relation
const acceptFriendRequest = async (requesterId: string, requestedId: string):
  Promise<{
    message: string;
    acceptedRelation: UpdateResult;
    inverseRelation: InsertResult;
  }> => {
  try {
    const acceptedRelation: UpdateResult = await getConnection()
      .createQueryBuilder()
      .update(UserUser)
      .set({ accepted: true })
      .where(`"userId" = :requesterId AND "friendId" = :requestedId`, { requesterId, requestedId })
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

// deletes received one way relation
const rejectFriendRequest = async (requesterId: string, requestedId: string): Promise<DeleteResult> => {
  try {

    const deletedRequestRelation: DeleteResult = await getConnection()
      .createQueryBuilder()
      .delete()
      .from(UserUser)
      .where('"userId" = :requesterId AND "friendId" = :requestedId', { requesterId, requestedId })
      .returning('*')
      .execute();

    return deletedRequestRelation

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// updates user info. must be sent all the info that will be changed as well as the info that won't be
// also changes hash to firstname and lastname
const updateUser = async (userId: string, firstName: string, lastName: string, email: string, password: string, avatarUrl: string): Promise<UpdateResult> => {
  try {

    const hash = generateHashForName()
    const hashedFirstName = `${firstName}${hash}`
    const hashedLastName = `${lastName}${hash}`

    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder()
      .update(User)
      .set({ firstName: hashedFirstName, lastName: hashedLastName, email, password, avatarUrl })
      .where({ id: userId })
      .returning('*')
      .execute();
    return user;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// puts the hashtag in the user's preferred hashtags or categories, whatever you wanna call it, in order to fetch relevant events
const assignHashtagToUser = async (hashtagId: string, userId: string):
  Promise<{
    user: User;
    hashtag: Hashtag;
  } | undefined> => {
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

// gets an array of the users selected hashtags
const getUserHashtags = async (userId: string): Promise<Hashtag[] | undefined> => {
  try {
    const results: Hashtag[] | undefined = await getConnection()
      .getRepository(User)
      .findOne(userId, { relations: ['hashtags'] })
      .then(user => user?.hashtags)

    return results
  } catch (ex) {
    console.log(ex)
  }
}

// searches a user by email and returns an array of similar ones
const searchUsersByEmail = async (email: string): Promise<User[] | undefined> => {
  try {
    const results: User[] = await getConnection()
      .getRepository(User)
      .createQueryBuilder('user')
      .select()
      .where(`LOWER(user.email) LIKE '%${email.toLowerCase()}%'`)
      .getMany()

    return results
  } catch (ex) {
    console.log(ex)
  }
}
// NOT OPTIMAL SOLUTIONS FOR SEARCH, GOES THROUGH ALL THE DATABASE TO FIND. NOT SCALABLE OPTION
// returns array of users with similar hashes
const searchUsersByHash = async (hash: string): Promise<User[] | undefined> => {
  try {
    const results: User[] = await getConnection()
      .getRepository(User)
      .createQueryBuilder('user')
      .select()
      .where(`user."firstName" LIKE '%${hash}%'`)
      .orWhere(`user."lastName" LIKE '%${hash}%'`)
      .getMany()

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
  getUserHashtags,
  searchUsersByEmail,
  searchUsersByHash
}