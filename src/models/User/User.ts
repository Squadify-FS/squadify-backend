/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, ManyToOne } from 'typeorm';
import { Message } from '../Group/Message';

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

  @OneToMany(type => Message, message => message.user)
  sentMessages: Message[]
}

