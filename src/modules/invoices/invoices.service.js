const prisma = require('../../config/database');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');
const { sendMail } = require('../../config/mailer');
const { paginate, paginatedResponse } = require('../../utils/helpers');
const path = require('path');
const fs = require('fs');

async function findAll(query) {
  const { page, limit, skip } = paginate(query);
  const where = {};
  if (query.client_id) where.client_id = query.client_id;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { client: { select: { business_name: true, email: true } }, payment: true },
    }),
    prisma.invoice.count({ where }),
  ]);

  return paginatedResponse(invoices, total, page, limit);
}

async function findOne(id) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, payment: true },
  });
  if (!invoice) throw { statusCode: 404, message: 'Invoice not found' };
  return invoice;
}

async function generatePDF(id) {
  const invoice = await findOne(id);
  const filePath = await generateInvoicePDF(invoice, invoice.client, invoice.payment);
  const relativePath = path.relative(process.cwd(), filePath);

  await prisma.invoice.update({ where: { id }, data: { pdf_path: relativePath } });
  return { filePath, invoice };
}

async function sendEmail(id) {
  const invoice = await findOne(id);

  let filePath = invoice.pdf_path ? path.resolve(process.cwd(), invoice.pdf_path) : null;
  if (!filePath || !fs.existsSync(filePath)) {
    const result = await generatePDF(id);
    filePath = result.filePath;
  }

  await sendMail({
    to: invoice.client.email,
    subject: `Invoice ${invoice.invoice_number} - ${invoice.client.business_name}`,
    html: `
      <h2>Invoice ${invoice.invoice_number}</h2>
      <p>Dear ${invoice.client.owner_name},</p>
      <p>Please find your invoice attached for the amount of <strong>TSh ${Number(invoice.amount).toLocaleString('en', { maximumFractionDigits: 0 })}</strong>.</p>
      <p>Thank you for your business.</p>
    `,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        path: filePath,
      },
    ],
  });

  await prisma.invoice.update({ where: { id }, data: { sent_at: new Date() } });
}

async function download(id, res) {
  const invoice = await findOne(id);

  let filePath = invoice.pdf_path ? path.resolve(process.cwd(), invoice.pdf_path) : null;
  if (!filePath || !fs.existsSync(filePath)) {
    const result = await generatePDF(id);
    filePath = result.filePath;
  }

  res.download(filePath, `${invoice.invoice_number}.pdf`);
}

module.exports = { findAll, findOne, generatePDF, sendEmail, download };
