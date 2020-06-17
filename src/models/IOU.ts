import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}