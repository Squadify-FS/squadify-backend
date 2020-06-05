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
const express_1 = __importDefault(require("express"));
const user_1 = require("../controller/user");
const router = express_1.default.Router();
exports.default = router;
router.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield user_1.getUserFromDb(email);
        if (user === undefined || user === null)
            return res.status(403).json({ message: 'There was an error authenticating' });
        if (!user_1.comparePlaintextToHashedPassword(password, user.password))
            return res.status(403).json({ message: 'There was an error authenticating' });
        const token = user_1.generateJwt({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });
        return res
            .status(200)
            .json({ message: 'Authenticated successfully', token });
    }
    catch (ex) {
        console.log(ex);
        next(ex);
    }
}));
router.post('/register', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, lastName, firstName, dob } = req.body;
    try {
        const result = yield user_1.insertNewUserToDb({ email, password, firstName, lastName, dob });
        if (!result)
            return res.status(500).json({ message: 'An error occured' });
        const user = result.identifiers[0];
        const token = user_1.generateJwt({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });
        res.json({ message: 'success', token });
    }
    catch (ex) {
        console.log(ex);
        next(ex);
    }
}));
//# sourceMappingURL=auth.js.map