// routes/category.js
import express from "express";

const router = express.Router();

// Sample static category list
router.get("/", (req, res) => {
  res.json([
    { name: "Food", icon: "restaurant" },
    { name: "Transport", icon: "bus" },
    { name: "Shopping", icon: "cart" },
    { name: "Health", icon: "medkit" },
    { name: "Entertainment", icon: "game-controller" },
    { name: "Loan", icon: "card" }
  ]);
});

export default router;
