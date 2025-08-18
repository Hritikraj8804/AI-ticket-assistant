import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  status: { 
    type: String, 
    default: "TODO",
    enum: ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);
