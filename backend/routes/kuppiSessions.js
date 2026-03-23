const express = require('express');
const { v4: uuidv4 } = require('uuid');

const { readDb, writeDb } = require('../utils/dataStore');
const { requireAuth, requireManagerRole, attachUser } = require('../middleware/auth');

const router = express.Router();

const SESSION_TYPES = ['physical', 'online'];
const ONLINE_PLATFORMS = ['zoom', 'google-meet', 'cloud', 'other'];

const normalizeSessionType = (value) => String(value || '').trim().toLowerCase();
const normalizePlatform = (value) => String(value || '').trim().toLowerCase();

const asSessionStartDate = (date, time) => {
  if (!date || !time) return null;
  const timestamp = new Date(`${date}T${time}:00`);
  if (Number.isNaN(timestamp.getTime())) return null;
  return timestamp;
};

const getSessionStatus = (session, now = new Date()) => {
  const start = asSessionStartDate(session.date, session.time);
  if (!start) return 'upcoming';

  const durationMinutes = Number(session.durationMinutes) > 0 ? Number(session.durationMinutes) : 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'completed';
};

const isPastStartTime = (date, time) => {
  const start = asSessionStartDate(date, time);
  if (!start) return false;

  const now = new Date();
  now.setSeconds(0, 0);
  return start < now;
};

const validateSessionPayload = (payload) => {
  const {
    title,
    sessionType,
    meetingPlatform,
    meetingLink,
    moduleName,
    description,
    date,
    time,
    sessionHost,
    durationMinutes
  } = payload;

  const errors = {};

  if (!String(title || '').trim()) errors.title = 'Session title is required';

  const normalizedSessionType = normalizeSessionType(sessionType);
  if (!SESSION_TYPES.includes(normalizedSessionType)) {
    errors.sessionType = 'Please select a valid session type';
  }

  if (!String(moduleName || '').trim()) errors.moduleName = 'Module name is required';
  if (!String(description || '').trim()) errors.description = 'Session description is required';
  if (!String(date || '').trim()) errors.date = 'Date is required';
  if (!String(time || '').trim()) errors.time = 'Time is required';
  if (!String(sessionHost || '').trim()) errors.sessionHost = 'Session host is required';

  const startDate = asSessionStartDate(date, time);
  if (!startDate) {
    errors.dateTime = 'Date and time must be valid';
  } else if (isPastStartTime(date, time)) {
    errors.date = 'Session date/time cannot be in the past';
  }

  const normalizedPlatform = normalizePlatform(meetingPlatform);
  if (normalizedSessionType === 'online') {
    if (!ONLINE_PLATFORMS.includes(normalizedPlatform)) {
      errors.meetingPlatform = 'Meeting platform is required for online sessions';
    }
    if (!String(meetingLink || '').trim()) {
      errors.meetingLink = 'Meeting link is required for online sessions';
    }
  }

  if (durationMinutes && Number(durationMinutes) <= 0) {
    errors.durationMinutes = 'Duration must be greater than zero';
  }

  return {
    errors,
    normalizedSessionType,
    normalizedPlatform
  };
};

router.get('/', requireAuth, attachUser, (req, res) => {
  const { page = 1, limit = 10, status, moduleName, search } = req.query;
  const db = readDb();

  let sessions = [...db.kuppiSessions];
  const now = new Date();

  sessions = sessions.map((session) => ({
    ...session,
    status: getSessionStatus(session, now)
  }));

  if (status) {
    const normalizedStatus = String(status).trim().toLowerCase();
    sessions = sessions.filter((session) => session.status === normalizedStatus);
  }

  if (moduleName) {
    const moduleQuery = String(moduleName).trim().toLowerCase();
    sessions = sessions.filter((session) => String(session.moduleName || '').toLowerCase().includes(moduleQuery));
  }

  if (search) {
    const searchQuery = String(search).trim().toLowerCase();
    sessions = sessions.filter((session) => {
      const title = String(session.title || '').toLowerCase();
      const description = String(session.description || '').toLowerCase();
      return title.includes(searchQuery) || description.includes(searchQuery);
    });
  }

  sessions.sort((a, b) => new Date(`${a.date}T${a.time}:00`) - new Date(`${b.date}T${b.time}:00`));

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 10);
  const totalItems = sessions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (pageNumber - 1) * pageSize;

  res.json({
    sessions: sessions.slice(start, start + pageSize),
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
  const {
    title,
    sessionType,
    meetingPlatform,
    meetingLink,
    moduleName,
    description,
    date,
    time,
    sessionHost,
    additionalDetails,
    durationMinutes
  } = req.body;

  const { errors, normalizedSessionType, normalizedPlatform } = validateSessionPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  const db = readDb();
  const session = {
    id: uuidv4(),
    title: String(title).trim(),
    sessionType: normalizedSessionType,
    meetingPlatform: normalizedSessionType === 'online' ? normalizedPlatform : null,
    meetingLink: normalizedSessionType === 'online' ? String(meetingLink).trim() : null,
    moduleName: String(moduleName).trim(),
    description: String(description).trim(),
    date: String(date).trim(),
    time: String(time).trim(),
    sessionHost: String(sessionHost).trim(),
    durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
    additionalDetails: String(additionalDetails || '').trim(),
    createdBy: {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role
    },
    createdAt: new Date().toISOString()
  };

  db.kuppiSessions.push(session);
  writeDb(db);

  res.status(201).json({
    message: 'Kuppi session created successfully',
    session: {
      ...session,
      status: getSessionStatus(session)
    }
  });
});

router.put('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const session = db.kuppiSessions.find((item) => item.id === req.params.id);

  if (!session) {
    return res.status(404).json({ message: 'Kuppi session not found' });
  }

  if (getSessionStatus(session) !== 'upcoming') {
    return res.status(400).json({ message: 'Only upcoming sessions can be edited' });
  }

  const { errors, normalizedSessionType, normalizedPlatform } = validateSessionPayload(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  session.title = String(req.body.title).trim();
  session.sessionType = normalizedSessionType;
  session.meetingPlatform = normalizedSessionType === 'online' ? normalizedPlatform : null;
  session.meetingLink = normalizedSessionType === 'online' ? String(req.body.meetingLink).trim() : null;
  session.moduleName = String(req.body.moduleName).trim();
  session.description = String(req.body.description).trim();
  session.date = String(req.body.date).trim();
  session.time = String(req.body.time).trim();
  session.sessionHost = String(req.body.sessionHost).trim();
  session.durationMinutes = Number(req.body.durationMinutes) > 0 ? Number(req.body.durationMinutes) : 60;
  session.additionalDetails = String(req.body.additionalDetails || '').trim();
  session.updatedAt = new Date().toISOString();

  writeDb(db);

  return res.json({
    message: 'Kuppi session updated successfully',
    session: {
      ...session,
      status: getSessionStatus(session)
    }
  });
});

router.delete('/:id', requireAuth, requireManagerRole, (req, res) => {
  const db = readDb();
  const index = db.kuppiSessions.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Kuppi session not found' });
  }

  if (getSessionStatus(db.kuppiSessions[index]) !== 'upcoming') {
    return res.status(400).json({ message: 'Only upcoming sessions can be deleted' });
  }

  db.kuppiSessions.splice(index, 1);
  writeDb(db);
  return res.json({ message: 'Kuppi session deleted successfully' });
});

module.exports = router;
