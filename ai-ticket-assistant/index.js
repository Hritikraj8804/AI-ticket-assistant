import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { serve } from "inngest/express";
import userRoutes from "./routes/user.js";
import ticketRoutes from "./routes/ticket.js";
import { inngest } from "./inngest/client.js";
import { onUserSignup } from "./inngest/functions/on-signup.js";
import { onTicketCreated } from "./inngest/functions/on-ticket-create.js";
import { csrfProtection } from "./middlewares/csrf.js";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
// app.use(csrfProtection); // Temporarily disabled for testing

app.get("/", (req, res) => res.json({ message: "AI Ticket Assistant API" }));
app.get("/api", (req, res) => res.json({ message: "AI Ticket Assistant API v1.0" }));

app.use("/api/auth", userRoutes);
app.use("/api/tickets", ticketRoutes);

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreated],
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    app.listen(PORT, () => console.log("🚀 Server at http://localhost:3000"));
  })
  .catch((err) => console.error("❌ MongoDB error: ", encodeURIComponent(err.message)));
