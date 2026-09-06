const express = require('express');
const Card = require('../models/Card');
const Board = require('../models/Board');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function loadCardForMember(req, res) {
  const card = await Card.findById(req.params.id);
  if (!card) {
    res.status(404).json({ message: 'card not found' });
    return null;
  }
  const board = await Board.findById(card.board);
  const isMember = board && board.members.some((m) => m.toString() === req.user.id);
  if (!isMember) {
    res.status(403).json({ message: 'you are not a member of this board' });
    return null;
  }
  return card;
}

router.patch('/:id', async (req, res) => {
  try {
    const card = await loadCardForMember(req, res);
    if (!card) return;

    const { text, column, order } = req.body;
    if (text !== undefined) {
      if (!text.trim()) return res.status(400).json({ message: 'text cannot be empty' });
      card.text = text.trim();
    }
    if (column !== undefined) {
      if (!Card.CARD_COLUMNS.includes(column)) {
        return res.status(400).json({ message: `column must be one of: ${Card.CARD_COLUMNS.join(', ')}` });
      }
      card.column = column;
    }
    if (order !== undefined) card.order = order;

    await card.save();
    res.json({ card });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ message: 'server error updating card' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const card = await loadCardForMember(req, res);
    if (!card) return;
    await card.deleteOne();
    res.json({ message: 'card deleted', cardId: card._id });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ message: 'server error deleting card' });
  }
});

module.exports = router;