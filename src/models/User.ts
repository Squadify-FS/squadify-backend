import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Group } from './Group';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string; // or username

  @Column()
  lastName: string;

  @Column()
  dob: Date;

  @ManyToMany(type => User, user => user.following)
  @JoinTable()
  followers: User[];

  @ManyToMany(type => User, user => user.followers)
  following: User[];

  @ManyToMany(type => Group, group => group.users)
  @JoinTable()
  groups: Group[];
}
