"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUserFromGroup = exports.rejectInviteToGroup = exports.acceptInviteToGroup = exports.inviteUserToGroup = exports.insertNewGroupToDb = void 0;
const typeorm_1 = require("typeorm");
const models_1 = require("../models");
/*
FUNCTION WILL:
  create new group
  attach new chat to it
  attach creator of group as admin by creating relation in UserGroup join table
  send invitations to users admin invited when creating group in frontend form by creating relation in UserGroup join table
  return newly created group and chat
*/
const insertNewGroupToDb = ({ name, isPrivate, creatorId, invitedUsersIds }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const group = yield typeorm_1.getConnection() //create group and get id
            .createQueryBuilder()
            .insert()
            .into(models_1.Group)
            .values({ name, isPrivate })
            .execute();
        const groupId = group.identifiers[0].id;
        const chat = yield typeorm_1.getConnection() // create chat, assign group to it and get id
            .createQueryBuilder()
            .insert()
            .into(models_1.Chat)
            .values({ group: { id: groupId } })
            .execute();
        const chatId = chat.identifiers[0].id;
        yield typeorm_1.getConnection() // assign chat back to group previously created
            .createQueryBuilder()
            .update(models_1.Group)
            .set({ chat: { id: chatId } })
            .where({ id: groupId })
            .execute();
        yield typeorm_1.getConnection() // create relation between group and admin (note accepted is set to true)
            .createQueryBuilder()
            .insert()
            .into(models_1.UserGroup)
            .values({ user: { id: creatorId }, group: { id: groupId }, permissionLevel: 1, accepted: true })
            .execute();
        if (invitedUsersIds) { // invite users to join group, by setting accepted to false
            invitedUsersIds.forEach((userId) => __awaiter(void 0, void 0, void 0, function* () {
                yield typeorm_1.getConnection()
                    .createQueryBuilder()
                    .insert()
                    .into(models_1.UserGroup)
                    .values({ user: { id: userId }, group: { id: groupId }, permissionLevel: 0, accepted: false })
                    .execute();
            }));
        }
        return { group, chat };
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.insertNewGroupToDb = insertNewGroupToDb;
const deleteGroup = (groupId, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminRelation = yield typeorm_1.getConnection()
            .getRepository(models_1.UserGroup)
            .findOne({ user: { id: adminId }, group: { id: groupId } });
        if (adminRelation && adminRelation.permissionLevel < 1)
            throw new Error("You don't have admin permission in this group");
        const deletedRelations = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_1.UserGroup)
            .where({ group: { id: groupId } })
            .execute();
        const deletedGroup = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_1.Group)
            .where({ id: groupId });
        return { deletedGroup, deletedRelations };
    }
    catch (ex) {
        console.log(ex);
    }
});
const inviteUserToGroup = (groupId, inviterId, inviteeId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const group = yield typeorm_1.getConnection().getRepository(models_1.Group).findOne({ id: groupId });
        if (!group)
            throw new Error('Something went wrong in querying group');
        const inviterRelationWithGroup = yield typeorm_1.getConnection()
            .getRepository(models_1.UserGroup)
            .findOne({ user: { id: inviterId }, group: { id: groupId } });
        if (!inviterRelationWithGroup)
            throw new Error('User is not part of this group!!');
        if (group.isPrivate) {
            if (inviterRelationWithGroup.permissionLevel < 1)
                throw new Error("You don't have permission to perform this action");
        }
        const newRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(models_1.UserGroup)
            .values({ user: { id: inviteeId }, group: { id: groupId }, permissionLevel: 0, accepted: false })
            .execute();
        return newRelation;
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.inviteUserToGroup = inviteUserToGroup;
const acceptInviteToGroup = (userId, groupId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const relation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .update(models_1.UserGroup)
            .set({ accepted: true })
            .where({ user: { id: userId }, group: { id: groupId } })
            .execute();
        return relation;
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.acceptInviteToGroup = acceptInviteToGroup;
const rejectInviteToGroup = (userId, groupId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_1.UserGroup)
            .where({ user: { id: userId }, group: { id: groupId } })
            .execute();
        return deletedRelation;
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.rejectInviteToGroup = rejectInviteToGroup;
const removeUserFromGroup = (removerId, userId, groupId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (removerId !== userId) { // used to manage if user is leaving group or admin is removing them
            const removerRelationToGroup = yield typeorm_1.getConnection()
                .getRepository(models_1.UserGroup)
                .findOne({ user: { id: removerId }, group: { id: groupId } });
            if (!removerRelationToGroup || removerRelationToGroup.permissionLevel < 1)
                throw new Error("You don't have permission to perform this action");
        }
        const deletedRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_1.UserGroup)
            .where({ user: { id: userId }, group: { id: groupId } })
            .execute();
        return deletedRelation;
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.removeUserFromGroup = removeUserFromGroup;
//# sourceMappingURL=group.js.map