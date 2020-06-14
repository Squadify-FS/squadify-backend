import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User, Group } from '..';

@Entity()
export class IOU {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Group, group => group.ious)
  group: Group;

  @Column()
  payer: User;

  @OneToMany()
  payees: User[]
}