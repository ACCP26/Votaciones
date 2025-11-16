const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const db = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;


// Obtener pregunta actual de la BD
router.get("/actual", auth, async (req, res) => {
    const [rows] = await db.query("SELECT * FROM votaciones WHERE id=1");

    const votacion = rows[0];

    if (!votacion || votacion.estado !== "abierta") {
        return res.json({
            activa: false,
            pregunta: null
        });
    }

    const [preg] = await db.query(
        "SELECT id, texto FROM preguntas WHERE id = ?",
        [votacion.pregunta_actual]
    );

    return res.json({
        activa: true,
        pregunta: preg[0]
    });
});

// Enviar voto
router.post("/responder", auth, async (req, res) => {
    const { respuesta } = req.body;
    const userId = req.user.id;

    // 1. Verificar si la votación está abierta
    const [rows] = await db.query("SELECT * FROM votaciones WHERE id=1");
    const votacion = rows[0];

    if (!votacion || votacion.estado !== "abierta") {
        return res.status(403).json({ error: "La votación está cerrada." });
    }

    if (!votacion.pregunta_actual) {
        return res.status(403).json({ error: "No hay pregunta activa." });
    }

    const preguntaId = votacion.pregunta_actual;

    // 2. Verificar si ya votó esta pregunta
    const [votoPrevio] = await db.query(
        "SELECT * FROM respuestas WHERE usuario_id = ? AND pregunta_id = ?",
        [userId, preguntaId]
    );

    if (votoPrevio.length > 0) {
        return res.status(400).json({ error: "Ya has votado esta pregunta." });
    }

    // 3. Registrar voto
    await db.query(
        "INSERT INTO respuestas(usuario_id, pregunta_id, respuesta) VALUES (?, ?, ?)",
        [userId, preguntaId, respuesta]
    );

    return res.json({ mensaje: "Voto registrado correctamente" });
});

module.exports = router;
