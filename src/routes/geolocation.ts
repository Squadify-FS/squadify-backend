import express from 'express';
import { isLoggedIn, isEventHost } from '../common/middleware';
import { insertGeolocationToDb, setUserGeolocationInDb, getUserGeolocation, setEventGeolocationInDb, getEventGeolocation } from '../controller';
const router = express.Router()

// base route is /geolocation

export default router;

router.post('/create', isLoggedIn, async (req, res, next) => {
  const { latitude, longitude, address, city, region, postalCode, country } = req.body
  try {
    const newGeolocation = insertGeolocationToDb(latitude, longitude, address, city, region, postalCode, country)
    res.send(newGeolocation)
  } catch (err) {
    next(err)
  }
})

router.get('/user', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  try {
    const geolocation = await getUserGeolocation(userId)
    res.send(geolocation)
  } catch (err) {
    next(err)
  }
})

router.post('/user', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  const { latitude, longitude, localized_address } = req.body
  try {
    const result = await setUserGeolocationInDb(userId, localized_address, latitude, longitude)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

router.get('/event/:eventId', isLoggedIn, async (req, res, next) => {
  const userId = req.body.user.id
  const { eventId } = req.params
  try {
    const result = await getEventGeolocation(eventId, userId)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

router.post('/event/:eventId', isLoggedIn, isEventHost, async (req, res, next) => {
  const userId = req.body.user.id
  const { eventId } = req.params
  const { latitude, longitude, localized_address } = req.body
  try {
    const result = await setEventGeolocationInDb(userId, eventId, localized_address, latitude, longitude)
    res.send(result)
  } catch (err) {
    next(err)
  }
})

