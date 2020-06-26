import express from 'express'
// import { resolve } from 'path';
import { config } from 'dotenv'
import socketio from 'socket.io'
import { socket } from './socket'

import { createConnection } from 'typeorm';
import { User, Group, Chat, Message, Event, UserUser, UserGroup, UserEvent, Geolocation, IOU, Hashtag } from './models/'

config()

// import routes 
import authRouter from './routes/auth';
import userRouter from './routes/user';
import groupsRouter from './routes/groups';
import eventRouter from './routes/event';

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

console.log(process.env.DB_HOST)

const createApp = async () => {

  let retries = 5
  while (retries) {
    try {
      await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER, //can be changed, but each of us would have to make a user with this username in their psql
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
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
      break
    } catch (err) {
      console.log(err)
      retries -= 1;
      console.log(`retries left: ${retries}`)
      await new Promise(res => setTimeout(res, 3000))
    }
  }

  // routes 
  app.use('/auth', authRouter)
  app.use('/user', userRouter)
  app.use('/groups', groupsRouter)
  app.use('/event', eventRouter);
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