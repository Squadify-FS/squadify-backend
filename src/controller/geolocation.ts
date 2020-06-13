import { Repository, getConnection } from "typeorm";
import { User, Geolocation } from "../models";


// this function will only be used when a user registers, as they will always have a set location after they register and will only have to update it
const setUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation); // get geolocation repo from db

    const user = await getConnection().getRepository(User).findOne({ id: userId })
    if (!user) throw new Error('User not found')

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {
      existingGeolocation.users.push(user)
      user.geolocation = existingGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(existingGeolocation)
      return { user, geolocation: existingGeolocation }

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      newGeolocation.users.push(user)
      user.geolocation = newGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(newGeolocation)

      return { user, geolocation: newGeolocation }
    }

  } catch (ex) {
    console.log(ex)
    throw ex
  }
}

const updateUserGeolocationInDb = async (userId: string, address?: string, latitude?: number, longitude?: number) => {
  try {
    const geolocationRepo: Repository<Geolocation> = await getConnection().getRepository(Geolocation) // get geolocation repo from db

    const user = await getConnection().getRepository(User).findOne({ id: userId })
    if (!user) throw new Error('User not found')

    //remove user from old relation with geolocation TODO onUpdate and onDelete CASCADE
    const oldGeolocation = await geolocationRepo.findOne({ id: user.geolocation.id })
    if (oldGeolocation) {
      oldGeolocation.users = oldGeolocation.users.filter((user: User) => user.id !== userId)
      await getConnection().manager.save(oldGeolocation);
    } 

    const existingGeolocation: Geolocation | undefined = await geolocationRepo // find existing location if it exists
      .createQueryBuilder('geolocation')
      .where(
        `geolocation.address = :address`,
        { address }
      )
      .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
      .getOne();

    if (existingGeolocation) {

      existingGeolocation.users.push(user)
      user.geolocation = existingGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(existingGeolocation)

      return { user, geolocation: existingGeolocation }

    } else {

      const newGeolocationId: string = (await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Geolocation)
        .values({ address, latitude, longitude })
        .execute()).identifiers[0].id;

      const newGeolocation: Geolocation | undefined = await geolocationRepo.findOne({ id: newGeolocationId })
      if (!newGeolocation) throw new Error('Something went wrong with new geolocation')

      newGeolocation.users.push(user)
      user.geolocation = newGeolocation
      await getConnection().manager.save(user)
      await getConnection().manager.save(newGeolocation)

      return { user, geolocation: newGeolocation }
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