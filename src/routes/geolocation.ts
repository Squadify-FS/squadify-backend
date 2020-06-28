import express from 'express';
import { isLoggedIn, isEventHost, isPrivateEvent } from '../common/middleware';
import { setUserGeolocationInDb, getUserGeolocation, setEventGeolocationInDb, getEventGeolocation, getUserEventRelation } from '../controller';
import { socketServer } from '..';
const router = express.Router()

// base route is /geolocation

export default router;


// gets user current geolocation in db
router.get('/user', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  try {
    const geolocation = await getUserGeolocation(userId)
    res.send(geolocation)
  } catch (err) {
    next(err)
  }
})

// sets the user's geolocation
router.post('/user', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  const { latitude, longitude, localized_address } = req.body
  try {
    // mainly use address, but if not we can use latitude and longitude instead
    const updatedUser = await setUserGeolocationInDb(userId, localized_address, latitude, longitude);
    res.status(200).json({
      user: updatedUser,
      localized_address: updatedUser.localized_address,
      latitude: updatedUser.latitude,
      longitude: updatedUser.longitude
    });
  } catch (err) {
    next(err)
  }
})

// gets the event's geolocation
router.get('/event/:eventId', isLoggedIn, isPrivateEvent, async (req, res, next) => {
  const userId = req.body.user.id
  const { eventId, isPrivate } = req.params
  try {
    if (isPrivate) {
      const relation = await getUserEventRelation(userId, eventId)
      if (!relation || relation.permissionLevel < 1) next()
    }

    const result = await getEventGeolocation(eventId, userId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

// sets the event's geolocation in db
router.post('/event/:eventId', isLoggedIn, isEventHost, async (req, res, next) => {
  const userId = req.body.user.id
  const { eventId } = req.params
  const { latitude, longitude, localized_address } = req.body
  try {
    const result = await setEventGeolocationInDb(userId, eventId, localized_address, latitude, longitude)

    socketServer().emit('set_event_geolocation', {
      event: result,
      localized_address: result?.event.localized_address,
      latitude: result?.event.latitude,
      longitude: result?.event.longitude
    })

    res.send({
      event: result,
      localized_address: result?.event.localized_address,
      latitude: result?.event.latitude,
      longitude: result?.event.longitude
    })
  } catch (err) {
    next(err)
  }
})