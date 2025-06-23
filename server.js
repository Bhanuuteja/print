import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('API is running. Use POST /api/print to upload files.');
});

app.post('/api/print', (req, res) => {
  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    console.log('FIELDS:', fields);
    console.log('FILES:', files);
    console.log('FILES KEYS:', Object.keys(files));

    // Accept file under 'file' or '' key, or pick first file if present
    let file;
    if (files.file && Array.isArray(files.file)) {
      file = files.file[0];
    } else if (files[''] && Array.isArray(files[''])) {
      file = files[''][0];
    } else if (Object.keys(files).length > 0) {
      // Pick the first file in files object
      const firstKey = Object.keys(files)[0];
      if (Array.isArray(files[firstKey])) {
        file = files[firstKey][0];
      } else {
        file = files[firstKey];
      }
      console.log('Picked file from key:', firstKey);
    }
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded', files });
    }

    const data = fs.readFileSync(file.filepath);
    // File is NOT saved to disk, only used in memory for emailing

    // Debug log for environment variables
    console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
    console.log('SENDER_EMAIL_PASS:', process.env.SENDER_EMAIL_PASS ? '***set***' : '***missing***');
    console.log('PRINTER_EMAIL:', process.env.PRINTER_EMAIL);
    // Email sending logic
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_EMAIL,
          pass: process.env.SENDER_EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: process.env.PRINTER_EMAIL,
        subject: 'Cloud Print Job',
        text: 'Print job sent from Cloud Print System.',
        attachments: [
          {
            filename: file.originalFilename,
            content: data,
          },
        ],
      });
      res.status(200).json({
        message: 'File uploaded and emailed successfully',
        fileName: file.originalFilename,
        showReceivedButton: true
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      res.status(500).json({ error: 'File uploaded but failed to send email', details: error.message });
    }
  });
});

app.listen(5000, '0.0.0.0', () => console.log('Backend running on http://localhost:5000'));
