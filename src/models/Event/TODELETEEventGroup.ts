import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { Group, Event } from '..'

@Entity()
export class EventGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => Event)
  event: Event;
}