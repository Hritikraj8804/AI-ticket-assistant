import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: { type: String, default: "user", enum: ["user", "moderator", "admin"] },
  skills: [String],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
