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

  rooms: {
    id: string;
    createAt: string;
  }[];
  joinedRooms: {
    id: string;
    owner: {
      nickName: string;
      avatarUrl: string;
    };
    createAt: string;
  }[];
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
  rooms: [{
    id: String,
    createAt: String,
  }],
  joinedRooms: [{
    id: String,
    owner: {
      nickName: String,
      avatarUrl: String,
    },
    createAt: String,
  }],
}, { timestamps: true })

const User = mongoose.model<UserDocument>('User', userSchema)

export default User
