import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '..';

@Entity()
export class UserUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => User)
  user: User;

  @ManyToOne((type) => User)
  friend: User;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}