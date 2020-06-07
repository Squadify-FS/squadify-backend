import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection, Repository, InsertResult, UpdateResult, DeleteResult } from 'typeorm';

import { User, Geolocation, UserGeolocation } from '../models'

import { TokenBody } from '../common/functions'
import { IRegisterBody } from '../routes/auth'
import { UserUser } from '../models';

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

const insertNewUserToDb = async ({ firstName, lastName, password, email, dob }: IRegisterBody) => {
  try {
    //TODO MANAGE ADDRESS AND LOCATION INPUT WITH GOOGLE MAPS STUFF ETC
    const user = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ firstName, lastName, email, dob, password: hashAndSaltPassword(password) })
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
    const result = await getConnection()
      .createQueryBuilder()
      .select(`u."id", u."firstName", u."lastName", u."email"`)
      .from(User, 'u')
      .innerJoin(UserUser, 'uu', 'u."id" = uu."userId" OR u."id" = uu."friendId"')
      .where('u."id" = :userId AND uu."accepted" = true', { userId })
      .execute();

    return result;
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const getUserRequestsFromDb = async (userId: string) => {
  try {
    const sentRequests = await getConnection()
      .createQueryBuilder()
      .select(`u."id", u."firstName", u."lastName", u."email"`)
      .from(User, 'u')
      .innerJoin(UserUser, 'uu', 'u."id" = uu."userId"')
      .where('u."id" = :userId AND uu."accepted" = false', { userId })
      .execute();
    const incomingRequests = await getConnection()
      .createQueryBuilder()
      .select(`u."id", u."firstName", u."lastName", u."email"`)
      .from(User, 'u')
      .innerJoin(UserUser, 'uu', 'u."id" = uu."friendId"')
      .where('u."id" = :userId AND uu."accepted" = false', { userId })
      .execute();

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
      .where("userId = :userId AND friendId = :friendId", { userId, friendId })
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
      .where(`userId = :requesterId AND friendId = :requestedId`, { requesterId, requestedId })
      .execute();

    return ({ message: 'success', acceptedRelation })
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
      .where("userId = :requesterId AND friendId = :requestedId", { requesterId, requestedId })
      .execute();

    return deletedRequestRelation

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

// this function will only be used when a user registers, as they will always have a set location after they register and will only have to update it
const setUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const userRepo: Repository<User> = await getConnection().getRepository(User); // get user repo from db
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation); // get geolocation repo from db

    const user: User | undefined = await userRepo //get user from db
      .createQueryBuilder('user')
      .where({ id: userId })
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
      .getOne();

    if (!user) throw new Error('Something went wrong querying user');

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      const result: InsertResult = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(UserGeolocation)
        .values({ user: { id: user.id }, geolocation: { id: existingGeolocation.id } })
        .execute();

      return result;

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      const result: InsertResult = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(UserGeolocation)
        .values({ user: { id: user.id }, geolocation: { id: newGeolocation.id } })
        .execute();

      return result
    }

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const updateUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const userRepo: Repository<User> = await getConnection().getRepository(User) // get user repo from db
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation) // get geolocation repo from db
    const userGeolocationRepo: Repository<UserGeolocation> = await getConnection().getRepository(UserGeolocation)

    const user: User | undefined = await userRepo //get user from db
      .createQueryBuilder('user')
      .where({ id: userId })
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
      .getOne();

    if (!user) throw new Error('Something went wrong querying user')

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      const result: UpdateResult = await userGeolocationRepo
        .createQueryBuilder('relation')
        .update(UserGeolocation)
        .set({ geolocation: existingGeolocation })
        .where(`relation.user.id = userId`, { userId: user.id })
        .execute()

      return result;

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      const result: UpdateResult = await userGeolocationRepo
        .createQueryBuilder('relation')
        .update(UserGeolocation)
        .set({ geolocation: newGeolocation })
        .where(`relation.user.id = userId`, { userId: user.id })
        .execute()

      return result;
    }
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

export {
  insertNewUserToDb,
  getUserFromDb,
  generateJwt,
  comparePassword,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriend,
  setUserGeolocationInDb,
  updateUserGeolocationInDb
}