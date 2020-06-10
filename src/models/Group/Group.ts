/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Chat } from './Chat'
import { UserGroup } from '..';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  isPrivate: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToOne(type => Chat, chat => chat.group)
  @JoinColumn()
  chat: Chat;

  @OneToMany(type => UserGroup, usergroup => usergroup.group)
  users: UserGroup[]
}