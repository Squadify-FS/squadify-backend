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
exports.addMessageToChat = void 0;
const typeorm_1 = require("typeorm");
const models_1 = require("../models");
const addMessageToChat = (userId, chatId, text, imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = yield typeorm_1.getConnection()
            .createQueryBuilder()
            .insert()
            .into(models_1.Message)
            .values({ user: { id: userId }, chat: { id: chatId }, text, imageUrl })
            .execute();
        return message;
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
});
exports.addMessageToChat = addMessageToChat;
//# sourceMappingURL=chat.js.map