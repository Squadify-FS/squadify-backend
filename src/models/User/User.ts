/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne } from 'typeorm';
import { Message } from '../Group/Message';
import { UserUser, UserGroup, Group, Geolocation } from '..';

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

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Message, message => message.user)
  sentMessages: Message[]

  @OneToMany(type => UserUser, usersjointable => usersjointable.user)
  friends: UserUser[]

  @OneToMany(() => UserUser, usersjointable => usersjointable.friend)
  friendsInverse: UserUser[]

  @OneToMany(() => UserGroup, usergroup => usergroup.user)
  groups: UserGroup[]

  @ManyToOne(() => Geolocation, geolocation => geolocation.users)
  geolocation: Geolocation;
}

