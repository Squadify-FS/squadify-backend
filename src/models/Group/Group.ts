import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany, ManyToMany } from 'typeorm';

import { Chat, UserGroup, Event } from '..';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  isPrivate: boolean;

  @Column({ default: true })
  followersReadOnly: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToOne(() => Chat, chat => chat.group)
  @JoinColumn()
  chat: Chat;

  @OneToMany(() => UserGroup, usergroup => usergroup.group)
  users: UserGroup[]

  @ManyToMany(() => Event, event => event.groups)
  events: Event[]
}