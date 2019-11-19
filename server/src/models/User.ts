// import bcrypt from 'bcrypt-nodejs'
// import crypto from 'crypto'
import mongoose from 'mongoose'

export type UserDocument = mongoose.Document & {
  openid: {
    type: string;
    required: boolean;
    unique: boolean;
  };

  profile: {
    nickName: string;
    gender: number;
    language: string;
    city: string;
    province: string;
    country: string;
    avatarUrl: string;
  };
};


export interface AuthToken {
  accessToken: string;
  kind: string;
}

const userSchema = new mongoose.Schema({
  openid: {
    type: String,
    required: true,
    unique: true,
  },
  unionId: {
    type: String,
    required: true,
  },
  profile: {
    nickName: String,
    gender: Number,
    language: String,
    city: String,
    province: String,
    country: String,
    avatarUrl: String,
  },

}, { timestamps: true })

/**
 * Password hash middleware.
 */
// userSchema.pre('save', function save(next) {
//   const user = this as UserDocument
//   if (!user.isModified('password')) { return next() }
//   bcrypt.genSalt(10, (err, salt) => {
//     if (err) { return next(err) }
//     bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
//       if (err) { return next(err) }
//       user.password = hash
//       next()
//     })
//   })
// })

// const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
//   bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
//     cb(err, isMatch)
//   })
// }

// userSchema.methods.comparePassword = comparePassword

/**
 * Helper method for getting user's gravatar.
 */
// userSchema.methods.gravatar = function (size: number = 200) {
//   if (!this.email) {
//     return `https://gravatar.com/avatar/?s=${size}&d=retro`
//   }
//   const md5 = crypto.createHash('md5').update(this.email).digest('hex')
//   return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`
// }

const User = mongoose.model<UserDocument>('User', userSchema)

export default User
