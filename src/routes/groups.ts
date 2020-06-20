import express from 'express';
import { insertNewGroupToDb, deleteGroup, getUserGroupInvitations, inviteUserToGroup, acceptInviteToGroup, rejectInviteToGroup, removeUserFromGroup, followPublicGroup, updateGroupInfo, setGroupIsPrivate, setGroupFollowersReadOnly, getGroupUsers, getGroupUserInvitations, searchGroupByHash, searchGroupByName } from '../controller';
import { isLoggedIn, isGroupAdmin, isGroupFriend } from '../common/middleware';
const router = express.Router()

//base route is /groups

export default router;

// make a new group  and invite the friends specified in the form
router.post('/create', isLoggedIn, async (req, res, next) => {
    try {
        const creatorId = req.body.user.id
        const { name, isPrivate, friendIds, avatarUrl } = req.body;

        res.send(await insertNewGroupToDb({ name, isPrivate, creatorId, friendIds, avatarUrl }));
    } catch (err) {
        next(err);
    }
});

// delete a group
router.delete('/:groupId', isLoggedIn, isGroupAdmin, async (req, res, next) => {
    try {
        const userId = req.body.user.id
        const { groupId } = req.params;

        res.send(await deleteGroup({ groupId, userId }));
    } catch (err) {
        next(err);
    }
});

// invites a person to the group
router.post('/invititations/:groupId/send', isLoggedIn, isGroupFriend, async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const inviterId = req.body.user.id
        const { inviteeId } = req.body;

        res.send(await inviteUserToGroup(groupId, inviterId, inviteeId));
    } catch (err) {
        next(err);
    }
});

// gets all the invitations from a group. Only friends and admins can, as group's privacy is assumed
router.get('/invitations/:groupId', isLoggedIn, isGroupFriend, async (req, res, next) => {
    try {
        const { groupId } = req.params

        const invitedUsers = await getGroupUserInvitations(groupId)
        res.send(invitedUsers)
    } catch (err) {
        next(err)
    }
})

// accept an invite to a group
router.put('/invitations/:groupId/accept', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id
        const { groupId } = req.params;

        res.send(await acceptInviteToGroup({ userId, groupId }));
    } catch (err) {
        next(err);
    }
});

// reject invite 
router.delete('/invitations/:groupId/reject', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id
        const { groupId } = req.params

        res.send(await rejectInviteToGroup({ userId, groupId }));
    } catch (err) {
        next(err);
    }
});

// expel user from group
router.delete('/removeuser/:groupId', isLoggedIn, async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { removerId, userId } = req.body;

        res.send(await removeUserFromGroup(removerId, { userId, groupId }));
    } catch (err) {
        next(err);
    }
});

// follow a group
router.post('/follow/:groupId', isLoggedIn, async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.body.user.id

        res.send(await followPublicGroup({ userId, groupId }));
    } catch (err) {
        next(err);
    }
});

// update group's name or avatarUrl. must send both from frontend even if there's no change.
router.put('/:groupId/update/info', isLoggedIn, isGroupAdmin, async (req, res, next) => {
    try {
        const { groupId } = req.params
        const { name, avatarUrl } = req.body

        const updatedGroup = await updateGroupInfo(groupId, name, avatarUrl)
        res.send(updatedGroup)
    } catch (err) {
        next(err)
    }
})

// updates the group private status
router.put('/:groupId/update/privacy', isLoggedIn, isGroupAdmin, async (req, res, next) => {
    try {
        const { groupId } = req.params
        const userId = req.body.user.id
        const { isPrivate } = req.body

        const updatedGroup = await setGroupIsPrivate({ userId, groupId }, isPrivate)
        res.send(updatedGroup)
    } catch (err) {
        next(err)
    }
})

// updates the group followers can't write messages to chat status
router.put('/:groupId/update/read_only', isLoggedIn, isGroupAdmin, async (req, res, next) => {
    try {
        const { groupId } = req.params
        const userId = req.body.user.id
        const { followersReadOnly } = req.body

        const updatedGroup = await setGroupFollowersReadOnly({ userId, groupId }, followersReadOnly)
        res.send(updatedGroup)
    } catch (err) {
        next(err)
    }
})

// gets the users in a group. controller handles the user's permission if the group is private
router.get('/:groupId/users', isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.body.user.id
        const { groupId } = req.params

        const users = await getGroupUsers({ userId, groupId })
        res.send(users)
    } catch (err) {
        next(err)
    }
})

// searches an array of groups by name or hash, depending on "type" parameter
router.get('/search/:type/:text', async (req, res, next) => {
    try {
        const { type, text } = req.params

        if (type === 'hash') {
            const groups = await searchGroupByHash(text)
            res.send(groups)
        } else if (type === 'name') {
            const groups = await searchGroupByName(text)
            res.send(groups)
        }
    } catch (err) {
        next(err)
    }
})
