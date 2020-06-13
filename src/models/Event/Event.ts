import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Geolocation, Group, UserEvent, GroupEvent } from '..';
// import { EventGroup } from './EventGroup';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'timestamp with time zone' })
  startTime: Date;
  // '2016-06-22 19:10:25-07' is format, where 07 is the timezone

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime: Date;
  // '2016-06-22 19:10:25-07' is format, where 07 is the timezone

  @Column()
  isPrivate: boolean;

  @ManyToOne(() => Geolocation, geolocation => geolocation.events)
  geolocation: Geolocation;

  @OneToMany(() => Group, group => group.events)
  @JoinTable()
  groups: Group[]

  // approval or confirmation to go to event will be handled in user by adding the event in the user's events property
  @OneToMany(() => UserEvent, userevent => userevent.event)
  @JoinTable()
  users: UserEvent[]
}
