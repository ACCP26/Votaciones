const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "Token requerido" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Token inválido o expirado" });
    }
}

module.exports = auth;
