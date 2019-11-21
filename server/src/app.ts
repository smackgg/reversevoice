import Koa from 'koa'
import compression from 'koa-compress'
// import session from 'koa-session'
import session from 'koa-session-minimal'
import bodyParser from 'koa-better-body'
import lusca from 'koa-lusca'
import MongoStore from 'koa-generic-session-mongo'
// import SessionStore from './config/store'
import flash from 'koa-flash'
// import path from 'path'
import logger from 'koa-logger'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import views from 'koa-views'
import koaStatic from 'koa-static'
import json from 'koa-json'
import wechatAuth from './config/wechatAuth'

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

app.use(compression())
app.use(bodyParser({
  // uploadDir: path.resolve(__dirname, './public/'),
  // keepExtensions: true,
  multipart: true,
  querystring: require('qs'),
}))
app.use(logger())

app.use(session({
  store: new MongoStore({
    url: mongoUrl,
  }),
}))

app.use(flash())
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))
app.use(koaStatic(`${__dirname}/public`))

app.use(json())

app.use(views(`${__dirname}/views`, {
  extension: 'ejs',
}))

app.use(wechatAuth)
// error catch middleware
app.use(async (ctx, next) => {
  ctx.session.count = ctx.session.count ? ctx.session.count + 1 : 1
  try {
    // if (!ctx.session.openid) {
    //   // 未登录
    //   ctx.throw(401, '微信登录失效')
    //   return
    // }
    await next()
  } catch (e) {
    switch (e.status) {
      case 204: // No Content
      case 400: // Bad Request
      case 401: // Unauthorized
      case 403: // Forbidden
      case 404: // Not Found
      case 406: // Not Acceptable
      case 409: // Conflict
        ctx.status = e.status
        ctx.body = {
          message: e.message,
          status: e.status,
        }
        break
      default:
      case 500: // Internal Server Error
        console.error(e.stack)
        ctx.status = e.status || 500
        ctx.body = app.env === 'development' ? e.stack : e.message
        break
    }
  }
})

//  routes handler
const routes: {
  [key: string]: any;
} = {
  user: require('./routes/user'),
  file: require('./routes/file'),
  room: require('./routes/room'),
  wechat: require('./routes/wechat'),
  // users: require('./routes/users'),
  // 公共 api
  // user: require('./routes/user'),
  // 哈理工 api
  // hrbust: require('./routes/hrbust'),
  // 一些公共 api
  // other: require('./routes/other'),
  // 后台 api
  // backend: require('./routes/backend'),
}

// routes
Object.keys(routes).forEach(key => {
  const route = routes[key]
  // , route.allowedMethods()
  app.use(route.routes())
})

export default app
