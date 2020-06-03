import express from 'express';
import { getUserFromDb, comparePlaintextToHashedPassword, generateJwt } from '../controller/user';
const router = express.Router()

export interface IRegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dob: Date | string;
}


export interface ILoginBody {
  email: string;
  password: string;
}


router.post('/login', async (req, res, next) => {
  try {
    const { email, password }: ILoginBody = req.body;

    const user = await getUserFromDb(email);
    if (user === undefined || user === null) return res.status(403).json({ message: 'There was an error authenticating' });

    if (!comparePlaintextToHashedPassword(password, user.password))
      return res.status(403).json({ message: 'There was an error authenticating' });

    const token = generateJwt({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
    return res
      .status(200)
      .json({ message: 'Authenticated successfully', token });

  } catch (ex) {
    console.log(ex)
    next(ex)
  }
});

router.post('/register', async (req, res, next) => { })