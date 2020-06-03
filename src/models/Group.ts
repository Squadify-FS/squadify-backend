import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Chat } from './Chat'
import { User } from './User';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToOne(type => Chat, chat => chat.group)
  @JoinColumn()
  chat: Chat;

  @ManyToMany(type => User)
  @JoinTable()
  admins: User[]; // will have admin id, not admin object

  @ManyToMany(type => User, user => user.groups)
  users: User[]
}