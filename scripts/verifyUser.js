import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
dotenv.config();

const [,, email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node scripts/verifyUser.js <email> <password>');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await mongoose.connection.db.collection('users').findOne({ email });
if (!user) {
  console.log('User not found');
  await mongoose.disconnect();
  process.exit(0);
}

const hash = user.password || user.passwordHash || user.hash;
if (!hash) {
  console.log('No password hash on user');
  await mongoose.disconnect();
  process.exit(0);
}

const ok = await bcrypt.compare(password, hash);
console.log(ok ? 'PASSWORD MATCH' : 'PASSWORD MISMATCH');
await mongoose.disconnect();