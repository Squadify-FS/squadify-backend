import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User, Event } from '..';
import { EventPermissionLevelEnum } from '../../common/types';

@Entity()
export class UserEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  inviter: User;

  @ManyToOne(() => User, user => user.groups)
  user: User;

  @ManyToOne(() => Event, event => event.users)
  event: Event;

  @Column('int')
  permissionLevel: EventPermissionLevelEnum;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}