import express from 'express';
import { getUserFromDb, getUserFriendsFromDb, sendFriendRequest, getUserRequestsFromDb, deleteFriend, acceptFriendRequest, rejectFriendRequest, updateUser, getUserGroupInvitations, getUserGroups } from '../controller';
import { isLoggedIn } from '../common/middleware';
const router = express.Router()

//base route is /user

export default router;

export interface IOtherUserId {
    otherUserId: string;
}

//***************** user 

//get user object
router.get('/:email', isLoggedIn, async (req, res, next) => {
    const { email } = req.params;
    try {
        res.send(await getUserFromDb(email))
    } catch (err) {
        next(err);
    }
});

// updates user info
router.put('/:yourId/updateProfile', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    const { firstName, lastName, email, password, avatarUrl } = req.body
    try {
        res.send(await updateUser(yourId, firstName, lastName, email, password, avatarUrl));
    } catch (err) {
        next(err);
    }
});

//************** end of user 

//************************* friend requests 

//get a user's sent AND received friend requests
router.get('/:yourId/friendrequests', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    try {
        res.send(await getUserRequestsFromDb(yourId));
    } catch (err) {
        next(err);
    }
});


//add friend. should return an object with friend request info
router.post('/:yourId/addfriend', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    const { otherUserId }: IOtherUserId = req.body;
    try {
        res.send(await sendFriendRequest(yourId, otherUserId));
    } catch (err) {
        next(err);
    }
});

//accept a friend request
router.post('/:yourId/acceptfriend', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    const { otherUserId }: IOtherUserId = req.body;
    try {
        res.send(await acceptFriendRequest(otherUserId, yourId));
    } catch (err) {
        next(err);
    }
});

//reject friend request 
router.post('/:yourId/rejectfriend', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    const { otherUserId }: IOtherUserId = req.body;
    try {
        res.send(await rejectFriendRequest(otherUserId, yourId));
    } catch (err) {
        next(err);
    }
});

//********************** end of friend requests 

//********************** methods on current friends 

//get user friends. returns friends as object
router.get('/:yourId/friends', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    try {
        res.send(await getUserFriendsFromDb(yourId));
    } catch (err) {
        next(err);
    }
});

// deletes a friend. returns a new list of all your friends
router.delete('/:yourId/friends', isLoggedIn, async (req, res, next) => {
    const { yourId } = req.params;
    const { otherUserId }: IOtherUserId = req.body;
    try {
        res.send(await deleteFriend(yourId, otherUserId));
    } catch (err) {
        next(err);
    }
});

//************************ end of methods on current friends 

// get all of the groups that a user is currently in
router.get('/groups', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id

        res.send(await getUserGroups(userId));
    } catch (err) {
        next(err);
    }
});

// gets a user's invitations to groups
router.get('/invitations', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id

        res.send(await getUserGroupInvitations(userId));
    } catch (err) {
        next(err);
    }
});



// admin id: 9e3eeb19-c1d2-4e53-be78-5a4c8ea6cdff
// your id: 79014cfc-9298-4f49-afd1-0c26e9ecfc86