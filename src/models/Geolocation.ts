/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}