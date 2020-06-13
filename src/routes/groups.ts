import express from 'express';
import { insertNewGroupToDb, deleteGroup, getUserGroups, getUserGroupInvitations, inviteUserToGroup, acceptInviteToGroup, rejectInviteToGroup, removeUserFromGroup, followPublicGroup } from '../controller/group';
import { isLoggedIn } from '../common/middleware';
const router = express.Router()

//base route is /groups

export default router;

// get all of the groups that a user is currently in
router.get('/:userId', isLoggedIn, async (req, res, next) => {
    const { userId } = req.params;
    try {
        res.send(await getUserGroups(userId));
    } catch(err) {
        console.log(err);
    }
});

// make a new group 
router.post('/', isLoggedIn, async(req, res, next) => {
    const { name, isPrivate, creatorId, friendIds } = req.body;
    try {
        res.send(await insertNewGroupToDb({ name, isPrivate, creatorId, friendIds }));
    } catch(err) {
        console.log(err);
    }
});

// delete a group
router.delete('/:groupId', isLoggedIn, async(req, res, next) => {
    const { groupId } = req.params;
    const { adminId } = req.body;
    try {
        res.send(await deleteGroup(groupId, adminId));
    } catch(err) {
        console.log(err);
    }
});

// from a user's id, get all of the group invites that they received
router.get('/:userId/invitations', isLoggedIn, async(req, res, next) => {
    const { userId } = req.params;
    try {
        res.send(await getUserGroupInvitations(userId));
    } catch(err) {
        console.log(err);
    }
});

// invites a person to the group
router.post('/:groupId/invite', isLoggedIn, async(req, res, next) => {
    const { groupId } = req.params;
    const { inviterId, inviteeId } = req.body;
    try {
        res.send(await inviteUserToGroup(groupId, inviterId, inviteeId));
    } catch(err) {
        console.log(err);
    }
});

// accept an invite to a group
router.post('/:userId/invitations/accept', isLoggedIn, async(req, res, next) => {
    const { userId } = req.params;
    const { groupId } = req.body;
    try {
        res.send(await acceptInviteToGroup(userId, groupId));
    } catch(err) {
        console.log(err);
    }
});

// reject invite 
router.post('/:userId/invitations/reject', isLoggedIn, async(req, res, next) => {
    const { userId } = req.params;
    const { groupId } = req.body;
    try {
        res.send(await rejectInviteToGroup(userId, groupId));
    } catch(err) {
        console.log(err);
    }
});

// expel user from group
router.delete('/:groupId/removeuser', isLoggedIn, async(req, res, next) => {
    const { groupId } = req.params;
    const { removerId, userId } = req.body;
    try {
        res.send(await removeUserFromGroup(removerId, userId, groupId));
    } catch(err) {
        console.log(err);
    }
});

// follow a group
router.post('/:groupId/follow', isLoggedIn, async (req, res, next) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    try {
        res.send(await followPublicGroup(userId, groupId));
    } catch(err) {
        console.log(err);
    }
}); 