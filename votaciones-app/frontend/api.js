const API_URL = window.location.origin;

// ------------------------------------------------------------
// Token
// ------------------------------------------------------------

// Guardar token en localStorage
function setToken(token) {
    localStorage.setItem("token", token);
}

// Obtener token
function getToken() {
    return localStorage.getItem("token");
}

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
async function login(cedula, fecha_nacimiento) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, fecha_nacimiento })
    });

    return await res.json();
}

async function loginDelegado(usuario, pass) {
    const res = await fetch(`${API_URL}/auth/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, pass })
    });

    return await res.json();
}

// ------------------------------------------------------------
// Obtener pregunta actual
// ------------------------------------------------------------
async function obtenerPregunta() {
    const res = await fetch(`${API_URL}/vote/actual`, {
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    return await res.json();
}

// ------------------------------------------------------------
// Enviar voto
// ------------------------------------------------------------
async function enviarVoto(respuesta) {
    const res = await fetch(`${API_URL}/vote/responder`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ respuesta })
    });

    return await res.json();
}

// ------------------------------------------------------------
// DELEGADO: Abrir votación
// ------------------------------------------------------------
async function abrirVotacion() {
    const res = await fetch(`${API_URL}/delegate/abrir`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    });
    return await res.json();
}

// ------------------------------------------------------------
// DELEGADO: Cerrar votación
// ------------------------------------------------------------
async function cerrarVotacion() {
    const res = await fetch(`${API_URL}/delegate/cerrar`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        }
    });
    return await res.json();
}

// ------------------------------------------------------------
// DELEGADO: Activar pregunta (seleccionada por ID)
// ------------------------------------------------------------
async function activarPreguntaBackend(preguntaId) {
    const res = await fetch(`${API_URL}/delegate/pregunta`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${getToken()}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ pregunta_id: preguntaId })
    });
    return await res.json();
}

// ------------------------------------------------------------
// Obtener lista de preguntas de la votación activa
// ------------------------------------------------------------
async function obtenerPreguntas() {
    const res = await fetch(`${API_URL}/questions`);
    return await res.json();
}

async function obtenerEstadoSistema() {
    const res = await fetch(`${API_URL}/vote/actual`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
    });
    return await res.json();
}