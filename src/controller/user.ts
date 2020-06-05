import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getConnection } from 'typeorm';

import { User } from '../models/User'

import { TokenBody } from '../common/functions'
import { IRegisterBody } from '../routes/auth'


const insertNewUserToDb = async ({ firstName, lastName, password, email, dob }: IRegisterBody) => {
  try {
    //TODO MANAGE ADDRESS AND LOCATION INPUT
    const user = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ firstName, lastName, email, dob, password: hashAndSaltPassword(password) })
      .execute();
    return user
  } catch (ex) {
    console.log(ex)
  }
};

const getUserFromDb = async (email?: string, id?: string) => {
  try {
    if (id) {
      const user = await getConnection().getRepository(User).findOne({ id });
      return user
    }
    const user = await getConnection().getRepository(User).findOne({ email });
    return user
  } catch (ex) {
    console.log(ex)
    return null
  }
};


const generateJwt = ({ id, email, firstName, lastName }: TokenBody) => {
  return jwt.sign({ id, email, firstName, lastName }, process.env.JWT_SECRET || 'SHHHHHH', {
    expiresIn: '1h',
  });
};

const hashAndSaltPassword = (plaintextPassword: string) => {
  return bcrypt.hashSync(plaintextPassword, 10);
};

const comparePlaintextToHashedPassword = (plaintextPassword: string, hashedPassword: string) => {
  return bcrypt.compareSync(plaintextPassword, hashedPassword);
};

export {
  insertNewUserToDb,
  getUserFromDb,
  generateJwt,
  comparePlaintextToHashedPassword
}