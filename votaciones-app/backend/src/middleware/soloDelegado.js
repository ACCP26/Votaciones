module.exports = function(req, res, next) {
    if (!req.user || req.user.rol !== "delegado") {
        return res.status(403).json({ error: "Acceso no autorizado" });
    }
    next();
};
