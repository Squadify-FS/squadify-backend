import express from 'express';
import { insertNewGroupToDb, deleteGroup, inviteUserToGroup, acceptInviteToGroup, rejectInviteToGroup, removeUserFromGroup, followPublicGroup, updateGroupInfo, setGroupIsPrivate, setGroupFollowersReadOnly, getGroupUsers, getGroupUserInvitations, searchGroupsByHash, searchGroupsByName, getUserGroupRelation, addMessageToChat, getChatFromGroup, getMessagesFromChat } from '../controller';
import { isLoggedIn, isGroupAdmin, isGroupFriend, isReadOnlyGroup, isGroupUser, isPrivateGroup } from '../common/middleware';
import { socketServer } from '..';
const router = express.Router()

//base route is /groups

export default router;

//************************ group create update and delete routes

// make a new group  and invite the friends specified in the form
router.post('/create', isLoggedIn, async (req, res, next) => {
    try {
        const creatorId = req.body.user.id
        const { name, isPrivate, friendIds, avatarUrl } = req.body;
        const group = await insertNewGroupToDb({ name, isPrivate, creatorId, friendIds, avatarUrl })

        socketServer().emit('create_group', { group: group?.group.raw[0], friendIds })
        res.send(group);
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
        socketServer().emit('set_group_isprivate', { groupId, isPrivate })
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
        socketServer().emit('set_group_readonly', { groupId, followersReadOnly })
        res.send(updatedGroup)
    } catch (err) {
        next(err)
    }
})

//************************ end of create update and delete routes

//************************ invitations and user relations routes

// invites a person to the group
router.post('/invitations/:groupId/send', isLoggedIn, isGroupFriend, async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const inviterId = req.body.user.id
        const { inviteeId } = req.body;

        socketServer().emit('invite_to_group', { groupId, inviterId, inviteeId })
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

        socketServer().emit('accept_invite_to_group', { userId, groupId })
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
        socketServer().emit('reject_invite_to_group', { userId, groupId })
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

        socketServer().emit('remove_user_from_group', { groupId, removerId, userId })
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

//************************ end of invitations and group relations routes

//************************ search routes

// searches an array of groups by name or hash, depending on "type" parameter
router.get('/search/:type/:text', async (req, res, next) => {
    try {
        const { type, text } = req.params

        if (type === 'hash') {
            const groups = await searchGroupsByHash(text)
            res.send(groups)
        } else if (type === 'name') {
            const groups = await searchGroupsByName(text)
            res.send(groups)
        }
    } catch (err) {
        next(err)
    }
})

//************************ end of search routes

//************************ chat routes

// send a message to a chat. handles permissions and readonly status of group
router.post('/chat/:groupId', isLoggedIn, isGroupUser, isPrivateGroup, isReadOnlyGroup, async (req, res, next) => {
    const userId = req.body.user.id
    const { groupId, isPrivate, isReadOnly } = req.params
    const { text, imageUrl } = req.body
    try {
        if (isReadOnly || isPrivate) {
            const relation = await getUserGroupRelation(userId, groupId)
            if (!relation || relation.permissionLevel < 1) res.status(403).json({ message: 'Chat is read only for followers' })
        }

        const chat = await getChatFromGroup(groupId)
        if (chat) {
            const message = await addMessageToChat({ userId, groupId, chatId: chat.id, text, imageUrl })
            res.send(message)
        }
    } catch (err) {
        next(err)
    }
})

// gets the group's chat object. might be a useless route but whatever lmao
router.get('/chat/:groupId', isLoggedIn, isGroupUser, isPrivateGroup, async (req, res, next) => {
    const userId = req.body.user.id
    const { groupId, isPrivate } = req.params
    try {
        if (isPrivate) {
            const relation = await getUserGroupRelation(userId, groupId)
            if (!relation || relation.permissionLevel < 1) res.status(403).json({ message: 'Chat is read only for followers' })
        }

        const chat = await getChatFromGroup(groupId)
        res.send(chat)
    } catch (err) {
        next(err)
    }
})

// gets messages for certain chat. must add pagination later //TODO
router.get('/chat/:groupId/messages', isLoggedIn, isGroupUser, isPrivateGroup, async (req, res, next) => {
    const userId = req.body.user.id
    const { groupId, isPrivate } = req.params
    try {
        if (isPrivate) {
            const relation = await getUserGroupRelation(userId, groupId)
            if (!relation || relation.permissionLevel < 1) res.status(403).json({ message: 'Chat is read only for followers' })
        }

        const chat = await getChatFromGroup(groupId)
        if (chat) {
            const messages = await getMessagesFromChat(chat.id)
            res.send(messages)
        }
    } catch (err) {
        next(err)
    }
})

