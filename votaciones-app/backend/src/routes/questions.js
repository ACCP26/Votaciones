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

router.post("/", async (req, res) => {
    console.log("🔍 POST /questions recibido");
    console.log("📝 Body:", req.body);
    
    const { texto } = req.body;

    if (!texto) {
        console.log("❌ Texto vacío");
        return res.status(400).json({ error: "Debe enviar el texto de la pregunta" });
    }

    try {
        console.log("💾 Ejecutando INSERT...");
        
        // SOLO INSERT - sin SELECT después
        const [result] = await db.query(
            "INSERT INTO preguntas (votacion_id, texto) VALUES (1, ?)",
            [texto]
        );

        console.log("✅ INSERT exitoso, ID:", result.insertId);

        // ✅ Respuesta correcta
        return res.json({ 
            mensaje: "Pregunta creada correctamente",
            id: result.insertId 
        });

    } catch (error) {
        console.error("❌ Error en INSERT:", error);
        return res.status(500).json({ error: "Error al crear pregunta: " + error.message });
    }
});


module.exports = router;
