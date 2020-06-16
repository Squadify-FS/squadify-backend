import { getConnection } from 'typeorm';

import { IOU, User } from '../models'

//TODO  TEST
// creates an IOU and inserts it to the group, handling who payed what to who
const insertIOUToDb = async (amount: number, groupId: string, payerId: string, payeeIds: string[], description?: string) => {
  try {
    // maybe should add functionality to verify relations to group
    const iou = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(IOU)
      .values({
        amount,
        description,
        group: { id: groupId },
        payer: { id: payerId },
        payees: payeeIds.map((id) => ({ id }))
      })
      .returning('*')
      .execute()

    const splitAmount = Math.ceil(amount / payeeIds.length + 1).toFixed(2)

    return { iou, splitAmount }

  } catch (ex) {
    console.log(ex)
  }
}

// gets all the past IOUs
const getGroupIOUS = async (groupId: string) => {
  try {
    const ious: IOU[] = await getConnection()
      .getRepository(IOU)
      .createQueryBuilder('iou')
      .select()
      .where(`iou."groupId" = :groupId`, { groupId })
      .orderBy('"createdAt"', 'ASC')
      .getMany()

    return ious
  } catch (ex) {
    console.log(ex)
  }
}

// gets all expenses and debts for the user with no order
const getUserIOUS = async (userId: string) => {
  try {
    const user = await getConnection()
      .getRepository(User)
      .findOne(userId, { relations: ['expenses', 'debts'] })
    return { expenses: user?.expenses, debts: user?.debts }

  } catch (ex) {
    console.log(ex)
  }
}

// gets the expenses ordered by createdAt time
const getUserExpenses = async (userId: string) => { // works
  try {
    const ious: IOU[] = await getConnection()
      .getRepository(IOU)
      .createQueryBuilder('iou')
      .select()
      .where(`iou."payerId" = :userId`, { userId })
      .orderBy('"createdAt"', 'ASC')
      .getMany()

    return ious
  } catch (ex) {
    console.log(ex)
  }
}

// gets the debts ordered by createdAt time
const getUserDebts = async (userId: string) => {
  try {
    const ious: IOU[] | undefined = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .innerJoinAndSelect(
        "user.debts",
        "debts",
      )
      .orderBy("debts", "DESC")
      .where(`user.id = :userId`, { userId })
      .getOne()
      .then(user => user?.debts)

    return ious
  } catch (ex) {
    console.log(ex)
  }
}

export {
  insertIOUToDb,
  getGroupIOUS,
  getUserIOUS,
  getUserExpenses,
  getUserDebts
}