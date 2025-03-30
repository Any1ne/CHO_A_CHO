import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// З
app.get("/api/products", (req, res) => {
  res.json([
    { id: 1, name: "Dark Chocolate", price: 5.99 },
    { id: 2, name: "Milk Chocolate", price: 4.99 },
    { id: 3, name: "Sugar free Chocolate", price: 2.99 },
    { id: 4, name: "Milk", price: 1.49 },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
