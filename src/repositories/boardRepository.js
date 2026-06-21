import Board from '../models/Board.js';

class BoardRepository {
  async createBoard(boardData) {
    const board = new Board(boardData);
    return await board.save();
  }

  async getBoardsByWorkspace(workspaceId) {
    return await Board.find({ workspaceId });
  }
}

export default new BoardRepository();
