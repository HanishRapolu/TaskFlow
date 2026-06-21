import asyncHandler from 'express-async-handler';
import boardService from '../services/boardService.js';

export const createBoard = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const board = await boardService.createBoard(workspaceId, req.body);
  res.status(201).json(board);
});

export const getBoards = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const boards = await boardService.getBoards(workspaceId);
  res.json(boards);
});
