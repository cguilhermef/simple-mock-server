const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const uuid = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');
const sha1 = require('sha1');

const rooms = {};

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, Authorization, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS");
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ 'message': 'Its working!' });
});

app.post('/start', (req, res, next) => {
  const {
    hash,
    secret
  } = req.body;
  if (!hash || !secret) {
    res.status(422).json({
      'error': 'Hash or secret not provided!'
    });
    return;
  }
  if (!rooms[hash]) {
    room = createRoom(hash, secret);
  }
  const secretHash = sha1(secret);
  const user = rooms[hash].users.find(u => u === secretHash);
  if (!user) {
    rooms[hash].users.push(secretHash);
  }
  res.status(200).json({
    data: {
      hash,
      token: sha1(secret),
      messages: rooms[hash].messages
    }
  });
});

app.get('/messages-of/:hash', (req, res, next) => {
  const hash = req.params.hash;
  if (!hash) {
    res.status(403).json({
      'error': 'Chat must be specified!'
    });
    return;
  }
  if (!rooms[hash]) {
    res.status(404).json({
      'error': 'Chat not found!'
    });
    return;
  }
  res.status(200).json({
    data: {
      messages: rooms[hash].messages
    }
  });
});

app.post('/messages-of/:hash', (req, res, next) => {
  const hash = req.params.hash;
  if (!hash) {
    res.status(403).json({
      'error': 'Chat must be specified!'
    });
    return;
  }
  if (!rooms[hash]) {
    res.status(404).json({
      'error': 'Chat not found!'
    });
    return;
  }
  const { token, message } = req.body;
  if (!token || !message) {
    res.status(422).json({
      'error': 'Token or message was missed'
    });
    return;
  }
  createMessage(hash, token, message, (error, messages) => {
    if (error) {
      res.status(400).json({
        'error': 'Error on creating new message.'
      });
      return;
    }
    res.status(201).json({
      data: {
        hash,
        token,
        messages
      }
    });
  });
});


const getRoom = (hash, secret) => {
  const room = rooms[hash];
  if (!room) {
    return;
  }
  const secretHash = sha1(secret);
  const user = room.users.find(u => u.secret === secretHash);
  if (!user) {
    return;
  }
  return room;
}

const createRoom = (hash, secret) => {
  const usage = rooms[hash];
  if (!usage) {
    rooms[hash] = {
      hash,
      users: [sha1(secret)],
      messages: []
    };
  }
  return rooms[hash];
}

const createMessage = (hash, token, message, callback) => {
  const room = rooms[hash];
  if (!room) {
    callback(true);
    return;
  }
  const user = room.users.find(u => u === token);
  if (!user) {
    callback(true);
    return;
  }
  room.messages.push({ token, message });
  callback(null, room.messages);
}

app.listen(4000, function () {
  console.log('running...');
});