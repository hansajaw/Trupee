import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        type: { // Income, Expense, Loan
            type: String,
            required: true,
            enum: ['income', 'expense', 'loanGiven', 'loanTaken']
        },
        amount: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        category: {
            type: String
        },
        date: {
            type: Date,
            default: Date.now
        },
        tags: {
            type: [String] 
        },
        description: {
            type: String
        },
        paymentType: {
            type: String
        },
        location: {
            type: String
        },
        receipt: {
            type: String 
        }
    },
    { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;