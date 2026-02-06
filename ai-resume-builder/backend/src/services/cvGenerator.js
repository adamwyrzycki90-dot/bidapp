const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } = require('docx');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

async function generateDocx(cvContent, userInfo) {
  const sections = [];

  // Header with contact info
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: userInfo.full_name, bold: true, size: 32 })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  // Contact line
  const contactParts = [];
  if (userInfo.email) contactParts.push(userInfo.email);
  if (userInfo.phone_number) contactParts.push(userInfo.phone_number);
  if (userInfo.address) contactParts.push(userInfo.address);

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: contactParts.join(' | '), size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  // Links
  const links = [];
  if (userInfo.linkedin_profile) links.push(`LinkedIn: ${userInfo.linkedin_profile}`);
  if (userInfo.github_link) links.push(`GitHub: ${userInfo.github_link}`);

  if (links.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: links.join(' | '), size: 18, color: '0066cc' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );
  }

  // Divider line
  sections.push(
    new Paragraph({
      border: {
        bottom: { color: '000000', style: BorderStyle.SINGLE, size: 6 }
      },
      spacing: { after: 200 }
    })
  );

  // Professional Summary
  if (cvContent.summary) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      })
    );
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: cvContent.summary, size: 22 })],
        spacing: { after: 200 }
      })
    );
  }

  // Skills
  if (cvContent.skills && cvContent.skills.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      })
    );
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: cvContent.skills.join(' • '), size: 22 })],
        spacing: { after: 200 }
      })
    );
  }

  // Experience
  if (cvContent.experience && cvContent.experience.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      })
    );

    for (const job of cvContent.experience) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.position, bold: true, size: 22 }),
            new TextRun({ text: ` | ${job.company}`, size: 22 })
          ],
          spacing: { before: 150 }
        })
      );
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${job.location || ''} | ${job.period || ''}`, italics: true, size: 20, color: '666666' })
          ],
          spacing: { after: 50 }
        })
      );

      if (job.achievements && job.achievements.length > 0) {
        for (const achievement of job.achievements) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${achievement}`, size: 22 })],
              indent: { left: 360 }
            })
          );
        }
      }
    }
  }

  // Education
  if (cvContent.education && cvContent.education.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      })
    );

    for (const edu of cvContent.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22 }),
            new TextRun({ text: ` - ${edu.institution}`, size: 22 })
          ]
        })
      );
      if (edu.graduation || edu.details) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: [edu.graduation, edu.details].filter(Boolean).join(' | '), italics: true, size: 20 })
            ],
            spacing: { after: 100 }
          })
        );
      }
    }
  }

  // Certifications
  if (cvContent.certifications && cvContent.certifications.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24 })],
        spacing: { before: 300, after: 100 }
      })
    );

    for (const cert of cvContent.certifications) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${cert}`, size: 22 })]
        })
      );
    }
  }

  // Additional Sections
  if (cvContent.additionalSections && cvContent.additionalSections.length > 0) {
    for (const section of cvContent.additionalSections) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 24 })],
          spacing: { before: 300, after: 100 }
        })
      );
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: section.content, size: 22 })]
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720
          }
        }
      },
      children: sections
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `cv_${uuidv4()}.docx`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, buffer);

  return { filename, filepath };
}

async function generatePdf(cvContent, userInfo) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();
  let y = height - 50;
  const margin = 50;
  const lineHeight = 14;
  const sectionSpacing = 20;

  const drawText = (text, options = {}) => {
    const {
      x = margin,
      size = 10,
      bold = false,
      color = rgb(0, 0, 0),
      maxWidth = 512
    } = options;

    const usedFont = bold ? boldFont : font;

    // Simple text wrapping
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = usedFont.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line !== '') {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    for (const l of lines) {
      if (y < 50) {
        page = pdfDoc.addPage([612, 792]);
        y = height - 50;
      }
      page.drawText(l, { x, y, size, font: usedFont, color });
      y -= lineHeight;
    }
  };

  const drawSection = (title) => {
    y -= sectionSpacing;
    if (y < 80) {
      page = pdfDoc.addPage([612, 792]);
      y = height - 50;
    }
    drawText(title.toUpperCase(), { size: 12, bold: true });
    y -= 5;
    page.drawLine({
      start: { x: margin, y: y + 5 },
      end: { x: 562, y: y + 5 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2)
    });
  };

  // Header
  drawText(userInfo.full_name, { x: 306 - (boldFont.widthOfTextAtSize(userInfo.full_name, 18) / 2), size: 18, bold: true });
  y -= 5;

  // Contact
  const contactParts = [userInfo.email, userInfo.phone_number, userInfo.address].filter(Boolean);
  const contactText = contactParts.join(' | ');
  drawText(contactText, { x: 306 - (font.widthOfTextAtSize(contactText, 9) / 2), size: 9 });

  // Links
  const links = [userInfo.linkedin_profile, userInfo.github_link].filter(Boolean);
  if (links.length > 0) {
    const linksText = links.join(' | ');
    drawText(linksText, { x: 306 - (font.widthOfTextAtSize(linksText, 9) / 2), size: 9, color: rgb(0, 0.4, 0.8) });
  }

  // Summary
  if (cvContent.summary) {
    drawSection('Professional Summary');
    drawText(cvContent.summary);
  }

  // Skills
  if (cvContent.skills && cvContent.skills.length > 0) {
    drawSection('Skills');
    drawText(cvContent.skills.join(' • '));
  }

  // Experience
  if (cvContent.experience && cvContent.experience.length > 0) {
    drawSection('Professional Experience');
    for (const job of cvContent.experience) {
      y -= 5;
      drawText(`${job.position} | ${job.company}`, { bold: true });
      drawText(`${job.location || ''} | ${job.period || ''}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
      if (job.achievements) {
        for (const ach of job.achievements) {
          drawText(`• ${ach}`, { x: margin + 10 });
        }
      }
    }
  }

  // Education
  if (cvContent.education && cvContent.education.length > 0) {
    drawSection('Education');
    for (const edu of cvContent.education) {
      drawText(`${edu.degree} - ${edu.institution}`, { bold: true });
      if (edu.graduation || edu.details) {
        drawText([edu.graduation, edu.details].filter(Boolean).join(' | '), { size: 9 });
      }
    }
  }

  // Certifications
  if (cvContent.certifications && cvContent.certifications.length > 0) {
    drawSection('Certifications');
    for (const cert of cvContent.certifications) {
      drawText(`• ${cert}`);
    }
  }

  // Additional
  if (cvContent.additionalSections && cvContent.additionalSections.length > 0) {
    for (const section of cvContent.additionalSections) {
      drawSection(section.title);
      drawText(section.content);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const filename = `cv_${uuidv4()}.pdf`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, pdfBytes);

  return { filename, filepath };
}

module.exports = { generateDocx, generatePdf };
