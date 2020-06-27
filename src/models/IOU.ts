import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
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

  @ManyToMany(() => User, user => user.expenses)
  @JoinTable()
  payer: User;

  @ManyToMany(() => User, user => user.debts)
  @JoinTable()
  payees: User[]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}