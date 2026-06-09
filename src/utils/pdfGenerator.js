const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

function fmtTZS(amount) {
  return `TSh ${Number(amount || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;
}

async function generateInvoicePDF(invoice, client, payment) {
  return new Promise((resolve, reject) => {
    // Ensure the invoices directory exists before writing
    const dir = path.join(config.storage.path, 'invoices');
    fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filePath = path.join(dir, `${invoice.invoice_number}.pdf`);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const INDIGO  = '#4F46E5';
    const DARK    = '#111827';
    const GRAY    = '#6B7280';
    const LIGHT   = '#F3F4F6';
    const WIDTH   = 495.28; // usable width (595.28 - 2*50)

    // ── Header bar ────────────────────────────────────────────────────────
    doc.rect(0, 0, 595.28, 85).fill(INDIGO);

    doc.fillColor('white').font('Helvetica-Bold').fontSize(28)
      .text('INVOICE', 50, 20);
    doc.font('Helvetica').fontSize(9)
      .text('POS Management System', 50, 56);

    doc.font('Helvetica-Bold').fontSize(10)
      .text(`No: ${invoice.invoice_number}`, 50, 20, { align: 'right', width: WIDTH });
    doc.font('Helvetica').fontSize(9)
      .text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB')}`, 50, 38, { align: 'right', width: WIDTH });

    // ── Bill To / Payment Details ─────────────────────────────────────────
    const BOX_Y = 110;

    // Left box — client
    doc.rect(50, BOX_Y, 225, 115).fill(LIGHT);
    doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(8)
      .text('BILL TO', 64, BOX_Y + 12);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
      .text(client.business_name, 64, BOX_Y + 26);
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
      .text(client.owner_name, 64, BOX_Y + 44)
      .text(client.email,      64, BOX_Y + 59)
      .text(client.phone,      64, BOX_Y + 74);

    // Right box — payment info
    doc.rect(320, BOX_Y, 225, 115).fill(LIGHT);
    doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(8)
      .text('PAYMENT DETAILS', 334, BOX_Y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(DARK)
      .text(`Method: ${(payment.method || '').replace(/_/g, ' ')}`, 334, BOX_Y + 28)
      .text('Status:  PAID', 334, BOX_Y + 44);
    if (payment.reference_number) {
      doc.text(`Ref No: ${payment.reference_number}`, 334, BOX_Y + 60);
    }

    // ── Line items table ──────────────────────────────────────────────────
    const T_Y = BOX_Y + 135;

    // Table header
    doc.rect(50, T_Y, WIDTH, 26).fill(INDIGO);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
      .text('Description',  64,      T_Y + 8)
      .text('Amount',       50,      T_Y + 8, { align: 'right', width: WIDTH });

    // Row
    const R_Y = T_Y + 26;
    doc.rect(50, R_Y, WIDTH, 36).fill(LIGHT).stroke('#E5E7EB');
    doc.fillColor(DARK).font('Helvetica').fontSize(10)
      .text('Subscription Payment', 64, R_Y + 12)
      .text(fmtTZS(invoice.amount), 50, R_Y + 12, { align: 'right', width: WIDTH });

    // ── Total block ───────────────────────────────────────────────────────
    const TOT_Y = R_Y + 50;
    doc.rect(350, TOT_Y, 195, 36).fill(INDIGO);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12)
      .text('TOTAL', 365, TOT_Y + 10)
      .text(fmtTZS(invoice.amount), 350, TOT_Y + 10, { align: 'right', width: 183 });

    // ── Notes ─────────────────────────────────────────────────────────────
    if (payment.notes) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(9)
        .text(`Notes: ${payment.notes}`, 50, TOT_Y + 55);
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.moveTo(50, 755).lineTo(545.28, 755).strokeColor('#E5E7EB').stroke();
    doc.fillColor(GRAY).font('Helvetica').fontSize(8)
      .text('Thank you for your business!', 50, 765, { align: 'center', width: WIDTH })
      .text('POS Management System — Invoice generated automatically', 50, 778, { align: 'center', width: WIDTH });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePDF };
