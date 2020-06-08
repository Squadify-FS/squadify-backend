/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'timestamp with time zone' })
  dateAndTime: Date;
  // '2016-06-22 19:10:25-07' is format, where 07 is the timezone

  @Column()
  isPrivate: boolean;

  @Column()
  isFinished: boolean;
}
