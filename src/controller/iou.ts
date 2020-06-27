import { getConnection, InsertResult, getRepository } from 'typeorm';

import { IOU, User } from '../models'

// route is /iou

//TODO  TEST
// creates an IOU and inserts it to the group, handling who payed what to who
const insertIOUToDb = async (amount: number, groupId: string, payerId: string, payeeIds: string[], description?: string):
  Promise<{
    iou: IOU | undefined;
    splitAmount: string;
    payer: User | undefined
    payees: (User | undefined)[];
  } | undefined> => {
  try {
    // maybe should add functionality to verify relations to group
    const iouInsert = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(IOU)
      .values({
        amount,
        description,
        group: { id: groupId },
      })
      .returning('*')
      .execute()

    const iou = await getRepository(IOU).findOne(iouInsert.identifiers[0].id)

    const payer = await getRepository(User).findOne(payerId)
    await getConnection()
      .createQueryBuilder()
      .relation(IOU, 'payer')
      .of(iou)
      .add(payer)

    const payees = [];

    for(let i = 0; i < payeeIds.length; i++) {
      const payee = await getRepository(User).findOne(payeeIds[i])
      await getConnection()
        .createQueryBuilder()
        .relation(IOU, 'payer')
        .of(iou)
        .add(payee)
      payees.push(payee);
    }

    const splitAmount = Math.ceil(amount / payeeIds.length + 1).toFixed(2)

    return { iou, splitAmount, payer, payees }

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
      .leftJoinAndSelect('iou.payer', 'payer')
      .leftJoinAndSelect('iou.payees', 'payees')
      .where(`iou."groupId" = :groupId`, { groupId })
      .orderBy('iou."createdAt"', 'ASC')
      .getMany()

    return ious
  } catch (ex) {
    console.log(ex)
  }
}

// gets all expenses and debts for the user with no order
const getUserIOUS = async (userId: string):
  Promise<{
    expenses: IOU[] | undefined;
    debts: IOU[] | undefined;
  } | undefined> => {
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
const getUserExpenses = async (userId: string): Promise<IOU[] | undefined> => { // works
  try {
    const ious: IOU[] = await getConnection()
      .getRepository(IOU)
      .createQueryBuilder('iou')
      .where(`iou."payerId" = :userId`, { userId })
      .orderBy('"createdAt"', 'ASC')
      .getMany()

    return ious
  } catch (ex) {
    console.log(ex)
  }
}

// gets the debts ordered by createdAt time
const getUserDebts = async (userId: string): Promise<IOU[] | undefined> => {
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