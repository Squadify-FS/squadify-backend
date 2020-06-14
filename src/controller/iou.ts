import { getConnection, UpdateResult, DeleteResult } from 'typeorm';

import { IOU, User, Group } from '../models'

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





export { insertIOUToDb }