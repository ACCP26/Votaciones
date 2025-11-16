const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET = process.env.JWT_SECRET;

// ---------------- LOGIN VOTANTE ----------------
router.post("/login", async (req, res) => {
    try {
        const { cedula, fecha_nacimiento } = req.body;

        if (!cedula || !fecha_nacimiento) {
            return res.status(400).json({ error: "Faltan datos" });
        }

        // Normalizar formato de fecha
        const fechaFormat = new Date(fecha_nacimiento)
            .toISOString()
            .split("T")[0];

        console.log("Fecha recibida:", fechaFormat);

        const [rows] = await db.query(
            "SELECT * FROM usuarios WHERE cedula = ? AND fecha_nacimiento = ?",
            [cedula, fechaFormat]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: "Datos incorrectos. Cédula o fecha no coinciden."
            });
        }

        const usuario = rows[0];

        const token = jwt.sign(
            { id: usuario.id, cedula: usuario.cedula },
            SECRET,
            { expiresIn: "12h" }
        );

        return res.json({ token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
});

// ---------------- LOGIN DELEGADO ----------------
router.post("/delegate", async (req, res) => {
    console.log("📥 Body recibido:", req.body);
    const { usuario, pass } = req.body;

    if (!usuario || !pass) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const [rows] = await db.query(
        "SELECT * FROM delegados WHERE usuario = ?", 
        [usuario]
    );

    if (rows.length === 0) {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const delegado = rows[0];

    console.log("📤 Delegado DB:", delegado);
    console.log("🔍 Comparando:", pass.trim(), "==", String(delegado.contraseña).trim());

    // Comparación SIN bcrypt, PERO SEGURA
    const ok = pass.trim() === String(delegado.contraseña).trim();

    if (!ok) {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
        { id: delegado.id, rol: "delegado" },
        SECRET,
        { expiresIn: "12h" }
    );

    return res.json({ token });
});


module.exports = router;
