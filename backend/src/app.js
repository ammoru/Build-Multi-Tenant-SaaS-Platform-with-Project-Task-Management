const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/error.middleware');

const app = express();

app.use(cors());

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/tenants', require('./routes/tenant.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api', require('./routes/task.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Health check (MANDATORY)
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err){
     res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

app.use(errorHandler);

module.exports = app;
