import { Repository, getConnection, InsertResult, UpdateResult } from "typeorm";
import { User, Geolocation, UserGeolocation } from "../models";


// this function will only be used when a user registers, as they will always have a set location after they register and will only have to update it
const setUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation); // get geolocation repo from db

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      const result: InsertResult = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(UserGeolocation)
        .values({ user: { id: userId }, geolocation: { id: existingGeolocation.id } })
        .execute();

      return result;

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      const result: InsertResult = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(UserGeolocation)
        .values({ user: { id: userId }, geolocation: { id: newGeolocation.id } })
        .execute();

      return result
    }

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const updateUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation) // get geolocation repo from db
    const userGeolocationRepo: Repository<UserGeolocation> = await getConnection().getRepository(UserGeolocation)

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      const result: UpdateResult = await userGeolocationRepo
        .createQueryBuilder('relation')
        .update(UserGeolocation)
        .set({ geolocation: existingGeolocation })
        .where({ user: { id: userId } })
        .execute()

      return result;

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      const result: UpdateResult = await userGeolocationRepo
        .createQueryBuilder('relation')
        .update(UserGeolocation)
        .set({ geolocation: newGeolocation })
        .where({ user: { id: userId } })
        .execute()

      return result;
    }
  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

export {
  setUserGeolocationInDb,
  updateUserGeolocationInDb
}