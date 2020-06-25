import express from 'express';
import { getUserFromDb, getUserFriendsFromDb, sendFriendRequest, getUserRequestsFromDb, deleteFriend, acceptFriendRequest, rejectFriendRequest, updateUser, getUserGroupInvitations, getUserGroups, assignHashtagToUser, getUserHashtags, searchUsersByEmail, searchUsersByHash } from '../controller';
import { isLoggedIn } from '../common/middleware';
import { socketServer } from '..';
const router = express.Router()

//base route is /user

export default router;

//***************** user methods

// get user object
router.get('/findfriend/:email', isLoggedIn, async (req, res, next) => {
    const { email } = req.params;
    try {
        res.send(await getUserFromDb(email))
    } catch (err) {
        next(err);
    }
});

// updates user info
router.put('/updateProfile', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    const { firstName, lastName, email, password, avatarUrl } = req.body
    try {
        res.send(await updateUser(yourId, firstName, lastName, email, password, avatarUrl));
    } catch (err) {
        next(err);
    }
});

//************** end of user methods

//************************* friend requests 

//get a user's sent AND received friend requests
router.get('/friendrequests', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    try {
        res.send(await getUserRequestsFromDb(yourId));
    } catch (err) {
        next(err);
    }
});


//add friend. should return an object with friend request info
router.post('/addfriend', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    const { otherUserId } = req.body;
    try {
        socketServer().emit('send_friend_request', { userId: yourId, otherUserId })
        res.send(await sendFriendRequest(yourId, otherUserId));
    } catch (err) {
        next(err);
    }
});

//accept a friend request
router.post('/acceptfriend', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    const { otherUserId } = req.body;
    try {
        socketServer().emit('accept_friend_request', { userId: yourId, otherUserId })
        res.send(await acceptFriendRequest(otherUserId, yourId));
    } catch (err) {
        next(err);
    }
});

//reject friend request 
router.post('/rejectfriend', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    const { otherUserId } = req.body;
    try {
        socketServer().emit('reject_friend_request', { userId: yourId, otherUserId })
        res.send(await rejectFriendRequest(otherUserId, yourId));
    } catch (err) {
        next(err);
    }
});

router.post('/cancelrequest', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id;
    const { otherUserId } = req.body;
    try {
        res.send(await rejectFriendRequest(yourId, otherUserId));
    } catch (err) {
        next(err);
    }
});

//********************** end of friend requests 

//********************** methods on current friends 

//get user friends. returns friends as array of objects
router.get('/friends', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    try {
        res.send(await getUserFriendsFromDb(yourId));
    } catch (err) {
        next(err);
    }
});

// deletes a friend. returns nothing really
router.delete('/friends/:otherUserId', isLoggedIn, async (req, res, next) => {
    const yourId = req.body.user.id
    const { otherUserId } = req.params;
    try {
        res.send(await deleteFriend(yourId, otherUserId));
    } catch (err) {
        next(err);
    }
});

//************************ end of methods on current friends 

//************************ methods on groups

// get all of the groups that a user is currently in
router.get('/groups', isLoggedIn, async (req, res, next) => {
    const userId = req.body.user.id
    try {
        res.send(await getUserGroups(userId));
    } catch (err) {
        next(err);
    }
});

// gets a user's invitations to groups
router.get('/invitations', isLoggedIn, async (req, res, next) => {
    const userId = req.body.user.id
    try {
        res.send(await getUserGroupInvitations(userId));
    } catch (err) {
        next(err);
    }
});

//************************ end of methods on groups

//************************ methods on hashtags

// assigns an already existing hashtag to a user
router.post('/hashtags/assign', isLoggedIn, async (req, res, next) => {
    const userId = req.body.user.id
    const { hashtagId } = req.body
    try {
        const result = await assignHashtagToUser(hashtagId, userId)
        res.send(result)
    } catch (err) {
        next(err)
    }
})

// gets the user's saved hashtags
router.get('/hashtags', isLoggedIn, async (req, res, next) => {
    const userId = req.body.user.id
    try {
        const hashtags = await getUserHashtags(userId)
        res.send(hashtags)
    } catch (err) {
        next(err)
    }
})

//************************ end of methods on hashtags

//************************ search methods

// performs a user search based on email or on hash. returns array of users. If hash is duplicate,
// it will just have a list with the actual name of the users, so they will know who to pick
router.get('/search/:type/:text', isLoggedIn, async (req, res, next) => {
    const { type, text } = req.params
    try {
        if (type === 'email') {
            const users = await searchUsersByEmail(text)
            res.send(users)
        } else if (type === 'hash') {
            const users = await searchUsersByHash(text)
            res.send(users)
        }
    } catch (err) {
        next(err)
    }
})

//************************ end of search methods

// admin id: 9e3eeb19-c1d2-4e53-be78-5a4c8ea6cdff
// your id: 79014cfc-9298-4f49-afd1-0c26e9ecfc86