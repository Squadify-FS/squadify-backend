/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../User/User'
import { Chat } from './Chat'

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  text: string;

  @ManyToOne(type => Chat, chat => chat.messages)
  chat: Chat

  @ManyToOne(type => User, user => user.sentMessages)
  user: User;
}