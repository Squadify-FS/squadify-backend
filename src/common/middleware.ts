import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

// import { User } from '../models';


const isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization']

    if (!authHeader || !authHeader.split('Bearer ')[1]) return res.status(403).json({ message: 'Forbidden' });

    const token = authHeader.split('Bearer ')[1]
    const user = jwt.verify(token, process.env.JWT_SECRET || 'SHHHHHH')

    req.body.user = user
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

export {
  isLoggedIn
}