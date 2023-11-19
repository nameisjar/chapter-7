require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const Sentry = require('@sentry/node');
// const cors = require('cors');
const { PORT = 3000, SENTRY_DSN } = process.env;

// app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const server = require('http').createServer(app);
const io = require('socket.io')(server);


Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
});



app.get('/', (req, res) => {
    return res.render('home');
})

app.get('/forgot-password', (req, res) => {
    return res.render('forgot-password');
})



app.use((req, res, next) => {
    req.io = io;
    next();
  });

const authRouter = require('./routes/auth.routes');
app.use('/api/v1/auth', authRouter);

// The error handler must be registered before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: 'Not Found',
        error: null
    })
});

app.use((err, req, res, next) => {
    res.status(500).json({
        status: false,
        message: 'Internal Server Error',
        error: err.message,
        data: null
    })
});


app.listen(PORT, () => console.log('Listening on port', PORT));
