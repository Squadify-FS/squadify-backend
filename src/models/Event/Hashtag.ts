import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Event, User } from '..'

@Entity()
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  text: string;

  @ManyToMany(() => Event, event => event.hashtags)
  events: Event[]

  @ManyToMany(() => User, user => user.hashtags)
  users: User[]
}