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
exports.comparePlaintextToHashedPassword = exports.decodeJwt = exports.generateJwt = exports.followUser = exports.getUserFromDb = exports.insertNewUserToDb = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const typeorm_1 = require("typeorm");
const insertNewUserToDb = ({ firstName, lastName, password, email, dob }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(User_1.User)
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
            const user = yield typeorm_1.getConnection().getRepository(User_1.User).findOne({ id });
            return user;
        }
        const user = yield typeorm_1.getConnection().getRepository(User_1.User).findOne({ email });
        return user;
    }
    catch (ex) {
        console.log(ex);
        return null;
    }
});
exports.getUserFromDb = getUserFromDb;
const followUser = (senderId, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // return what?
    }
    catch (ex) {
        console.log(ex);
        return null;
    }
});
exports.followUser = followUser;
const generateJwt = ({ id, email, firstName, lastName }) => {
    return jsonwebtoken_1.default.sign({ id, email, firstName, lastName }, process.env.JWT_SECRET || 'SHHHHHH', {
        expiresIn: '1h',
    });
};
exports.generateJwt = generateJwt;
const decodeJwt = (token) => {
    try {
        const body = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'SHHHHHH');
        return body;
    }
    catch (ex) {
        console.log(ex);
        return null;
    }
};
exports.decodeJwt = decodeJwt;
const hashAndSaltPassword = (plaintextPassword) => {
    return bcrypt_1.default.hashSync(plaintextPassword, 10);
};
const comparePlaintextToHashedPassword = (plaintextPassword, hashedPassword) => {
    return bcrypt_1.default.compareSync(plaintextPassword, hashedPassword);
};
exports.comparePlaintextToHashedPassword = comparePlaintextToHashedPassword;
//# sourceMappingURL=user.js.map