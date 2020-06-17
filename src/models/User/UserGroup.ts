import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Group } from '../Group/Group';
import { GroupPermissionLevelEnum } from '../../common/types';

@Entity()
export class UserGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  inviter: User;

  @ManyToOne(() => User, user => user.groups)
  user: User;

  @ManyToOne(() => Group, group => group.users)
  group: Group;

  // invitation to join group must be accepted, defaults to true for creator of group
  // private groups can only get more people in through invitation
  @Column()
  accepted: boolean;

  @Column('int')
  permissionLevel: GroupPermissionLevelEnum;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
