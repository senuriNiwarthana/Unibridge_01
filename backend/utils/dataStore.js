const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataFile = path.join(__dirname, '..', 'data', 'db.json');

const initialData = {
  modules: [
    {
      id: uuidv4(),
      name: 'Software Engineering Fundamentals',
      year: 1,
      semester: 1,
      createdBy: { id: 'u-admin', firstName: 'System', lastName: 'Admin', role: 'admin' },
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: 'Database Systems',
      year: 2,
      semester: 1,
      createdBy: { id: 'u-coordinator', firstName: 'Course', lastName: 'Coordinator', role: 'coordinator' },
      createdAt: new Date().toISOString()
    }
  ],
  materials: [],
  kuppiSessions: []
};

const ensureDataStore = () => {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

const readDb = () => {
  ensureDataStore();
  const raw = fs.readFileSync(dataFile, 'utf-8');
  const parsed = JSON.parse(raw);

  let isUpdated = false;
  if (!Array.isArray(parsed.modules)) {
    parsed.modules = [];
    isUpdated = true;
  }
  if (!Array.isArray(parsed.materials)) {
    parsed.materials = [];
    isUpdated = true;
  }
  if (!Array.isArray(parsed.kuppiSessions)) {
    parsed.kuppiSessions = [];
    isUpdated = true;
  }

  if (isUpdated) {
    writeDb(parsed);
  }

  return parsed;
};

const writeDb = (db) => {
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2), 'utf-8');
};

module.exports = {
  ensureDataStore,
  readDb,
  writeDb
};
