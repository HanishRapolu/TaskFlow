import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow', {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      maxPoolSize: 10,
    })
    .then(() => {
      console.log('MongoDB connected');
      return mongoose.connection;
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      console.log('Retrying MongoDB connection in 5 seconds...');
      connectionPromise = null;
      setTimeout(() => connectDB(), 5000);
      return null;
    });

  return connectionPromise;
};

export default connectDB;
