const express = require('express');
const Board = require('../models/Board');
const User = require('../models/User');
const Card = require('../models/Card');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

async function loadBoardForMember(req, res) {
  const board = await Board.findById(req.params.boardId || req.params.id);
  if (!board) {
    res.status(404).json({ message: 'board not found' });
    return null;
  }
  const isMember = board.members.some((m) => m.toString() === req.user.id);
  if (!isMember) {
    res.status(403).json({ message: 'you are not a member of this board' });
    return null;
  }
  return board;
}

router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'title is required' });
    }
    const board = await Board.create({ title: title.trim(), owner: req.user.id, members: [req.user.id] });
    res.status(201).json({ board });
  } catch (err) {
    console.error('Create board error:', err);
    res.status(500).json({ message: 'server error creating board' });
  }
});

router.get('/', async (req, res) => {
  try {
    const boards = await Board.find({ members: req.user.id }).sort({ createdAt: -1 });
    res.json({ boards });
  } catch (err) {
    console.error('List boards error:', err);
    res.status(500).json({ message: 'server error listing boards' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const board = await loadBoardForMember(req, res);
    if (!board) return;
    const cards = await Card.find({ board: board._id }).sort({ column: 1, order: 1 });
    res.json({ board, cards });
  } catch (err) {
    console.error('Get board error:', err);
    res.status(500).json({ message: 'server error fetching board' });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'board not found' });
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'only the board owner can add members' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) return res.status(404).json({ message: 'no user found with that email' });

    const alreadyMember = board.members.some((m) => m.toString() === userToAdd._id.toString());
    if (alreadyMember) return res.status(409).json({ message: 'user is already a member of this board' });

    board.members.push(userToAdd._id);
    await board.save();
    res.status(200).json({ board });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'server error adding member' });
  }
});

router.post('/:id/cards', async (req, res) => {
  try {
    const board = await loadBoardForMember(req, res);
    if (!board) return;

    const { text, column } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'text is required' });
    const targetColumn = column || 'todo';
    if (!Card.CARD_COLUMNS.includes(targetColumn)) {
      return res.status(400).json({ message: `column must be one of: ${Card.CARD_COLUMNS.join(', ')}` });
    }

    const lastCard = await Card.findOne({ board: board._id, column: targetColumn }).sort({ order: -1 });
    const nextOrder = lastCard ? lastCard.order + 1 : 0;

    const card = await Card.create({ text: text.trim(), board: board._id, column: targetColumn, order: nextOrder, createdBy: req.user.id });
    res.status(201).json({ card });
  } catch (err) {
    console.error('Create card error:', err);
    res.status(500).json({ message: 'server error creating card' });
  }
});

module.exports = router;
module.exports.loadBoardForMember = loadBoardForMember;