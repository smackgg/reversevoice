import Koa from 'koa'
import compression from 'koa-compress'
// import session from 'koa-session-minimal'
import session from 'koa-session'
import bodyParser from 'koa-better-body'
import lusca from 'koa-lusca'
import MongoStore from 'koa-generic-session-mongo'
import flash from 'koa-flash'
import path from 'path'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import views from 'koa-views'
import koaStatic from 'koa-static'
import json from 'koa-json'


import { MONGODB_URI, SECRET_KEYS } from './util/secrets'
// Controllers (route handlers)

// Create Koa server
const app = new Koa()

// Connect to MongoDB
const mongoUrl = MONGODB_URI
mongoose.Promise = bluebird

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(
  () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
).catch(err => {
  console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err)
  process.exit()
})

// Express configuration
app.keys = SECRET_KEYS

app.use(json())
app.use(compression())
app.use(bodyParser({
  uploadDir: path.resolve(__dirname, './public/static/'),
  keepExtensions: true,
  multipart: true,
  querystring: require('qs'),
}))

app.use(session({ store: new MongoStore({ url: mongoUrl }) }, app))
app.use(flash())
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))


app.use(koaStatic(`${__dirname}/public`))

app.use(views(`${__dirname}/views`, {
  extension: 'ejs',
}))

export default app
