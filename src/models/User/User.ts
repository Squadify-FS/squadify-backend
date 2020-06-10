/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne } from 'typeorm';
import { Message } from '../Group/Message';
import { UserUser, UserGroup, Group } from '..';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column("varchar", { length: 30 })
  firstName: string;

  @Column("varchar", { length: 30 })
  lastName: string;

  @Column()
  dob: Date;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(type => Message, message => message.user)
  sentMessages: Message[]

  @OneToMany(type => UserUser, useruser => useruser.user)
  friends: UserUser[]

  @OneToMany(type => UserUser, useruser => useruser.friend)
  friendsInverse: UserUser[]

  @OneToMany(type => UserGroup, usergroup => usergroup.user)
  groups: UserGroup[]
}

