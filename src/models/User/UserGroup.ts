/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './User';
import { Group } from '../Group/Group';
import { GroupPermissionLevelEnum } from '../../common/types';

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => User, user => user.groups)
  user: User;

  @ManyToOne((type) => Group)
  group: Group;

  // invitation to join group must be accepted, defaults to true for creator of group
  // private groups can only get more people in through invitation
  @Column()
  accepted: boolean;

  @Column('int')
  permissionLevel: GroupPermissionLevelEnum;
}
