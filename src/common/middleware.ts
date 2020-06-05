import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

import { User } from '../models';

export interface RequestExtended extends Request {
  // eslint-disable-next-line @typescript-eslint/ban-types
  user: string | object;
}

const isLoggedIn = async (req: RequestExtended, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']

    if (!authHeader || !authHeader.split('Bearer ')[1]) return res.status(403).json({ message: 'Forbidden' });

    const token = authHeader.split('Bearer ')[1]
    const user = jwt.verify(token, process.env.JWT_SECRET || 'CMON MAN MAKE A SECRET JESUS CHRIST')

    req.user = user
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

