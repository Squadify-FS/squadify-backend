import express from 'express'
import socketio from 'socket.io'
import { socket } from './socket'

import { createConnection } from 'typeorm';
import { User, Group, Chat, Message, Event, UserUser, UserGroup, UserEvent, Geolocation, IOU, Hashtag } from './models/'

// import routes 
import authRouter from './routes/auth';
import userRouter from './routes/user';
import groupsRouter from './routes/groups';
import eventRouter from './routes/event';
import geolocationRouter from './routes/geolocation';

import "reflect-metadata";

const app = express()
const PORT = process.env.PORT || 3000;

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

const createApp = async () => {
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
      UserEvent,
      Group,
      Message,
      Event,
      Chat,
      Geolocation,
      IOU,
      Hashtag
    ], // DB models go here, have to be imported on top of this file
    synchronize: true,
    logging: false,
  });

  // routes 
  app.use('/auth', authRouter)
  app.use('/user', userRouter)
  app.use('/groups', groupsRouter)
  app.use('/event', eventRouter);
  app.use('/geolocation', geolocationRouter);
  app.get('/', (_, res) => res.send('hello'));
}

let _socketServer: socketio.Server

const startListening = () => {
  // must be commented for testing TODO
  const server = app.listen(PORT, () => console.log(`listening on port ${PORT}`));
  _socketServer = socketio(server)
  socket(_socketServer)
}

createApp()
startListening()

const socketServer = () => _socketServer

export {
  app,
  socketServer
};