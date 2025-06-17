const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { container } = require('tsyringe');

module.exports = {
  async login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Buscar role principal do usuário
    const roles = await user.getRoles();
    const mainRole = roles.length > 0 ? roles[0].name : undefined;
    const token = jwt.sign({ id: user.id, email: user.email, role: mainRole }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  },

  async register(req, res) {
    const { email, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    let createdBy = null;
    // Se autenticado e for admin, registra usuário em nome do admin
    if (req.user && req.user.role === 'Admin') {
      createdBy = req.user.id;
    }
    const user = await User.create({ email, password: hash, createdBy });
    // Atribuir role 'User' ao novo usuário
    let userRole = await Role.findOne({ where: { name: 'User' } });
    if (!userRole) {
      userRole = await Role.create({ name: 'User' });
    }
    await user.addRole(userRole);
    res.status(201).json(user);
  }
};
