import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Message } from '../Group/Message';
import { UserUser, UserGroup, Geolocation, IOU, Hashtag } from '..';
import { UserEvent } from './UserEvent';

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

  @ManyToOne(() => Geolocation, geolocation => geolocation.users)
  geolocation: Geolocation;

  @OneToMany(() => UserGroup, usergroup => usergroup.user)
  groups: UserGroup[]

  @OneToMany(() => UserEvent, userevent => userevent.user)
  events: UserEvent[]

  @OneToMany(() => UserUser, usersjointable => usersjointable.user)
  friends: UserUser[]

  @OneToMany(() => UserUser, usersjointable => usersjointable.friend)
  friendsInverse: UserUser[]

  @OneToMany(() => Message, message => message.user)
  sentMessages: Message[]

  @OneToMany(() => IOU, iou => iou.payer)
  expenses: IOU[];

  @ManyToOne(() => IOU, iou => iou.payees)
  debts: IOU[];

  @ManyToMany(() => Hashtag, hashtag => hashtag.users)
  hashtags: Hashtag[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}