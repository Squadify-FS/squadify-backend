/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Geolocation, Group, User } from '..';
import { EventGroup } from './EventGroup';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'timestamp with time zone' })
  dateAndTime: Date;
  // '2016-06-22 19:10:25-07' is format, where 07 is the timezone

  @Column()
  isPrivate: boolean;

  @ManyToOne(() => Geolocation, geolocation => geolocation.events)
  geolocation: Geolocation;

  @ManyToMany(() => Group, group => group.events)
  @JoinTable()
  groups: Group[]

  // approval or confirmation to go to event will be handled in user by adding the event in the user's events property
  @ManyToMany(() => User, user => user.events)
  @JoinTable()
  users: User[]
}
