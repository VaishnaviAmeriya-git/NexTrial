const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin']));

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'coordinator', 'investigator', 'iec_member', 'pv_officer', 'dsmb']),
  assignedTrials: z.array(z.string()).optional(),
});

// GET /users (paginated)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-passwordHash')
        .populate('assignedTrials', 'title shortCode status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /users
router.post('/', async (req, res, next) => {
  try {
    const parse = userCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid user payload', details: parse.error.issues },
      });
    }

    const { name, email, password, role, assignedTrials } = parse.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_KEY', message: 'A user with this email already exists' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      assignedTrials: assignedTrials || [],
      mustChangePassword: true,
    });

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'User',
      entityId: user._id,
      action: 'CREATE',
      before: null,
      after: { name, email, role, assignedTrials },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedTrials: user.assignedTrials,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const before = {
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      assignedTrials: user.assignedTrials,
    };

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
    if (req.body.assignedTrials) user.assignedTrials = req.body.assignedTrials;
    if (req.body.password && req.body.password.length >= 8) {
      user.passwordHash = await bcrypt.hash(req.body.password, 12);
    }

    await user.save();

    await recordAudit({
      who: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      entity: 'User',
      entityId: user._id,
      action: 'UPDATE',
      before,
      after: {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        assignedTrials: user.assignedTrials,
      },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        assignedTrials: user.assignedTrials,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
