import mongoose from 'mongoose';
import Activity from '../models/Activity.js';

class ActivityService {
  async getRecentActivity(workspaceId) {
    const pipeline = [
      { 
        $match: { 
          workspaceId: new mongoose.Types.ObjectId(workspaceId) 
        } 
      },
      { 
        $sort: { createdAt: -1 } 
      },
      { 
        $limit: 20 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          actionType: 1,
          targetType: 1,
          targetId: 1,
          createdAt: 1,
          'user._id': 1,
          'user.name': 1,
          'user.avatar': 1,
        }
      }
    ];

    return await Activity.aggregate(pipeline);
  }

  async logActivity(data) {
    return await Activity.create(data);
  }
}

export default new ActivityService();
