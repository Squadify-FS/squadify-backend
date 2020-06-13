/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany } from 'typeorm';
import { Group } from './Group'
import { Message } from './Message';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(type => Group, group => group.chat)
  group: Group;

  @OneToMany(type => Message, message => message.chat)
  messages: Message[]
}

