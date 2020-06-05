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
const typeorm_1 = require("typeorm");
const User_1 = require("../models/User");
const Group_1 = require("../models/Group");
const Message_1 = require("../models/Message");
const Chat_1 = require("../models/Chat");
(() => __awaiter(void 0, void 0, void 0, function* () {
    return yield typeorm_1.createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        database: 'squadify_db',
        password: '123456',
        entities: [User_1.User, Group_1.Group, Message_1.Message, Event, Chat_1.Chat],
        synchronize: true,
        logging: false,
    });
}))();
//# sourceMappingURL=seed.js.map