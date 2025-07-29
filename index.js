import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import TicketController from './Controller/TicketController.js'

dotenv.config();
const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token'],
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/TicketController", TicketController);

app.use('/uploads', express.static('uploads'));

mongoose.connect(process.env.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("MongoDB connection error:", err));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



