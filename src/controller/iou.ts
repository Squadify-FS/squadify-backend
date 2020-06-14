import { getConnection, UpdateResult, DeleteResult } from 'typeorm';

import { IOU, User, Group } from '../models'
import { Alias } from 'typeorm/query-builder/Alias';

//TODO TEST
const insertIOUToDb = async (amount: number, groupId: string, payerId: string, payeeIds: string[], description?: string) => {
  try {

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

const getGroupIOUS = async(groupId: string)=>{
  try{
    const group = await getConnection()
    .getRepository(Group)
    .findOne(groupId, {relations: ['ious']})
    return group?.ious

  } catch (ex){
    console.log(ex)
  }
}

const getUserIOUS = async(userId: string)=>{
  try{
    const user = await getConnection()
    .getRepository(User)
    .findOne(userId, {relations: ['expenses', 'debts']})
    return {expenses: user?.expenses, debts: user?.debts}

  } catch (ex){
    console.log(ex)
  }
}



export { insertIOUToDb , getGroupIOUS, getUserIOUS }