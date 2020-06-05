"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const typeorm_1 = require("typeorm");
const Chat_1 = require("./Chat");
const User_1 = require("./User");
let Group = /** @class */ (() => {
    let Group = class Group {
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn('uuid'),
        __metadata("design:type", String)
    ], Group.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Group.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", Boolean)
    ], Group.prototype, "isPrivate", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Group.prototype, "avatarUrl", void 0);
    __decorate([
        typeorm_1.OneToOne(type => Chat_1.Chat, chat => chat.group),
        typeorm_1.JoinColumn(),
        __metadata("design:type", Chat_1.Chat)
    ], Group.prototype, "chat", void 0);
    __decorate([
        typeorm_1.ManyToMany(type => User_1.User),
        typeorm_1.JoinTable(),
        __metadata("design:type", Array)
    ], Group.prototype, "admins", void 0);
    __decorate([
        typeorm_1.ManyToMany(type => User_1.User, user => user.groups),
        __metadata("design:type", Array)
    ], Group.prototype, "users", void 0);
    Group = __decorate([
        typeorm_1.Entity()
    ], Group);
    return Group;
})();
exports.Group = Group;
//# sourceMappingURL=Group.js.map