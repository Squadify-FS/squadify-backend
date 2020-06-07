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
exports.updateUserGeolocationInDb = exports.setUserGeolocationInDb = exports.deleteFriend = exports.rejectFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = exports.comparePassword = exports.generateJwt = exports.getUserFromDb = exports.insertNewUserToDb = void 0;
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
        return null;
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
            .where('uu."accepted" = true')
            .execute();
        return result;
    }
    catch (ex) {
        console.log(ex);
    }
});
const sendFriendRequest = (requesterId, requestedId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const relation = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(models_2.UserUser)
            .values({
            userId: requesterId,
            friendId: requestedId
        })
            .execute();
        return relation;
    }
    catch (ex) {
        console.log(ex);
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
    }
});
exports.rejectFriendRequest = rejectFriendRequest;
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
    }
});
exports.deleteFriend = deleteFriend;
// this function will only be used when a user registers, as they will always have a set location after they register and will only have to update it
const setUserGeolocationInDb = (userId, address, latitude, longitude) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepo = yield typeorm_1.getConnection().getRepository(models_1.User); // get user repo from db
        const geolocationRepo = yield typeorm_1.getConnection().getRepository(models_1.Geolocation); // get geolocation repo from db
        const user = yield userRepo //get user from db
            .createQueryBuilder('user')
            .where({ id: userId })
            .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
            .getOne();
        if (!user)
            throw new Error('Something went wrong querying user');
        const existingGeolocation = yield geolocationRepo // find existing location if it exists
            .createQueryBuilder('geolocation')
            .where(`geolocation.address = :address`, { address })
            .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
            .getOne();
        if (existingGeolocation) {
            const result = yield typeorm_1.getConnection()
                .createQueryBuilder()
                .insert()
                .into(models_1.UserGeolocation)
                .values({ user: { id: user.id }, geolocation: { id: existingGeolocation.id } })
                .execute();
            return result;
        }
        else {
            const newGeolocationId = (yield typeorm_1.getConnection()
                .createQueryBuilder()
                .insert()
                .into(models_1.Geolocation)
                .values({ address, latitude, longitude })
                .execute()).identifiers[0].id;
            const newGeolocation = yield geolocationRepo.findOne({ id: newGeolocationId });
            if (!newGeolocation)
                throw new Error('Something went wrong with new geolocation');
            const result = yield typeorm_1.getConnection()
                .createQueryBuilder()
                .insert()
                .into(models_1.UserGeolocation)
                .values({ user: { id: user.id }, geolocation: { id: newGeolocation.id } })
                .execute();
            return result;
        }
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.setUserGeolocationInDb = setUserGeolocationInDb;
const updateUserGeolocationInDb = (userId, address, latitude, longitude) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepo = yield typeorm_1.getConnection().getRepository(models_1.User); // get user repo from db
        const geolocationRepo = yield typeorm_1.getConnection().getRepository(models_1.Geolocation); // get geolocation repo from db
        const userGeolocationRepo = yield typeorm_1.getConnection().getRepository(models_1.UserGeolocation);
        const user = yield userRepo //get user from db
            .createQueryBuilder('user')
            .where({ id: userId })
            .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
            .getOne();
        if (!user)
            throw new Error('Something went wrong querying user');
        const existingGeolocation = yield geolocationRepo // find existing location if it exists
            .createQueryBuilder('geolocation')
            .where(`geolocation.address = :address`, { address })
            .orWhere(`latitude = :latitude AND longitude = :longitude`, { latitude, longitude })
            .getOne();
        if (existingGeolocation) {
            const result = yield userGeolocationRepo
                .createQueryBuilder('relation')
                .update(models_1.UserGeolocation)
                .set({ geolocation: existingGeolocation })
                .where(`relation.user.id = userId`, { userId: user.id })
                .execute();
            return result;
        }
        else {
            const newGeolocationId = (yield typeorm_1.getConnection()
                .createQueryBuilder()
                .insert()
                .into(models_1.Geolocation)
                .values({ address, latitude, longitude })
                .execute()).identifiers[0].id;
            const newGeolocation = yield geolocationRepo.findOne({ id: newGeolocationId });
            if (!newGeolocation)
                throw new Error('Something went wrong with new geolocation');
            const result = yield userGeolocationRepo
                .createQueryBuilder('relation')
                .update(models_1.UserGeolocation)
                .set({ geolocation: newGeolocation })
                .where(`relation.user.id = userId`, { userId: user.id })
                .execute();
            return result;
        }
    }
    catch (ex) {
        console.log(ex);
    }
});
exports.updateUserGeolocationInDb = updateUserGeolocationInDb;
//# sourceMappingURL=user.js.map