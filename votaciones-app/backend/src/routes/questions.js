const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener TODAS las preguntas registradas
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, texto FROM preguntas ORDER BY id ASC"
        );

        res.json({ preguntas: rows });  
        // 👆 Esto sí devuelve exactamente lo que el frontend espera

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener preguntas" });
    }
});

module.exports = router;
