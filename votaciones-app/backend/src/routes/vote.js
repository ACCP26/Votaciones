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

router.get("/estadisticas/:preguntaId", async (req, res) => {
    const preguntaId = req.params.preguntaId;

    const [datos] = await db.query(
        "SELECT respuesta, COUNT(*) as total FROM respuestas WHERE pregunta_id = ? GROUP BY respuesta",
        [preguntaId]
    );

    let si = 0, no = 0;
    datos.forEach(v => {
        if (v.respuesta === "si") si = v.total;
        if (v.respuesta === "no") no = v.total;
    });

    return res.json({
        si,
        no,
        total: si + no,
        porcentaje_si: ((si / (si + no)) * 100) || 0,
        porcentaje_no: ((no / (si + no)) * 100) || 0,
    });
});

// Registrar asistencia cuando un usuario hace login
router.post("/registrar-asistencia", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const hoy = new Date().toISOString().split('T')[0]; // Fecha actual YYYY-MM-DD
        
        // Verificar si ya registró asistencia hoy
        const [asistenciaPrevia] = await db.query(
            "SELECT * FROM asistencia WHERE usuario_id = ? AND fecha = ?",
            [userId, hoy]
        );

        if (asistenciaPrevia.length > 0) {
            return res.json({ 
                mensaje: "Asistencia ya registrada hoy",
                asistencia: asistenciaPrevia[0]
            });
        }

        // Registrar nueva asistencia
        const [result] = await db.query(
            "INSERT INTO asistencia (usuario_id, fecha, hora) VALUES (?, ?, CURTIME())",
            [userId, hoy]
        );

        return res.json({ 
            mensaje: "Asistencia registrada correctamente",
            asistencia: { id: result.insertId, usuario_id: userId, fecha: hoy }
        });

    } catch (error) {
        console.error("Error al registrar asistencia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Obtener estadísticas de asistencia (para el delegado)
// Obtener estadísticas de asistencia - VERSIÓN ADAPTATIVA
router.get("/estadisticas-asistencia", auth, async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        
        // 1. Detectar automáticamente las columnas disponibles
        const [columnas] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'usuarios' 
            AND TABLE_SCHEMA = DATABASE()
        `);
        
        const columnasDisponibles = columnas.map(col => col.COLUMN_NAME);
        console.log("📊 Columnas disponibles en usuarios:", columnasDisponibles);

        // 2. Construir SELECT dinámicamente
        let selectColumns = ['u.id'];
        
        // Buscar columna para nombre (probamos varios nombres comunes)
        const posiblesNombres = ['nombre', 'usuario', 'username', 'email', 'correo', 'name'];
        const columnaNombre = posiblesNombres.find(col => columnasDisponibles.includes(col));
        if (columnaNombre) {
            selectColumns.push(`u.${columnaNombre} as nombre`);
        }
        
        // Buscar columna para cédula (probamos varios nombres comunes)
        const posiblesCedulas = ['cedula', 'documento', 'dni', 'identificacion', 'id_number'];
        const columnaCedula = posiblesCedulas.find(col => columnasDisponibles.includes(col));
        if (columnaCedula) {
            selectColumns.push(`u.${columnaCedula} as cedula`);
        }

        const selectSQL = selectColumns.join(', ');
        console.log("🔧 SELECT construido:", selectSQL);

        // 3. Total de usuarios en el sistema
        const [totalUsuarios] = await db.query("SELECT COUNT(*) as total FROM usuarios");
        const total = totalUsuarios[0].total;

        // 4. Usuarios que asistieron hoy
        const [asistieron] = await db.query(
            "SELECT COUNT(DISTINCT usuario_id) as total FROM asistencia WHERE fecha = ?",
            [hoy]
        );
        const asistieronCount = asistieron[0].total;

        // 5. Usuarios que faltaron hoy
        const faltaronCount = total - asistieronCount;

        // 6. Calcular porcentajes
        const porcentajeAsistencia = ((asistieronCount / total) * 100) || 0;
        const porcentajeFaltaron = ((faltaronCount / total) * 100) || 0;

        // 7. Obtener lista de usuarios con asistencia
        const [usuarios] = await db.query(`
            SELECT ${selectSQL},
                   CASE WHEN a.usuario_id IS NOT NULL THEN 'Asistió' ELSE 'Faltó' END as estado
            FROM usuarios u
            LEFT JOIN asistencia a ON u.id = a.usuario_id AND a.fecha = ?
            ORDER BY u.id
        `, [hoy]);

        console.log(`✅ Asistencia: ${asistieronCount}/${total} (${porcentajeAsistencia.toFixed(1)}%)`);
        console.log("👥 Usuarios encontrados:", usuarios);

        return res.json({
            fecha: hoy,
            total_usuarios: total,
            asistieron: asistieronCount,
            faltaron: faltaronCount,
            porcentaje_asistencia: porcentajeAsistencia,
            porcentaje_faltaron: porcentajeFaltaron,
            quorum_alcanzado: porcentajeAsistencia >= 50,
            lista_usuarios: usuarios,
            debug: {
                columnas_encontradas: columnasDisponibles,
                select_usado: selectSQL
            }
        });

    } catch (error) {
        console.error("Error al obtener estadísticas de asistencia:", error);
        return res.status(500).json({ 
            error: "Error interno del servidor",
            detalle: error.message
        });
    }
});


module.exports = router;
