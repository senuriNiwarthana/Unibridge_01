const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { readDb, writeDb } = require('../utils/dataStore');
const { upload } = require('../middleware/upload');
const { attachUser, requireAuth, requireManagerRole } = require('../middleware/auth');
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

const hasDuplicateTitleAndSubject = (materials = [], title = '', module = '') => {
  const normalizedTitle = normalizeText(title);
  const normalizedModule = normalizeText(module);

  return materials.some((item) => {
    return normalizeText(item.title) === normalizedTitle && normalizeText(item.module) === normalizedModule;
  });
};

router.get('/approved', attachUser, (req, res) => {
  const { page = 1, limit = 10, category = '', search = '' } = req.query;
  const db = readDb();

  let materials = db.materials.filter((item) => item.status === 'approved');

  if (category && category.toLowerCase() !== 'all') {
    materials = materials.filter((item) => item.category === category);
  }

  if (search) {
    const keyword = search.toLowerCase();
    materials = materials.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword)
        || item.description.toLowerCase().includes(keyword)
        || item.module.toLowerCase().includes(keyword)
      );
    });
  }

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const totalItems = materials.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (pageNumber - 1) * pageSize;

  const paged = materials.slice(start, start + pageSize);

  res.json({
    materials: paged,
    totalItems,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      hasPrev: pageNumber > 1,
      hasNext: pageNumber < totalPages
    }
  });
});

router.post('/submit', requireAuth, upload.single('file'), (req, res) => {
  const { title, description, category = 'other', tags = '', year, semester, module, externalLink = '' } = req.body;
  const cleanedLink = String(externalLink).trim();

  if (!title || !description || !year || !semester || !module) {
    return res.status(400).json({ message: 'Missing required submission fields' });
  }

  if (!req.file && !cleanedLink) {
    return res.status(400).json({ message: 'At least one of file or external link is required' });
  }

  if (cleanedLink && !isValidUrl(cleanedLink)) {
    return res.status(400).json({ message: 'External link must be a valid URL' });
  }

  const db = readDb();
  if (hasDuplicateTitleAndSubject(db.materials, title, module)) {
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
    year: Number(year),
    semester: Number(semester),
    module,
    status: 'pendingReview',
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

  res.status(201).json({ message: 'Study material submitted for review', material });
});

router.get('/stats', requireAuth, requireManagerRole, (_req, res) => {
  const db = readDb();
  const stats = {
    pendingReview: db.materials.filter((item) => item.status === 'pendingReview').length,
    approved: db.materials.filter((item) => item.status === 'approved').length,
    rejected: db.materials.filter((item) => item.status === 'rejected').length,
    totalStudyMaterials: db.materials.length
  };

  res.json(stats);
});

router.get('/pending', requireAuth, requireManagerRole, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const db = readDb();
  const pending = db.materials.filter((item) => item.status === 'pendingReview');

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const totalItems = pending.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (pageNumber - 1) * pageSize;

  const paged = pending.slice(start, start + pageSize);

  res.json({
    materials: paged,
    totalItems,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      hasPrev: pageNumber > 1,
      hasNext: pageNumber < totalPages
    }
  });
});

router.get('/completed', requireAuth, requireManagerRole, (req, res) => {
  const { search = '' } = req.query;
  const db = readDb();
  const keyword = search.toLowerCase();

  const filtered = db.materials.filter((item) => {
    if (item.status === 'pendingReview') return false;
    if (!search) return true;

    return (
      item.title.toLowerCase().includes(keyword)
      || item.module.toLowerCase().includes(keyword)
      || item.description.toLowerCase().includes(keyword)
    );
  });

  const grouped = filtered.reduce((acc, material) => {
    const key = `Y${material.year}-S${material.semester}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(material);
    return acc;
  }, {});

  res.json({ grouped });
});

router.get('/module/:name', attachUser, (req, res) => {
  const { year, semester } = req.query;
  const moduleName = req.params.name;
  const db = readDb();

  const items = db.materials.filter((item) => {
    if (item.module !== moduleName) return false;
    if (year && Number(year) !== Number(item.year)) return false;
    if (semester && Number(semester) !== Number(item.semester)) return false;
    return item.status === 'approved';
  });

  res.json({ materials: items });
});

router.put('/:id/approve', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const material = db.materials.find((item) => item.id === req.params.id);

  if (!material) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  material.status = 'approved';
  material.reviewNotes = req.body.reviewNotes || '';
  material.category = req.body.category || material.category;
  material.updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ message: 'Study material approved', material });
});

router.put('/:id/reject', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const material = db.materials.find((item) => item.id === req.params.id);

  if (!material) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  if (!req.body.reviewNotes?.trim()) {
    return res.status(400).json({ message: 'Review notes are required when rejecting' });
  }

  material.status = 'rejected';
  material.reviewNotes = req.body.reviewNotes;
  material.category = req.body.category || material.category;
  material.updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ message: 'Study material rejected', material });
});

router.put('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const material = db.materials.find((item) => item.id === req.params.id);

  if (!material) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  const { title, description, category, tags } = req.body;
  material.title = title ?? material.title;
  material.description = description ?? material.description;
  material.category = category ?? material.category;
  material.tags = Array.isArray(tags)
    ? tags
    : (typeof tags === 'string' ? tags.split(',').map((item) => item.trim()).filter(Boolean) : material.tags);
  material.updatedAt = new Date().toISOString();

  writeDb(db);
  res.json({ message: 'Study material updated', material });
});

router.delete('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const index = db.materials.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Study material not found' });
  }

  db.materials.splice(index, 1);
  writeDb(db);

  res.json({ message: 'Study material removed' });
});

module.exports = router;
