// Ticket.js (ES Module Syntax)
import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        minlength: 10,
    },
    event: {
       type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100
    },
    rating: {
        type: Number, // float, 0.5–5
        min: 0.5,
        max: 5,
        required: true
    },
    dateReported: {
        type: Date,
        default: Date.now
    },
    images: [{
        type: String 
    }]
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', TicketSchema);

export default Ticket; // ES Module export
