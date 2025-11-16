const express = require("express");
const router = express.Router();
const db = require("../db");

const auth = require("../middleware/authMiddleware");
const soloDelegado = require("../middleware/soloDelegado");

// Abrir votación
router.post("/abrir", auth, soloDelegado, async (req, res) => {
    await db.query("UPDATE votaciones SET estado='abierta' WHERE id=1");
    return res.json({ mensaje: "Votación abierta" });
});

// Cerrar votación
router.post("/cerrar", auth, soloDelegado, async (req, res) => {
    await db.query("UPDATE votaciones SET estado='cerrada', pregunta_actual = NULL WHERE id=1");
    return res.json({ mensaje: "Votación cerrada correctamente" });
});


// Cambiar pregunta activa (seleccionar una que ya existe)
router.post("/pregunta", auth, soloDelegado, async (req, res) => {
    const { pregunta_id } = req.body;

    if (!pregunta_id)
        return res.status(400).json({ error: "Debe enviar pregunta_id" });

    // Validar que la pregunta exista
    const [pregunta] = await db.query("SELECT * FROM preguntas WHERE id = ?", [pregunta_id]);

    if (pregunta.length === 0)
        return res.status(404).json({ error: "La pregunta no existe" });

    // Actualizar votación activa
    await db.query(
        "UPDATE votaciones SET pregunta_actual = ? WHERE estado='abierta'",
        [pregunta_id]
    );

    return res.json({ mensaje: "Pregunta activada", id: pregunta_id });
});

module.exports = router;
