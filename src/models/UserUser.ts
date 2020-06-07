import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class UserUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  friendId: string;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  createdAt: Date;
}