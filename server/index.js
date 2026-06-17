const express = require('express');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));

// More robust PDF generation endpoint with header/footer, page numbers and image embedding
app.post('/generate-pdf', async (req, res) => {
  try {
    const assessment = req.body || {};
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_WIDTH = 595; // A4 points
    const PAGE_HEIGHT = 842;
    const MARGIN = 40;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    const pages = [];

    const addPage = () => {
      const p = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      // header
      const title = assessment.projectName || 'Assessment Report';
      p.drawText(title, { x: MARGIN, y: PAGE_HEIGHT - 60, size: 18, font, color: rgb(0.06, 0.45, 0.23) });
      // thin divider
      p.drawLine({ start: { x: MARGIN, y: PAGE_HEIGHT - 68 }, end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 68 }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      pages.push(p);
      return p;
    };

    let currentPage = addPage();
    let cursorY = PAGE_HEIGHT - 90;
    const fontSize = 11;

    const pushText = (text) => {
      const wrapped = wrapText(text, fontSize, font, CONTENT_WIDTH);
      for (const wl of wrapped) {
        if (cursorY < MARGIN + 80) {
          currentPage = addPage();
          cursorY = PAGE_HEIGHT - 90;
        }
        currentPage.drawText(wl, { x: MARGIN, y: cursorY, size: fontSize, font, color: rgb(0,0,0) });
        cursorY -= fontSize + 4;
      }
    };

    // Metadata box
    const safeProjectName = assessment.projectName || '';
    const metaLines = [
      `Project: ${safeProjectName}`,
      `Location: ${assessment.location || ''}`,
      `Type: ${assessment.projectType || ''}`,
      `Date: ${assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : ''}`,
    ];
    // draw metadata as a boxed area
    if (cursorY - (metaLines.length * (fontSize + 4) + 14) < MARGIN) {
      currentPage = addPage();
      cursorY = PAGE_HEIGHT - 90;
    }
    const boxHeight = metaLines.length * (fontSize + 4) + 12;
    currentPage.drawRectangle({ x: MARGIN, y: cursorY - boxHeight + 6, width: CONTENT_WIDTH, height: boxHeight, color: rgb(0.97,0.98,0.97), borderColor: rgb(0.9,0.9,0.9), borderWidth: 0.5 });
    let metaY = cursorY - 8;
    for (const ml of metaLines) {
      currentPage.drawText(ml, { x: MARGIN + 8, y: metaY, size: fontSize, font, color: rgb(0.12,0.12,0.12) });
      metaY -= fontSize + 4;
    }
    cursorY -= boxHeight + 8;

    // Report content
    const reportText = assessment.report || '';
    const reportLines = reportText.split('\n');
    for (const line of reportLines) {
      pushText(line);
    }

    // Evidence images (if any) - render after text
    if (Array.isArray(assessment.evidence)) {
      for (const ev of assessment.evidence) {
        const data = (ev.data || '').toString();
        // support data URLs
        const m = data.match(/^data:(image\/(png|jpeg|jpg));base64,(.*)$/);
        if (!m) continue;
        const mime = m[1];
        const b64 = m[3];
        const imgBytes = Buffer.from(b64, 'base64');
        let embeddedImg;
        try {
          if (mime === 'image/png') embeddedImg = await pdfDoc.embedPng(imgBytes);
          else embeddedImg = await pdfDoc.embedJpg(imgBytes);
        } catch (e) {
          // skip if embed fails
          continue;
        }

        const imgDims = embeddedImg.scale(1);
        const maxImgWidth = CONTENT_WIDTH;
        const maxImgHeight = PAGE_HEIGHT - MARGIN - 120;
        const scale = Math.min(maxImgWidth / imgDims.width, maxImgHeight / imgDims.height, 1);
        const drawn = embeddedImg.scale(scale);

        // if not enough space vertically, create new page
        if (cursorY - drawn.height < MARGIN + 40) {
          currentPage = addPage();
          cursorY = PAGE_HEIGHT - 90;
        }

        currentPage.drawImage(embeddedImg, {
          x: MARGIN,
          y: cursorY - drawn.height,
          width: drawn.width,
          height: drawn.height,
        });
        // caption
        currentPage.drawText(ev.name || '', { x: MARGIN, y: cursorY - drawn.height - 14, size: 10, font, color: rgb(0.2,0.2,0.2) });
        cursorY -= drawn.height + 28;
      }
    }

    // Add page numbers
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const label = `Page ${i + 1} of ${pages.length}`;
      const textWidth = font.widthOfTextAtSize(label, 9);
      p.drawText(label, { x: (PAGE_WIDTH - textWidth) / 2, y: 20, size: 9, font, color: rgb(0.5,0.5,0.5) });
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBytes.length);
    return res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'PDF generation failed' });
  }
});

function wrapText(text, fontSize, font, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`PDF server running on http://localhost:${port}`));
