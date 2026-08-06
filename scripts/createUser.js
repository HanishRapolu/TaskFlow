import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
dotenv.config();

const [,, email, password, name = 'Owner User'] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/createUser.js <email> <password> [name]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const users = mongoose.connection.db.collection('users');

const hashed = bcrypt.hashSync(password, 10);
const now = new Date();

const res = await users.updateOne(
  { email },
  { $set: { email, name, password: hashed, role: 'owner', updatedAt: now }, $setOnInsert: { createdAt: now } },
  { upsert: true }
);

if (res.upsertedId) console.log('User created with id', res.upsertedId._id);
else console.log('User updated or already existed');
await mongoose.disconnect();