import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { Group } from './Group'
import { app } from '..';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(type => Group, group => group.chat)
  group: Group;


}

