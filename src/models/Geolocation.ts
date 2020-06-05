/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User, Event } from '.';

@Entity()
export class Geolocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: "decimal", precision: 10, scale: 6, nullable: true })
  longitude: number;

  @OneToMany(type => User, user => user.geolocation)
  users: User[]

  @OneToMany(type => Event, event => event.geolocation)
  events: Event[]
}