import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
import { Message } from '../Group/Message';
import { UserUser, UserGroup, Geolocation, Event } from '..';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column("varchar", { length: 30 })
  firstName: string;

  @Column("varchar", { length: 30 })
  lastName: string;

  @Column()
  dob: Date;

  @Column()
  avatarUrl: string;

  @OneToMany(() => Message, message => message.user)
  sentMessages: Message[]

  @ManyToOne(() => Geolocation, geolocation => geolocation.users)
  geolocation: Geolocation;

  @ManyToMany(() => Event, event => event.users)
  events: Event[]

  @OneToMany(() => UserUser, usersjointable => usersjointable.user)
  friends: UserUser[]

  @OneToMany(() => UserUser, usersjointable => usersjointable.friend)
  friendsInverse: UserUser[]

  @OneToMany(() => UserGroup, usergroup => usergroup.user)
  groups: UserGroup[]

}

