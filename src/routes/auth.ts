import express from 'express';
import { getUserFromDb, insertNewUserToDb, comparePassword, generateJwt } from '../controller/user';
import { isLoggedIn } from '../common/middleware';
const router = express.Router()

export default router;

export interface IRegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dob: Date | string;
  avatarUrl: string;
}


export interface ILoginBody {
  email: string;
  password: string;
}


router.post('/login', async (req, res, next) => {
  try {
    const { email, password }: ILoginBody = req.body;

    const user = await getUserFromDb(email);
    if (user === undefined || user === null) return res.status(403).json({ message: 'Invalid credentials' });

    if (!comparePassword(password, user.password))
      return res.status(403).json({ message: 'Invalid credentials' });

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

router.post('/register', async (req, res, next) => {
  const { email, password, lastName, firstName, dob, avatarUrl }: IRegisterBody = req.body

  try {
    const result = await insertNewUserToDb({ email, password, firstName, lastName, dob, avatarUrl })
    if (!result) return res.status(500).json({ message: 'Something went wrong ' });
    const user = result.identifiers[0]

    const token = generateJwt({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    res.json({ message: 'success', token });

  } catch (ex) {
    console.log(ex)
    next(ex)
  }
})

router.get('/me', isLoggedIn, async (req, res, next) => {
  try {
    //TODO ADD LOCATION STUFF
    const user = await getUserFromDb('', req.body.user.id) // comes from the isLoggedIn function through the jwt, not the actual axios call
    if (!user) return res.status(500).json({ message: 'Something went wrong' })

    const { firstName, lastName, email, id, avatarUrl } = user

    return res.status(200).json({ firstName, lastName, email, id, avatarUrl })
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
})