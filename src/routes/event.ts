import express from 'express';
import { insertEventToDb, getGroupEvents, setEventGeolocationInDb, assignEventToGroup, getEventGeolocation, searchEventsUsingRadius, unassignEventFromGroup, assignEventToUser, unassignEventFromUser, getUserEvents, updateEvent, insertHashtagToDb, getHashtagByText, assignHashtagToEvent, unassignHashtagFromEvent, getEventHashtags, searchHashtags, searchEventsByName, searchEventsByHashtags, getEventGroups, getUserEventRelation, getEventUsers } from '../controller';
import { isLoggedIn, isGroupUser, isGroupFriend, isEventHost, isEventUser, isPrivateEvent } from '../common/middleware';
import { socketServer } from '..';
const router = express.Router()

//base route is /event

export default router;

//************************ create update and delete routes

// simple create new event route
router.post('/create', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id
        const { name, description, isPrivate, startTime, endTime, address, coordsOfEvent } = req.body;

        const createdEvent = await insertEventToDb({ userId, name, description, isPrivate, startTime, endTime });
        const eventId = createdEvent?.event.identifiers[0].id;
        const geolocationInsert = await setEventGeolocationInDb(userId, eventId, address, coordsOfEvent.latitude, coordsOfEvent.longitude);
        res.status(201).json({ event: geolocationInsert?.event, geolocation: geolocationInsert?.geolocation });
    } catch (err) {
        console.log(err)
        next(err);
    }
});


// updates event info
router.post('/update/:eventId', isLoggedIn, isEventHost, async (req, res, next) => {
    try {
        const { eventId } = req.params
        const userId = req.body.user.id
        const { name, description, isPrivate, startTime, endTime } = req.body;

        const updatedEvent = await updateEvent({ eventId, userId, name, description, isPrivate, startTime, endTime });
        socketServer().emit('update_event', { event: updatedEvent?.raw[0] })
        res.send({ event: updatedEvent?.raw[0] });
    } catch (err) {
        next(err);
    }
})

//************************ end of create update and delete routes

//************************ relations to groups and user's routes


// gets group's events
router.get('/group_events/:groupId', isLoggedIn, isGroupUser, async (req, res, next) => {
    try {
        const { groupId } = req.params;

        res.send(await getGroupEvents(groupId));
    } catch (err) {
        next(err);
    }
});

// assign event to group, only friends and admins can
router.post('/assign_group/:groupId', isLoggedIn, isGroupFriend, async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { eventId } = req.body
        const userId = req.body.user.id

        const eventToGroup = await assignEventToGroup({ userId, eventId, groupId });
        socketServer().emit('assign_event_group', { event: eventToGroup?.event, group: eventToGroup?.group, user: eventToGroup?.user })
        res.send(eventToGroup);
    } catch (err) {
        next(err);
    }
});

// unassign event from group, only friends and admins can
router.delete('/unassign_group/:eventId/:groupId', isLoggedIn, isGroupFriend, async (req, res, next) => {
    try {
        const { groupId, eventId } = req.params;
        const userId = req.body.user.id

        const deletedRelation = await unassignEventFromGroup({ userId, eventId, groupId });
        socketServer().emit('unassign_event_group', { event: deletedRelation?.event, group: deletedRelation?.group, user: deletedRelation?.user })
        res.send(deletedRelation);
    } catch (err) {
        next(err);
    }
});

router.get('/:eventId/groups', isLoggedIn, isPrivateEvent, async (req, res, next) => {
    try {
        const { eventId, isPrivate } = req.params
        const userId = req.body.user.id

        if (isPrivate) {
            const userRelation = await getUserEventRelation(userId, eventId)
            if (!userRelation || userRelation.permissionLevel < 1) res.status(403).json({ message: 'Not part of this private event' })
        }

        const groups = await getEventGroups(eventId)

        res.send(groups)
    } catch (err) {
        next(err)
    }
})

router.get('/:eventId/users', isLoggedIn, isPrivateEvent, async (req, res, next) => {
    try {
        const { eventId, isPrivate } = req.params
        const userId = req.body.user.id

        if (isPrivate) {
            const userRelation = await getUserEventRelation(userId, eventId)
            if (!userRelation || userRelation.permissionLevel < 1) res.status(403).json({ message: 'Not part of this private event' })
        }

        const users = await getEventUsers(eventId)

        res.send(users)
    } catch (err) {
        next(err)
    }
})

// get logged in user's events
router.get('/my_events', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id

        res.send(await getUserEvents(userId));
    } catch (err) {
        next(err);
    }
})

