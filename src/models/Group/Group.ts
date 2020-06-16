import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Chat, UserGroup, Event } from '..';
import { IOU } from '../IOU';

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

  @OneToMany(() => IOU, iou => iou.group)
  ious: IOU[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}