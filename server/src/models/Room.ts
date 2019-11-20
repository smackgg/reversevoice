import mongoose from 'mongoose'

interface RoomUserSchema {
  id: string;
  nickName: string;
  avatarUrl: string;
  oriAudio: {
    url: string;
  };
  revAudio: {
    url: string;
  };
}
export type RoomDocument = mongoose.Document & {
  createdAt: string;
  owner: RoomUserSchema;
  users: RoomUserSchema[];
};


const RoomUserSchema = {
  id: String,
  nickName: String,
  avatarUrl: String,
  oriAudio: {
    url: String,
  },
  revAudio: {
    url: String,
  },
}

const roomSchema = new mongoose.Schema({
  owner: RoomUserSchema,
  users: [RoomUserSchema],
}, { timestamps: true })


const Room = mongoose.model<RoomDocument>('Room', roomSchema)

export default Room
