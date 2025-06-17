const { User, Role } = require('../models');
const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) return res.sendStatus(403);
      // Busca roles do usuário autenticado
      const dbUser = await User.findByPk(user.id, { include: Role });
      req.user = {
        ...user,
        roles: dbUser && dbUser.Roles ? dbUser.Roles.map(r => r.name) : []
      };
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

module.exports = { authenticateJWT };
