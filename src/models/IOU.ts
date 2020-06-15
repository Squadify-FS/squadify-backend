import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { User, Group } from '.';

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

  @ManyToOne(() => User, user => user.expenses)
  payer: User;

  @OneToMany(() => User, user => user.debts)
  payees: User[]
}