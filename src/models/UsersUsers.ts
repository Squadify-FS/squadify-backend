import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './User';

@Entity()
export class UsersUsers {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User)
  sender: User;

  @ManyToOne((type) => User)
  receiver: User;

  @Column()
  accepted: boolean;
}