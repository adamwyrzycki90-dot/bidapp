const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../models/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile with all details
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getOne(
      `SELECT id, email, full_name, address, phone_number, linkedin_profile, github_link, experience_years, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    const employmentHistory = await getAll(
      'SELECT * FROM employment_history WHERE user_id = ? ORDER BY start_date DESC',
      [req.user.id]
    );

    const education = await getAll(
      'SELECT * FROM education WHERE user_id = ? ORDER BY graduation_date DESC',
      [req.user.id]
    );

    const certifications = await getAll(
      'SELECT * FROM certifications WHERE user_id = ? ORDER BY date_obtained DESC',
      [req.user.id]
    );

    const skills = await getAll(
      'SELECT * FROM skills WHERE user_id = ?',
      [req.user.id]
    );

    const additionalInfo = await getAll(
      'SELECT * FROM additional_info WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      user,
      employmentHistory,
      education,
      certifications,
      skills,
      additionalInfo
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user basic info
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      full_name,
      address,
      phone_number,
      linkedin_profile,
      github_link,
      experience_years
    } = req.body;

    await runQuery(
      `UPDATE users SET 
        full_name = COALESCE(?, full_name),
        address = COALESCE(?, address),
        phone_number = COALESCE(?, phone_number),
        linkedin_profile = COALESCE(?, linkedin_profile),
        github_link = COALESCE(?, github_link),
        experience_years = COALESCE(?, experience_years),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [full_name, address, phone_number, linkedin_profile, github_link, experience_years, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Employment History CRUD
router.post('/employment', authMiddleware, async (req, res) => {
  try {
    const { position, company, location, start_date, end_date, description } = req.body;
    
    if (!position || !company) {
      return res.status(400).json({ error: 'Position and company are required' });
    }

    const result = await runQuery(
      `INSERT INTO employment_history (user_id, position, company, location, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, position, company, location || '', start_date || '', end_date || '', description || '']
    );

    const employment = await getOne('SELECT * FROM employment_history WHERE id = ?', [result.lastID]);
    res.status(201).json({ employment });
  } catch (error) {
    console.error('Employment add error:', error);
    res.status(500).json({ error: 'Failed to add employment' });
  }
});

router.put('/employment/:id', authMiddleware, async (req, res) => {
  try {
    const { position, company, location, start_date, end_date, description } = req.body;
    
    await runQuery(
      `UPDATE employment_history SET 
        position = COALESCE(?, position),
        company = COALESCE(?, company),
        location = COALESCE(?, location),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        description = COALESCE(?, description)
       WHERE id = ? AND user_id = ?`,
      [position, company, location, start_date, end_date, description, req.params.id, req.user.id]
    );

    res.json({ message: 'Employment updated successfully' });
  } catch (error) {
    console.error('Employment update error:', error);
    res.status(500).json({ error: 'Failed to update employment' });
  }
});

router.delete('/employment/:id', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM employment_history WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Employment deleted successfully' });
  } catch (error) {
    console.error('Employment delete error:', error);
    res.status(500).json({ error: 'Failed to delete employment' });
  }
});

// Education CRUD
router.post('/education', authMiddleware, async (req, res) => {
  try {
    const { degree, institution, location, graduation_date, gpa } = req.body;
    
    if (!degree || !institution) {
      return res.status(400).json({ error: 'Degree and institution are required' });
    }

    const result = await runQuery(
      `INSERT INTO education (user_id, degree, institution, location, graduation_date, gpa)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, degree, institution, location || '', graduation_date || '', gpa || '']
    );

    const edu = await getOne('SELECT * FROM education WHERE id = ?', [result.lastID]);
    res.status(201).json({ education: edu });
  } catch (error) {
    console.error('Education add error:', error);
    res.status(500).json({ error: 'Failed to add education' });
  }
});

router.put('/education/:id', authMiddleware, async (req, res) => {
  try {
    const { degree, institution, location, graduation_date, gpa } = req.body;
    
    await runQuery(
      `UPDATE education SET 
        degree = COALESCE(?, degree),
        institution = COALESCE(?, institution),
        location = COALESCE(?, location),
        graduation_date = COALESCE(?, graduation_date),
        gpa = COALESCE(?, gpa)
       WHERE id = ? AND user_id = ?`,
      [degree, institution, location, graduation_date, gpa, req.params.id, req.user.id]
    );

    res.json({ message: 'Education updated successfully' });
  } catch (error) {
    console.error('Education update error:', error);
    res.status(500).json({ error: 'Failed to update education' });
  }
});

router.delete('/education/:id', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM education WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Education delete error:', error);
    res.status(500).json({ error: 'Failed to delete education' });
  }
});

// Certifications CRUD
router.post('/certifications', authMiddleware, async (req, res) => {
  try {
    const { name, issuer, date_obtained, expiry_date, credential_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Certification name is required' });
    }

    const result = await runQuery(
      `INSERT INTO certifications (user_id, name, issuer, date_obtained, expiry_date, credential_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, issuer || '', date_obtained || '', expiry_date || '', credential_id || '']
    );

    const cert = await getOne('SELECT * FROM certifications WHERE id = ?', [result.lastID]);
    res.status(201).json({ certification: cert });
  } catch (error) {
    console.error('Certification add error:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

router.delete('/certifications/:id', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM certifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Certification delete error:', error);
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

// Skills CRUD
router.post('/skills', authMiddleware, async (req, res) => {
  try {
    const { skill_name, proficiency_level } = req.body;
    
    if (!skill_name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const result = await runQuery(
      `INSERT INTO skills (user_id, skill_name, proficiency_level)
       VALUES (?, ?, ?)`,
      [req.user.id, skill_name, proficiency_level || 'intermediate']
    );

    const skill = await getOne('SELECT * FROM skills WHERE id = ?', [result.lastID]);
    res.status(201).json({ skill });
  } catch (error) {
    console.error('Skill add error:', error);
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

router.delete('/skills/:id', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM skills WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Skill delete error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Additional Info CRUD
router.post('/additional', authMiddleware, async (req, res) => {
  try {
    const { category, content } = req.body;
    
    if (!category || !content) {
      return res.status(400).json({ error: 'Category and content are required' });
    }

    const result = await runQuery(
      `INSERT INTO additional_info (user_id, category, content)
       VALUES (?, ?, ?)`,
      [req.user.id, category, content]
    );

    const info = await getOne('SELECT * FROM additional_info WHERE id = ?', [result.lastID]);
    res.status(201).json({ additionalInfo: info });
  } catch (error) {
    console.error('Additional info add error:', error);
    res.status(500).json({ error: 'Failed to add additional info' });
  }
});

router.delete('/additional/:id', authMiddleware, async (req, res) => {
  try {
    await runQuery('DELETE FROM additional_info WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Additional info deleted successfully' });
  } catch (error) {
    console.error('Additional info delete error:', error);
    res.status(500).json({ error: 'Failed to delete additional info' });
  }
});

// Admin: Get all users
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await getAll(
      `SELECT id, email, full_name, address, phone_number, linkedin_profile, github_link, experience_years, role, created_at 
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin: Update user role
router.put('/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await runQuery('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Admin: Delete user
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
