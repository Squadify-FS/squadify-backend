import express from 'express'

import { createConnection } from 'typeorm';
import { User, Group, Chat, Message, Event, UserUser, UserGroup, Geolocation } from './models/'
import { insertNewUserToDb, sendFriendRequest, getUserFriendsFromDb, getUserRequestsFromDb } from './controller/user'

// import routes 
import authRouter from './routes/auth';
import userRouter from './routes/user';

import "reflect-metadata";


const app = express()

app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-Real-Ip, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

(async () => {
  await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres', //can be changed, but each of us would have to make a user with this username in their psql
    database: 'squadify_db',
    password: '123456',
    entities: [
      User,
      UserUser,
      UserGroup,
      // UserGeolocation,
      Group,
      Message,
      Event,
      // EventGeolocation,
      Chat,
      Geolocation
    ], // DB models go here, have to be imported on top of this file
    synchronize: true,
    logging: false,
  });

  // routes 
  app.use('/auth', authRouter)
  app.use('/user', userRouter)

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
})();

export { app };