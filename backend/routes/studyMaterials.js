const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');

const { readDb, writeDb } = require('../utils/dataStore');
const { upload } = require('../middleware/upload');
const { requireAuth, attachUser } = require('../middleware/auth');
const { canEditMaterial } = require('../utils/permissions');
const { formatFileType } = require('../utils/formatters');

const router = express.Router();

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const { title, description, category = 'other', tags = '' } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  const db = readDb();
  const material = {
    id: uuidv4(),
    title,
    description,
    category,
    tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
    ownerId: req.user.id,
    ownerName: `${req.user.firstName} ${req.user.lastName}`.trim(),
    year: Number(req.body.year || 1),
    semester: Number(req.body.semester || 1),
    module: req.body.module || 'General',
    status: 'approved',
    reviewNotes: '',
    downloads: 0,
    viewed: 0,
    file: {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      typeLabel: formatFileType(req.file.mimetype, req.file.originalname)
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.materials.unshift(material);
  writeDb(db);

  return res.status(201).json({ message: 'Study material uploaded successfully', material });
});

router.get('/:id/download', attachUser, (req, res) => {
  const db = readDb();
  const material = db.materials.find((item) => item.id === req.params.id);

  if (!material) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  if (!fs.existsSync(material.file.path)) {
    return res.status(404).json({ message: 'File not found in storage' });
  }

  material.downloads += 1;
  material.updatedAt = new Date().toISOString();
  writeDb(db);

  return res.download(material.file.path, material.file.originalName);
});

router.get('/:id/preview', requireAuth, (req, res) => {
  const db = readDb();
  const material = db.materials.find((item) => item.id === req.params.id);

  if (!material) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  if (!fs.existsSync(material.file.path)) {
    return res.status(404).json({ message: 'File not found in storage' });
  }

  const contentType = mime.lookup(material.file.originalName) || material.file.mimetype || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename=\"${path.basename(material.file.originalName)}\"`);
  fs.createReadStream(material.file.path).pipe(res);
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = readDb();
  const index = db.materials.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  const material = db.materials[index];
  if (!canEditMaterial(req.user, material)) {
    return res.status(403).json({ message: 'Not authorized to delete this material' });
  }

  if (fs.existsSync(material.file.path)) {
    fs.unlinkSync(material.file.path);
  }

  db.materials.splice(index, 1);
  writeDb(db);

  return res.json({ message: 'Study material deleted successfully' });
});

module.exports = router;
