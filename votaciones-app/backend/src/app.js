require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");


const authRoutes = require("./routes/auth");
const voteRoutes = require("./routes/vote");
const delegateRoutes = require("./routes/delegate");
const questionsRoutes = require("./routes/questions");


const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../../frontend")));

// Rutas
app.use("/auth", authRoutes);
app.use("/vote", voteRoutes);
app.use("/delegate", delegateRoutes);
app.use("/questions", questionsRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor backend iniciado en http://localhost:${PORT}`);
});
