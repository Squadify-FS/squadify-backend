import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Geolocation, Event } from '..';

@Entity()
export class EventGeolocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne((type) => Event)
  event: Event;

  @ManyToOne((type) => Geolocation)
  geolocation: Geolocation;
}