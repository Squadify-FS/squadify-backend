import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { getUserGroupRelation, getUserEventRelation, getGroupFromDb } from '../controller'
import { getConnection } from 'typeorm'
import { Event } from '../models'

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

const isGroupUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { groupId } = req.params

    const relation = await getUserGroupRelation(userId, groupId)

    if (!relation) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isGroupFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { groupId } = req.params

    const relation = await getUserGroupRelation(userId, groupId)

    if (!relation || relation.permissionLevel < 1) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { groupId } = req.params

    const relation = await getUserGroupRelation(userId, groupId)

    if (!relation || relation.permissionLevel < 2) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isEventUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { eventId } = req.params

    const relation = await getUserEventRelation(userId, eventId)

    if (!relation) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isEventHost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { eventId } = req.params

    const relation = await getUserEventRelation(userId, eventId)

    if (!relation || relation.permissionLevel < 1) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isEventAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.user.id
    const { eventId } = req.params

    const relation = await getUserEventRelation(userId, eventId)

    if (!relation || relation.permissionLevel < 2) return res.status(403).json({ message: 'Forbidden' });
    next()
  } catch (ex) {
    console.log(ex)
    next(ex)
  }
}

const isPrivateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId } = req.body || req.params
    const group = await getGroupFromDb(groupId)

    req.params.isPrivate = group?.isPrivate ? 'true' : ''

    next()
  } catch (ex) {
    next(ex)
  }
}

const isPrivateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.body || req.params
    const event = await getConnection().getRepository(Event).findOne(eventId)

    req.params.isPrivate = event?.isPrivate ? 'true' : ''

    next()
  } catch (ex) {
    next(ex)
  }
}


export {
  isLoggedIn,
  isGroupUser,
  isGroupFriend,
  isGroupAdmin,
  isEventUser,
  isEventHost,
  isEventAdmin,
  isPrivateGroup,
  isPrivateEvent
}