const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { readDb, writeDb } = require('../utils/dataStore');
const { attachUser, requireAuth, requireManagerRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', attachUser, (req, res) => {
  const { page = 1, year, semester } = req.query;
  const pageSize = 10;
  const db = readDb();

  let modules = db.modules;

  if (year) {
    modules = modules.filter((item) => Number(item.year) === Number(year));
  }
  if (semester) {
    modules = modules.filter((item) => Number(item.semester) === Number(semester));
  }

  const pageNumber = Number(page);
  const totalItems = modules.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (pageNumber - 1) * pageSize;

  const paged = modules.slice(start, start + pageSize);

  res.json({
    modules: paged,
    totalItems,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      hasPrev: pageNumber > 1,
      hasNext: pageNumber < totalPages
    }
  });
});

router.post('/', requireAuth, requireManagerRole, (req, res) => {
  const { name, year, semester } = req.body;
  if (!name || !year || !semester) {
    return res.status(400).json({ message: 'Module name, year, and semester are required' });
  }

  const db = readDb();
  const payload = {
    id: uuidv4(),
    name,
    year: Number(year),
    semester: Number(semester),
    createdBy: {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role
    },
    createdAt: new Date().toISOString()
  };

  db.modules.unshift(payload);
  writeDb(db);

  res.status(201).json({ message: 'Module created successfully', module: payload });
});

router.put('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const moduleItem = db.modules.find((item) => item.id === req.params.id);

  if (!moduleItem) {
    return res.status(404).json({ message: 'Module not found' });
  }

  if (!req.body.name || !req.body.year || !req.body.semester) {
    return res.status(400).json({ message: 'Module name, year, and semester are required' });
  }

  moduleItem.name = req.body.name;
  moduleItem.year = Number(req.body.year);
  moduleItem.semester = Number(req.body.semester);

  writeDb(db);
  res.json({ message: 'Module updated successfully', module: moduleItem });
});

router.delete('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const index = db.modules.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Module not found' });
  }

  db.modules.splice(index, 1);
  writeDb(db);
  res.json({ message: 'Module deleted successfully' });
});

module.exports = router;
