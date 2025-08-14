import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.post("/", async(req, res) => {
   try {
    const {type, amount, title, category, date, tags, description, paymentType, location, receipt} = req.body;

        if (!type || !amount || !title) {return res.status(400).json({message: "Type, amount, and title are required."});
    }

    const newTransaction = new Transaction({
        type,
        amount,
        title,
        category,
        date,
        tags,
        description,
        paymentType,
        location,
        recipt
    });

    const savedTransaction  = await newTransaction.save();
    res.status(200).json(savedTransaction)

   } catch (error) {
    console.log("Error creating the transaction", error)
    res.status(500).json({message: error.message})
   }
});

router.get("/", async(req, res) => {
    try {
        const transaction = await Transaction.find().sort({date:-1});
        res.json(transaction);
        
    } catch (error) {
    console.log("Error in getting transaction", error);
    res.status(500).json({message: error.message});
    }
});

router.get("/filter", async (req, res) => {
    try {
        const { start, end } = req.query;

        const transactions = await Transaction.find({date: {$gte: new Date(start),$lte: new Date(end)}}).sort({ date: -1});
        res.json(transactions);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!deletedTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        res.json({ message: "Transaction deleted successfully" });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



export default router;