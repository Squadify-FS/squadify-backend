import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  isPrivate: boolean;
}