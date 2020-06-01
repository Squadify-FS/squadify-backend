import { Entity, Column, PrimaryGeneratedColumn, Index, Generated, OneToMany, JoinTable, ManyToOne } from 'typeorm';

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
  name: string; // or username
}