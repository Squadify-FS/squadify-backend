import express from 'express';
import { isLoggedIn, isGroupFriend } from '../common/middleware';
import { insertIOUToDb, getGroupIOUS, getUserIOUS, getUserExpenses, getUserDebts } from '../controller';
import { socketServer } from '..';
import { IOU } from '../models';
const router = express.Router()

// base route is /iou

export default router;

// creates IOU for group. user can be payer or payee, so everything is handled in req.body, not using the id from isLoggedIn
router.post('/create/:groupId', isLoggedIn, isGroupFriend, async (req, res, next) => {
  const { groupId } = req.params;
  const payerId = req.body.user.id;
  const { amount, payeeIds, description } = req.body
  try {
    const result = await insertIOUToDb(amount, groupId, payerId, payeeIds, description)
    socketServer().emit('create_iou', { amount, groupId, payer: result?.payer, payees: result?.payees, description, splitAmount: result?.splitAmount })
    res.send(result)
  } catch (err) {
    next(err)
  }
})

// gets all the IOUs in ascendint order
router.get('/group/:groupId', isLoggedIn, isGroupFriend, async (req, res, next) => {
  const { groupId } = req.params
  try {
    const result = await getGroupIOUS(groupId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

// gets all the users transactions, wetther he was payer or payee doesnt matter
router.get('/all', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  try {
    const result = await getUserIOUS(userId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

// gets all the transactions where the user was the payer
router.get('/expenses', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  try {
    const result = await getUserExpenses(userId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

// gets all the transactions where the user was the payee
router.get('/debts', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  try {
    const result = await getUserDebts(userId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})