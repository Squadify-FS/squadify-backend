import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { User } from '..';

@Entity()
export class UserUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.friends)
  user: User;

  @ManyToOne(() => User, user => user.friendsInverse)
  friend: User;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}