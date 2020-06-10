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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = exports.deleteFriend = exports.getUserRequestsFromDb = exports.getUserFriendsFromDb = exports.comparePassword = exports.generateJwt = exports.getUserFromDb = exports.insertNewUserToDb = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const typeorm_1 = require("typeorm");
const models_1 = require("../models");
const models_2 = require("../models");
const generateJwt = ({ id, email, firstName, lastName }) => {
    return jsonwebtoken_1.default.sign({ id, email, firstName, lastName }, process.env.JWT_SECRET || 'SHHHHHH', {
        expiresIn: '1h',
    });
};
exports.generateJwt = generateJwt;
const hashAndSaltPassword = (plaintextPassword) => {
    return bcrypt_1.default.hashSync(plaintextPassword, 10);
};
const comparePassword = (plaintextPassword, hashedPassword) => {
    return bcrypt_1.default.compareSync(plaintextPassword, hashedPassword);
};
exports.comparePassword = comparePassword;
const insertNewUserToDb = ({ firstName, lastName, password, email, dob }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //TODO MANAGE ADDRESS AND LOCATION INPUT WITH GOOGLE MAPS STUFF ETC
        const user = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(models_1.User)
            .values({ firstName, lastName, email, dob, password: hashAndSaltPassword(password) })
            .execute();
        return user;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.insertNewUserToDb = insertNewUserToDb;
const getUserFromDb = (email, id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (id) {
            const user = yield typeorm_1.getConnection().getRepository(models_1.User).findOne({ id });
            return user;
        }
        const user = yield typeorm_1.getConnection().getRepository(models_1.User).findOne({ email });
        return user;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.getUserFromDb = getUserFromDb;
const getUserFriendsFromDb = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .select(`u."id", u."firstName", u."lastName", u."email"`)
            .from(models_1.User, 'u')
            .innerJoin(models_2.UserUser, 'uu', 'u."id" = uu."userId" OR u."id" = uu."friendId"')
            .where('u."id" = :userId AND uu."accepted" = true', { userId })
            .execute();
        return result;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.getUserFriendsFromDb = getUserFriendsFromDb;
const getUserRequestsFromDb = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sentRequests = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .select(`u."id", u."firstName", u."lastName", u."email"`)
            .from(models_1.User, 'u')
            .innerJoin(models_2.UserUser, 'uu', 'u."id" = uu."userId"')
            .where('u."id" = :userId AND uu."accepted" = false', { userId })
            .execute();
        const incomingRequests = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .select(`u."id", u."firstName", u."lastName", u."email"`)
            .from(models_1.User, 'u')
            .innerJoin(models_2.UserUser, 'uu', 'u."id" = uu."friendId"')
            .where('u."id" = :userId AND uu."accepted" = false', { userId })
            .execute();
        return { sentRequests, incomingRequests };
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.getUserRequestsFromDb = getUserRequestsFromDb;
const deleteFriend = (userId, friendId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_2.UserUser)
            .where("userId = :userId AND friendId = :friendId", { userId, friendId })
            .execute();
        return deletedRelation;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.deleteFriend = deleteFriend;
const sendFriendRequest = (requesterId, requestedId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const relation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(models_2.UserUser)
            .values({
            user: { id: requesterId },
            friend: { id: requestedId }
        })
            .execute();
        return relation;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.sendFriendRequest = sendFriendRequest;
const acceptFriendRequest = (requesterId, requestedId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const acceptedRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .update(models_2.UserUser)
            .set({ accepted: true })
            .where(`userId = :requesterId AND friendId = :requestedId`, { requesterId, requestedId })
            .execute();
        return ({ message: 'success', acceptedRelation });
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.acceptFriendRequest = acceptFriendRequest;
const rejectFriendRequest = (requesterId, requestedId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedRequestRelation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .delete()
            .from(models_2.UserUser)
            .where("userId = :requesterId AND friendId = :requestedId", { requesterId, requestedId })
            .execute();
        return deletedRequestRelation;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.rejectFriendRequest = rejectFriendRequest;
//# sourceMappingURL=user.js.map