import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a list title'],
      trim: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const List = mongoose.model('List', listSchema);
export default List;
