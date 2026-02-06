const express = require('express');
const { runQuery, getOne, getAll } = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const { generateCVContent, extractJobDetails } = require('../services/openai');
const { generateDocx, generatePdf } = require('../services/cvGenerator');

const router = express.Router();

// Generate CV from job description
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { jobDescription, jdLink } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Get user profile
    const user = await getOne(
      `SELECT id, email, full_name, address, phone_number, linkedin_profile, github_link, experience_years 
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
      'SELECT * FROM certifications WHERE user_id = ?',
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

    const userProfile = {
      user,
      employmentHistory,
      education,
      certifications,
      skills,
      additionalInfo
    };

    // Generate CV content using OpenAI
    const cvContent = await generateCVContent(userProfile, jobDescription);

    // Extract job details
    const jobDetails = await extractJobDetails(jobDescription);

    // Generate DOCX and PDF
    const [docxResult, pdfResult] = await Promise.all([
      generateDocx(cvContent, user),
      generatePdf(cvContent, user)
    ]);

    // Save application record
    const result = await runQuery(
      `INSERT INTO applications (user_id, job_title, company_name, jd_link, jd_content, cv_doc_path, cv_pdf_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        jobDetails.jobTitle,
        jobDetails.companyName,
        jdLink || '',
        jobDescription,
        docxResult.filename,
        pdfResult.filename
      ]
    );

    const application = await getOne('SELECT * FROM applications WHERE id = ?', [result.lastID]);

    res.json({
      message: 'CV generated successfully',
      application: {
        id: application.id,
        jobTitle: application.job_title,
        companyName: application.company_name,
        appliedAt: application.applied_at,
        cvDocUrl: `/uploads/${docxResult.filename}`,
        cvPdfUrl: `/uploads/${pdfResult.filename}`
      },
      cvContent
    });
  } catch (error) {
    console.error('CV generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate CV' });
  }
});

// Preview CV content (without saving)
router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Get user profile
    const user = await getOne(
      `SELECT id, email, full_name, address, phone_number, linkedin_profile, github_link, experience_years 
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
      'SELECT * FROM certifications WHERE user_id = ?',
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

    const userProfile = {
      user,
      employmentHistory,
      education,
      certifications,
      skills,
      additionalInfo
    };

    // Generate CV content using OpenAI
    const cvContent = await generateCVContent(userProfile, jobDescription);

    res.json({
      message: 'CV preview generated',
      cvContent,
      userInfo: {
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        address: user.address,
        linkedin: user.linkedin_profile,
        github: user.github_link
      }
    });
  } catch (error) {
    console.error('CV preview error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate preview' });
  }
});

// Download CV as DOCX
router.get('/download/docx/:applicationId', authMiddleware, async (req, res) => {
  try {
    const application = await getOne(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [req.params.applicationId, req.user.id]
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.redirect(`/uploads/${application.cv_doc_path}`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download CV as PDF
router.get('/download/pdf/:applicationId', authMiddleware, async (req, res) => {
  try {
    const application = await getOne(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [req.params.applicationId, req.user.id]
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.redirect(`/uploads/${application.cv_pdf_path}`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router;