// assign event to user. 
// Also used to follow public events, private events must use inviterId
router.post('/assign_self', isLoggedIn, async (req, res, next) => {
    try {

        const userId = req.body.user.id
        const { eventId } = req.body

        const eventToUser = await assignEventToUser({ userId, eventId })
        socketServer().emit('assign_self_to_event', { event: eventToUser?.event, userId })
        res.send(eventToUser)
    } catch (err) {
        next(err);
    }
})

// current user assigns another user to event (like invite). used for private events.
router.post('/assign_user/:eventId/:userId', isLoggedIn, async (req, res, next) => {
    try {

        const inviterId = req.body.user.id
        const { userId, eventId } = req.params

        const eventToUser = await assignEventToUser({ userId, eventId, inviterId })
        socketServer().emit('assign_user_to_event', { event: eventToUser?.event, userId, inviterId })
        res.send(eventToUser)
    } catch (err) {
        next(err);
    }
})

// 
router.delete('/unassign_user/:eventId', isLoggedIn, async (req, res, next) => {
    try {
        const { eventId } = req.params
        const userId = req.body.user.id

        const eventToUser = await unassignEventFromUser({ userId, eventId })
        socketServer().emit('unassign_event_from_user', { userId, eventId })
        res.send(eventToUser)
    } catch (err) {
        next(err);
    }
})

// removes user from event. Only event admins and hosts can, middleware takes care of permission.
router.delete('/kick_user/:eventId/:userId', isLoggedIn, isEventHost, async (req, res, next) => {
    try {
        const { eventId, userId } = req.params

        const eventToUser = await unassignEventFromUser({ userId, eventId })
        socketServer().emit('kick_user_from_event', { userId, eventId })
        res.send(eventToUser)
    } catch (err) {
        next(err);
    }
})

//************************ end of relations to groups and user's routes

//************************ geolocation routes

// gets the event's geolocation
router.get('/:eventId/geolocation', isLoggedIn, async (req, res, next) => {
    try {
        const { eventId } = req.params;

        res.send(await getEventGeolocation(eventId));
    } catch (err) {
        next(err);
    }
});

//************************ end of geolocation routes

//************************ hashtag routes

// creates a new hashtag and inserts to database, and returns it
router.post('/hashtags/create', isLoggedIn, async (req, res, next) => {
    try {
        const { text } = req.body

        const alreadyExists = await getHashtagByText(text)
        if (alreadyExists) res.status(400).json({ message: 'Hashtag already exists' })

        const newHashtag = await insertHashtagToDb(text)
        res.json(newHashtag)
    } catch (err) {
        next(err)
    }
})

// assigns hashtag to event. middleware handles user event permission
router.post('/assign_hashtag/:eventId', isLoggedIn, isEventHost, async (req, res, next) => {
    try {
        const { hashtagId } = req.body
        const { eventId } = req.params

        const hashtagToEvent = await assignHashtagToEvent({ eventId, hashtagId })
        res.send(hashtagToEvent)
    } catch (err) {
        next(err)
    }
})

// removes hashtag from event. middleware handles permissions.
router.delete('/unassign_hashtag/:eventId/:hashtagId', isLoggedIn, isEventHost, async (req, res, next) => {
    try {
        const { eventId, hashtagId } = req.params

        const hashtagToEvent = await unassignHashtagFromEvent({ eventId, hashtagId })
        res.send(hashtagToEvent)
    } catch (err) {
        next(err)
    }
})

// gets the event's hashtags
router.get('/:eventId/hashtags', isLoggedIn, isEventUser, async (req, res, next) => {
    try {
        const { eventId } = req.params

        const hashtags = await getEventHashtags(eventId)
        res.send(hashtags)
    } catch (err) {
        next(err)
    }
})

// performs a string search on hashtag database.
router.get('/search_hashtags/:text', isLoggedIn, async (req, res, next) => {
    try {
        const { text } = req.params

        const hashtags = await searchHashtags(text)
        res.send(hashtags)
    } catch (err) {
        next(err)
    }
})

//************************ end of hashtag routes

//************************ search routes

// const searchEventsUsingRadius = async (radius: number, latitude: number, longitude: number, geolocationId?: string) => {
router.get('/searcharea/:radius/:latitude/:longitude', isLoggedIn, async (req, res, next) => {
    try {
        const { radius, latitude, longitude } = req.params;
        res.send(await searchEventsUsingRadius(Number(radius), Number(latitude), Number(longitude)));
    } catch (err) {
        next(err);
    }
});

// searches events either by their name or their hashtags. type param is either 'name' or 'hashtag'.
router.get('/search/:type/:text', isLoggedIn, async (req, res, next) => {
    try {
        const { type, text } = req.params

        if (type === 'name') {
            const events = await searchEventsByName(text)
            res.send(events)
        } else if (type === 'hashtag') {
            const events = await searchEventsByHashtags(text)
            res.send(events)
        }
    } catch (err) {
        next(err)
    }
})


//************************ end of search routes