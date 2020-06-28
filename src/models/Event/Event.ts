import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Group, UserEvent, Hashtag } from '..';


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

  @Column({ nullable: true })
  localized_address: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column()
  isPrivate: boolean;

  @ManyToMany(() => Hashtag, hashtag => hashtag.events)
  @JoinTable()
  hashtags: Hashtag[]

  @ManyToMany(() => Group, group => group.events)
  @JoinTable()
  groups: Group[]

  // approval or confirmation to go to event will be handled in user by adding the event in the user's events property
  @OneToMany(() => UserEvent, userevent => userevent.event)
  @JoinTable()
  users: UserEvent[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}