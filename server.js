const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const uuid = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');

const sessions = [];

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const getSession = (req, res) => {
  const token = getToken(req, res);
  if (!token) {
    return;
  }
  const session = sessions.find(s => s.token === token);
  if (!session) {
    res.status(401).send({
      'error': 'Session expired or invalid token!'
    });
    return;
  }
  return session;
}

const getToken = (req, res) => {
  const authorization = req.header('Authorization');
  if (!authorization) {
    res.status(403).send({
      'error': 'Must be authenticated!'
    });
    return;
  }
  const token = authorization.split('Bearer ')[1];
  if (!token) {
    res.status(403).send({
      'error': 'Must be authenticated!'
    });
    return;
  }
  return token;
}

const isValid = (user, callback, notValidatePassword) => {
  const errors = [];
  if (!notValidatePassword) {
    if (!user.hasOwnProperty('password') || user.password.length < 4) {
      errors.push({
        field: 'password',
        message: 'The password field was missed or it\'s length is less than 3'
      });
    }
    if (user.password !== user.confirm) {
      errors.push({
        field: 'confirm',
        message: 'The password field not match with confirm field.'
      });
    }
  }
  if (!user.hasOwnProperty('email') || !/^[a-z0-9_\-\.]{2,}@[a-z0-9_\-\.]{2,}\.[a-z]{2,}$/i.test(user.email)) {
    errors.push({
      field: 'email',
      message: 'The email field doesn\'t contains a valid email.'
    });
  }
  if (!user.hasOwnProperty('name') || user.name.length <= 3) {
    errors.push({
      field: 'name',
      message: 'The name field missed or it\'s length is less than 3.'
    });
  }
  if (!user.hasOwnProperty('document') || user.document.length != 11) {
    errors.push({
      field: 'document',
      message: 'The document field missed or it\'s length isn\'t 11.'
    });
  }
  if (!user.hasOwnProperty('birthday') || !moment(user.birthday).isValid()) {
    errors.push({
      field: 'birthday',
      message: 'The birthday field missed or it\'s format is invalid - YYYY-MM-DD.'
    });
  }
  if (errors.length === 0) {
    callback();
  } else {
    callback(errors);
  }
}

app.post('/login', (req, res, next) => {
  const {
    email,
    password
  } = req.body;
  if (!email || !password) {
    res.status(422).send({
      'error': 'Password or email not provided!'
    });
    return;
  }
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    res.status(401).send({
      'error': 'Email not found or password is invalid!'
    });
    return;
  }
  const resetSession = req.query.reset;
  const session = sessions.find(s => s.email === email);
  if (!resetSession && session) {
    res.status(200).send({
      token: session.token
    });
    return;
  }
  if (resetSession && session) {
    delete session;
  }
  const sessionId = uuid();
  sessions.push({
    token: sessionId,
    email: email,
    users: JSON.parse(JSON.stringify(users)),
    styles: JSON.parse(JSON.stringify(styles)),
    brands: JSON.parse(JSON.stringify(brands))
  })
  res.status(200).send({
    token: sessionId
  });
});

app.get('/users/:id', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    const id = +req.params.id;
    const user = session.users.find(u => u.id === id);
    if (user) {
      delete user.password;
      res.json(user);
      return;
    }
    res.status(404).send();
  }, 200);
});

app.delete('/users/:id', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  const id = +req.params.id;
  if (!id) {
    res.status(404).send();
    return;
  }
  const token = getToken(req, res);
  session.users = session.users.filter(u => u.id !== id);
  res.status(204).send();
});

app.get('/users', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    res.json(session.users.map(u => {
      delete u.password;
      return u;
    }));
  }, 210);
});

app.post('/users', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  const user = req.body;
  isValid(user, (errors) => {
    if (errors) {
      res.status(422).send({
        errors
      });
      return;
    }
    user.id = session.users[session.users.length - 1].id + 1;
    session.users.push(
      _.pick(
        user,
        [
          'id',
          'name',
          'email',
          'document',
          'birthday',
          'password',
          'brands',
          'styles'
        ]
    ));
    res.status(201).json(user);
  });
});

app.put('/users/:id', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  const id = +req.params.id;
  const newUser = req.body;
  isValid(newUser, (errors) => {
    if (errors) {
      res.status(422).send({
        errors
      });
      return;
    }
    const oldUserIndex = session.users.findIndex(u => u.id === id);
    if (oldUserIndex <= -1) {
      res.status(404).send({
        error: 'This user.id was not found!'
      });
      return;
    }
    Object.assign(session.users[oldUserIndex],_
      .pick(
        newUser,
        [
          'name',
          'email',
          'document',
          'birthday',
          'brands',
          'styles'
        ]
    ));
    res.status(200).json(session.users[oldUserIndex]);
  }, true);
});

app.get('/brands/:id', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    const id = +req.params.id;
    const brand = session.brands.find(b => b.id === id);
    if (brand) {
      res.json(brand);
      return;
    }
    res.status(404).send();
  }, 200);
});

app.get('/brands', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    res.json(session.brands);
  }, 210);
});

app.get('/styles/:id', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    const id = +req.params.id;
    const style = session.styles.find(s => s.id === id);
    if (style) {
      res.json(style);
      return;
    }
    res.status(404).send();
  }, 200);
});

app.get('/styles', (req, res, next) => {
  const session = getSession(req, res);
  if (!session) {
    return;
  }
  setTimeout(() => {
    res.json(session.styles);
  }, 210);
});

app.listen(4000, function () {
  console.log('running...');
});


const users = [{
    id: 21354,
    name: 'João Carlos da Silva',
    email: 'joaocarlos@mail.com',
    birthday: '1983-10-17',
    document: '07892151605',
    password: 'joao1234',
    brands: [],
    styles: []
  },
  {
    id: 21355,
    name: 'Maria da Graça Machado',
    email: 'mariadagraca@mail.com',
    birthday: '1987-08-12',
    document: '54733982356',
    password: 'maria1234',
    brands: [],
    styles: []
  },
  {
    id: 21356,
    name: 'José Schmit',
    email: 'josest@mail.com',
    birthday: '1962-04-20',
    document: '08657177536',
    password: 'jose1234',
    brands: [],
    styles: []
  }
];

const brands = [{
    id: 1821,
    name: 'Eisenbahn'
  },
  {
    id: 1822,
    name: 'Patagonia'
  },
  {
    id: 1823,
    name: '1824 Imigração'
  },
  {
    id: 1824,
    name: 'Altenbrück'
  }
];

const styles = [{
    id: 2820,
    name: 'Amber lager'
  },
  {
    id: 2821,
    name: 'Dark lager'
  },
  {
    id: 2822,
    name: 'Pale lager'
  },
  {
    id: 2823,
    name: 'Pilsner'
  },
  {
    id: 2824,
    name: 'Amber ale'
  },
  {
    id: 2825,
    name: 'India pale ale (IPA)'
  },
  {
    id: 2826,
    name: 'Pale ale'
  },
  {
    id: 2827,
    name: 'Porter'
  },
  {
    id: 2828,
    name: 'Stout'
  },
  {
    id: 2829,
    name: 'Strong ale'
  }
];