import boardRepository from '../repositories/boardRepository.js';
import AppError from '../utils/AppError.js';

class BoardService {
  async createBoard(workspaceId, data) {
    if (!data.name) {
      throw new AppError('Board name is required', 400);
    }

    return await boardRepository.createBoard({
      ...data,
      workspaceId,
    });
  }

  async getBoards(workspaceId) {
    return await boardRepository.getBoardsByWorkspace(workspaceId);
  }
}

export default new BoardService();
