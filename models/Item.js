const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['flirting', 'sayari', 'mix']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Item', itemSchema);
