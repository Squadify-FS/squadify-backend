import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne, ManyToMany, CreateDateColumn, UpdateDateColumn, JoinTable } from 'typeorm';
import { Message } from '../Group/Message';
import { UserUser, UserGroup, IOU, Hashtag } from '..';
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

  @Column({ nullable: true })
  localized_address: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: number;

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

  @ManyToMany(() => IOU, iou => iou.payer)
  expenses: IOU[];

  @ManyToMany(() => IOU, iou => iou.payees)
  debts: IOU[];

  @ManyToMany(() => Hashtag, hashtag => hashtag.users)
  @JoinTable()
  hashtags: Hashtag[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}