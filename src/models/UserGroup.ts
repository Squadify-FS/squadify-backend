/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './User';
import { Group } from './Group';
import { GroupPermissionLevelEnum } from '../common/types';

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => User)
  user: User;

  @ManyToOne((type) => Group)
  group: Group;

  @Column('int')
  permissionLevel: GroupPermissionLevelEnum;
}
