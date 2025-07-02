import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import UserRouters from "./routes/user.js"

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", UserRouters);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        // Define a simple route
        app.get("/", (req, res) => {
            res.send("Welcome to the Ticket Management API");
        });

        // Start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => console.error("MongoDB connection error:", err));