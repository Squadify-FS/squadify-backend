import express from 'express'

import { config } from 'dotenv'
import socketio from 'socket.io'

import { createConnection } from 'typeorm';
import { User, Group, Chat, Message, Event, UserUser, UserGroup, UserEvent, Geolocation, IOU, Hashtag } from './models/'

config()

// import routes 
import authRouter from './routes/auth';
import userRouter from './routes/user';
import groupsRouter from './routes/groups';
import eventRouter from './routes/event';
import iouRouter from './routes/iou'
import geolocationRouter from './routes/geolocation'

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

let _socketServer: any

(async () => {
  let retries = 5
  while (retries) {
    try {
      await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST, // must be 127.0.0.1 for localhost
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
  app.use('/iou', iouRouter)
  app.use('/geolocation', geolocationRouter)

  const server = app.listen(PORT, () => console.log(`listening on port ${PORT}`));
  _socketServer = socketio(server)
  _socketServer.on('connection', (socket: any) => {
    console.log(`A socket connection to the server has been made: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`Connection ${socket.id} has left the building`)
    })
  })

  // console.log(_socketServer)
  // Even though if you console.log(socketServer) outside this function it returns undefined, 
  //after the server starts running it is defined when hitting any of the routes. So all good.
})()

const socketServer = () => _socketServer

export {
  app,
  socketServer
};