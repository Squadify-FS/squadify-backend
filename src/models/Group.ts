/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Chat } from './Chat'

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  isPrivate: boolean;

  @Column()
  avatarUrl: string;

  @OneToOne(type => Chat, chat => chat.group)
  @JoinColumn()
  chat: Chat;
}