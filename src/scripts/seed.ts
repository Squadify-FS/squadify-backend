import { createConnection } from "typeorm";
import { User, Group, Message, Event, Chat } from "../models";



(async () => await createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres', //can be changed, but each of us would have to make a user with this username in their psql
  database: 'squadify_db',
  password: '123456',
  entities: [User, Group, Message, Event, Chat], // DB models go here, have to be imported on top of this file
  synchronize: true,
  logging: false,
})
)()