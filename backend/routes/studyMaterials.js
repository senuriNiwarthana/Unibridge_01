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

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeText = (value = '') => value.trim().toLowerCase();

const findDuplicateByTitleAndSubject = (materials = [], title = '', module = '') => {
  const normalizedTitle = normalizeText(title);
  const normalizedModule = normalizeText(module);

  return materials.find((item) => {
    return normalizeText(item.title) === normalizedTitle && normalizeText(item.module) === normalizedModule;
  });
};

router.get('/duplicate-check', requireAuth, (req, res) => {
  const title = String(req.query.title || '').trim();
  const moduleName = String(req.query.module || '').trim();

  if (!title || !moduleName) {
    return res.status(400).json({ message: 'title and module query parameters are required' });
  }

  const db = readDb();
  const duplicate = findDuplicateByTitleAndSubject(db.materials, title, moduleName);

  return res.json({
    duplicate: Boolean(duplicate),
    materialId: duplicate?.id || null,
    status: duplicate?.status || null
  });
});

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  const { title, description, category = 'other', tags = '', externalLink = '' } = req.body;
  const cleanedLink = String(externalLink).trim();
  const selectedModule = String(req.body.module || 'General').trim() || 'General';
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  if (!req.file && !cleanedLink) {
    return res.status(400).json({ message: 'At least one of file or external link is required' });
  }

  if (cleanedLink && !isValidUrl(cleanedLink)) {
    return res.status(400).json({ message: 'External link must be a valid URL' });
  }

  const db = readDb();
  const duplicate = findDuplicateByTitleAndSubject(db.materials, title, selectedModule);
  if (duplicate) {
    return res.status(409).json({ message: 'Duplicate material found for the same title and subject' });
  }

  const submittedAt = new Date().toISOString();
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
    module: selectedModule,
    status: 'approved',
    reviewNotes: '',
    downloads: 0,
    viewed: 0,
    externalLink: cleanedLink || null,
    file: req.file ? {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      typeLabel: formatFileType(req.file.mimetype, req.file.originalname)
    } : null,
    submissionDate: submittedAt,
    createdAt: submittedAt,
    updatedAt: submittedAt
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

  if (!material.file?.path) {
    return res.status(400).json({ message: 'This material has no uploaded file to download' });
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

  if (!material.file?.path) {
    return res.status(400).json({ message: 'This material has no uploaded file to preview' });
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

  if (material.file?.path && fs.existsSync(material.file.path)) {
    fs.unlinkSync(material.file.path);
  }

  db.materials.splice(index, 1);
  writeDb(db);

  return res.json({ message: 'Study material deleted successfully' });
});

module.exports = router;
