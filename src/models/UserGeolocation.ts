import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { User, Geolocation } from '.'

@Entity()
export class UserGeolocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => User)
  user: User;

  @ManyToOne((type) => Geolocation)
  geolocation: Geolocation;
}