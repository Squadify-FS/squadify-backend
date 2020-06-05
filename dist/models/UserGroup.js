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
exports.UserGroup = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Group_1 = require("./Group");
const types_1 = require("../common/types");
let UserGroup = /** @class */ (() => {
    let UserGroup = class UserGroup {
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn('uuid'),
        __metadata("design:type", String)
    ], UserGroup.prototype, "id", void 0);
    __decorate([
        typeorm_1.ManyToOne((type) => User_1.User),
        __metadata("design:type", User_1.User)
    ], UserGroup.prototype, "user", void 0);
    __decorate([
        typeorm_1.ManyToOne((type) => Group_1.Group),
        __metadata("design:type", Group_1.Group)
    ], UserGroup.prototype, "group", void 0);
    __decorate([
        typeorm_1.Column('int'),
        __metadata("design:type", Number)
    ], UserGroup.prototype, "permissionLevel", void 0);
    UserGroup = __decorate([
        typeorm_1.Entity()
    ], UserGroup);
    return UserGroup;
})();
exports.UserGroup = UserGroup;
//# sourceMappingURL=UserGroup.js.map