import logger from './logger'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env')) {
  logger.debug('Using .env file to supply config environment variables')
  dotenv.config({ path: '.env' })
} else {
  logger.debug('Using .env.example file to supply config environment variables')
  dotenv.config({ path: '.env.example' })  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV
export const prod = ENVIRONMENT === 'production' // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env['SESSION_SECRET']
export const SECRET_KEYS = process.env['SECRET_KEYS'].split(',')

export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_LOCAL']

// wechat
export const APP_ID = process.env['APP_ID']
export const APP_SECRET = process.env['APP_SECRET']

// QINIU
export const QINIU_ACCESS_KEY = process.env['QINIU_ACCESS_KEY']
export const QINIU_SECRET_KEY = process.env['QINIU_SECRET_KEY']

// MEDIA_URL
export const MEDIA_URL = process.env['MEDIA_URL']

if (!SESSION_SECRET) {
  logger.error('No client secret. Set SESSION_SECRET environment variable.')
  process.exit(1)
}

if (!MONGODB_URI) {
  if (prod) {
    logger.error('No mongo connection string. Set MONGODB_URI environment variable.')
  } else {
    logger.error('No mongo connection string. Set MONGODB_URI_LOCAL environment variable.')
  }
  process.exit(1)
}
