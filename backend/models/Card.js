const mongoose = require('mongoose');

const CARD_COLUMNS = ['todo', 'doing', 'done'];

const cardSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    column: { type: String, enum: CARD_COLUMNS, default: 'todo', required: true },
    order: { type: Number, required: true, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
module.exports.CARD_COLUMNS = CARD_COLUMNS;