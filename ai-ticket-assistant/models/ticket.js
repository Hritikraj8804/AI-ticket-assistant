import mongoose from 'mongoose';
import { assign } from 'nodemailer/lib/shared';

const ticketSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: "TODO" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' ,
        default: null
    },
    priority: String,
    deadline: Date,
    helpfulNotes: ServerTiming,
    relatedSkills: [String],
    createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Ticket", userSchema);