import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import TicketController from './Controller/TicketController.js';

dotenv.config();
const app = express();

// ✅ CORS fix for Netlify frontend
const corsOptions = {
    origin: ['http://localhost:3000', 'https://5a-cake-decoration.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
    credentials: true // allow cookies/credentials if needed
};
app.use(cors(corsOptions));

// ✅ Allow handling large JSON and form data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Routes
app.use("/TicketController", TicketController);

// ✅ Serve static uploads (if needed)
app.use('/uploads', express.static('uploads'));

// ✅ Root status check
app.get("/", (req, res) => {
    res.send({ active: true, message: "Server is running", error: false });
});

// ✅ MongoDB connection
mongoose.connect(process.env.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
