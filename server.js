const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const uuid = require('uuid/v4');

const sessions = {};

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

const authenticate = (req, res) => {
    const token = tokenReq(req);
    const session = sessions[token];
    if (!session) {
        res.status(401).send({'error': 'Session expired or invalid token!'});
        return;
    }
    return session;
}

const tokenReq = (req) => {
    const authorization = req.header('Authorization');
    if (!authorization) {
        res.status(403).send({'error': 'Must be authenticated!'});
        return;
    }
    const token = authorization.split('Bearer ')[1];
    if (!token) {
        res.status(403).send({'error': 'Must be authenticated!'});
        return;
    }
    return token;
}
  
app.post('/login', (req, res, next) => {
    const {email, password} = req.body;
    if (!email || !password) {
        res.status(422).send({'error': 'Password or email not provided!'});
        return;
    }
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        res.status(401).send({'error': 'Email not found or password is invalid!'});
        return;
    }
    const sessionId = uuid();
    sessions[sessionId] = {
        users: JSON.parse(JSON.stringify(users)),
        styles: JSON.parse(JSON.stringify(users)),
        brands: JSON.parse(JSON.stringify(users))
    }
    res.status(200).send({
        token: sessionId
    });
});

app.get('/users/:id', (req, res, next) => {
    const session = authenticate(req, res);
    if (!session) {
        return;
    }
    setTimeout(() => {
        const id = +req.params.id;
        const user = session.users.find(u => u.id === id );
        if (user) {
            delete user.password;
            res.json(user);
            return;
        }
        res.status(404).send();
    }, 200);
});

app.delete('/users/:id', (req, res, next) => {
    const session = authenticate(req, res);
    if (!session) {
        return;
    }
    const id = +req.params.id;
    if (!id) {
        res.status(404).send();
        return;
    }
    const token = tokenReq(req);
    console.log(token);
    sessions[token].users = sessions[token].users.filter(u => u.id !== id);
    res.status(204).send();
});

app.get('/users', (req, res, next) => {
    const session = authenticate(req, res);
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
    console.log(req.body);
    res.status(201).send();
});

app.get('/brands/:id', (req, res, next) => {
    const session = authenticate(req, res);
    if (!session) {
        return;
    }
    setTimeout(() => {
        const id = +req.params.id;
        const brand = session.brands.find(b => b.id === id );
        if (brand) {
            res.json(brand);
            return;
        }
        res.status(404).send();
    }, 200);
});

app.get('/brands', (req, res, next) => {
    const session = authenticate(req, res);
    if (!session) {
        return;
    }
    setTimeout(() => {
        res.json(session.brands);
    }, 210);
});

app.get('/styles/:id', (req, res, next) => {
    const session = authenticate(req, res);
    if (!session) {
        return;
    }
    setTimeout(() => {
        const id = +req.params.id;
        const style = session.styles.find(s => s.id === id );
        if (style) {
            res.json(style);
            return;
        }
        res.status(404).send();
    }, 200);
});

app.get('/styles', (req, res, next) => {
    const session = authenticate(req, res);
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


const users = [
    {
        id: 21354,
        name: 'João Carlos da Silva',
        email: 'joaocarlos@mail.com',
        birthday: '1983-10-17',
        document: '07892151605',
        password: 'joao1234'
    },
    {
        id: 21355,
        name: 'Maria da Graça Machado',
        email: 'mariadagraca@mail.com',
        birthday: '1987-08-12',
        document: '54733982356',
        password: 'maria1234'
    },
    {
        id: 21356,
        name: 'José Schmit',
        email: 'josest@mail.com',
        birthday: '1962-04-20',
        document: '08657177536',
        password: 'jose1234'
    }
];

const brands = [
    {
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

const styles = [
    {
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