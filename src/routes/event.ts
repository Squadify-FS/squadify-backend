import express from 'express';
import { insertEventToDb, getGroupEvents, setEventGeolocationInDb, assignEventToGroup } from '../controller';
import { isLoggedIn } from '../common/middleware';
const router = express.Router()

//base route is /event

export default router;

router.get('/:groupId', isLoggedIn, async(req, res, next) => {
    const { groupId } = req.params;
    try {
        res.send(await getGroupEvents(groupId));
    } catch(err) {
        next(err);
    }
});


//(userId: string, eventId: string, groupId: string)
router.post('/:groupId', isLoggedIn, async(req, res, next) => {
    const { groupId } = req.params;
    const { userId, name, description, isPrivate, startTime, endTime, addressOfEvent, coordsOfEvent } = req.body;
    try {
        const createdEvent = await insertEventToDb(userId, name, description, isPrivate, startTime, endTime);
        const eventId = createdEvent?.event.identifiers[0].id;
        const eventToGroup = await assignEventToGroup(userId, eventId, groupId);
        const geolocation = await setEventGeolocationInDb(userId, eventId, addressOfEvent, coordsOfEvent.latitude, coordsOfEvent.longitude);
        console.log(createdEvent, eventToGroup, geolocation);
    } catch(err) {
        next(err);
    }
});