import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import { sendSuccessNotification } from './services/notify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5500' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const passwordRules = (
  value,
) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

app.post(
  '/api/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full Name is required').isLength({ min: 2 }).withMessage('Full Name must be at least 2 characters'),
    body('companyName').trim().notEmpty().withMessage('Company Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .custom(passwordRules)
      .withMessage('Password must include lowercase, uppercase, number, and special character'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
    body('role').isIn(['Admin', 'Store Manager']).withMessage('Role must be Admin or Store Manager'),
    body('contactNumber')
      .trim()
      .matches(/^[+]?[0-9\-()\s]{7,20}$/)
      .withMessage('Provide a valid contact number'),
    body('warehouseLocation').trim().notEmpty().withMessage('Warehouse Location is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      companyName,
      email,
      role,
      contactNumber,
      warehouseLocation,
    } = req.body;

    // Simulate persistence (replace with real DB save)
    const user = {
      id: Date.now().toString(36),
      fullName,
      companyName,
      email,
      role,
      contactNumber,
      warehouseLocation,
      createdAt: new Date().toISOString(),
    };

    try {
      await sendSuccessNotification({
        toEmail: email,
        toPhone: contactNumber,
        fullName,
        companyName,
        role,
      });
    } catch (e) {
      // Notification failures should not block registration in this demo
      console.error('Notification error:', e);
    }

    res.status(201).json({ message: 'Registration successful', user });
  },
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


