import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { User } from './User'
import { Chat } from './Chat'

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;
}