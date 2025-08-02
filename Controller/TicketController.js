import express from "express";
import cors from "cors";
import Ticket from "../Model/Ticket.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
router.use(cors());

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { files: 10 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    }
});

// Helper function to validate required fields
const validateTicketFields = (ticketData) => {
    const { name, description, event, rating } = ticketData;
    if (!name || !description || !event || !rating) {
        return false;
    }
    return true;
};

// Add a new ticket
router.post("/Ticket", upload.array("images", 10), async (req, res) => {
    const { name, description, event, rating } = req.body;
    // Validate request body
    if (!name || !description || !event || !rating) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const images = req.files ? req.files.map(file => file.filename) : [];
        const newTicket = new Ticket({
            name,
            description,
            event,
            rating: parseFloat(rating),
            images
            // dateReported will default to Date.now
        });
        await newTicket.save();
        res.status(201).json({ message: "Your Ticket Added Successfully!" });
    } catch (err) {
        console.error("Error adding ticket:", err);
        res.status(500).json({ message: "Error adding ticket", error: err.message });
    }
});

// Get all tickets
router.get("/getTicket", async (req, res) => {
    try {
        const tickets = await Ticket.find({});
        res.json(tickets);
    } catch (err) {
        console.error("Error fetching tickets:", err);
        res.status(500).json({ message: "Error fetching tickets", error: err.message });
    }
});

// Get a specific ticket by ID
router.get("/getTicket/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: "Error fetching ticket", error: err.message });
    }
});

// Delete a ticket
router.delete("/deleteTicket/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const deletedTicket = await Ticket.findByIdAndDelete(id);
        if (!deletedTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        res.json({ message: "Ticket deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting ticket", error: err.message });
    }
});

// Update a ticket
router.put("/update/:id", async (req, res) => {
    const id = req.params.id;
    const { name, description, event, rating, dateReported } = req.body;

    // Validate request body
    if (!validateTicketFields(req.body)) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const updatedTicket = await Ticket.findByIdAndUpdate(
            id,
            { name, description, event, rating: parseFloat(rating), dateReported },
            { new: true }
        );
        if (!updatedTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(updatedTicket);
    } catch (err) {
        res.status(500).json({ message: "Error updating ticket", error: err.message });
    }
});

export default router;
// ...existing code...