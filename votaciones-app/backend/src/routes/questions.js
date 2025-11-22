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

router.post("/", auth, async (req, res) => {  // 👈 Agregar auth aquí
    const { texto } = req.body;

    if (!texto) {
        return res.status(400).json({ error: "Debe enviar el texto de la pregunta" });
    }

    try {
        await db.query(
            "INSERT INTO preguntas (votacion_id, texto) VALUES (1, ?)",
            [texto]
        );

        return res.json({ mensaje: "Pregunta creada correctamente" });
        
    } catch (error) {
        console.error("Error al crear pregunta:", error);
        return res.status(500).json({ error: "Error al crear pregunta" });
    }
});

module.exports = router;
