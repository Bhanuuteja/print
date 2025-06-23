import nodemailer from 'nodemailer';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload error' });
    }

    const file = files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file data
    const fileData = fs.readFileSync(file.filepath);

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_EMAIL_PASS,
      },
    });

    // Send email with attachment to printer
    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: process.env.PRINTER_EMAIL,
        subject: 'Cloud Print Job',
        text: 'Print job sent from Cloud Print System.',
        attachments: [
          {
            filename: file.originalFilename,
            content: fileData,
          },
        ],
      });
      res.status(200).json({ message: 'Print job sent successfully!', showReceivedButton: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send print job', details: error.message });
    }
  });
}
