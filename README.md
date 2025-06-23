# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# Cloud Print System Setup — Backend Steps

## 1. Project Initialization

- Make sure your project is a Next.js app.
- Confirm the structure includes `/pages/api/print.js`.

## 2. Install Required Packages

In your terminal:

```
npm install nodemailer formidable
```

## 3. Environment Variables

Create a file in your root directory called `.env.local` with the following:

```
SENDER_EMAIL=your.email@gmail.com
SENDER_EMAIL_PASS=your_app_password
PRINTER_EMAIL=yourprinter@epsonconnect.com
```

**Important:** If you use Gmail and have 2FA enabled, generate an App Password to use as `SENDER_EMAIL_PASS`.

## 4. Setup Epson Email Print

- Register your printer using the Epson Smart Panel mobile app.
- Sign into or create an Epson Connect account.
- Enable Epson Email Print and get your printer's unique email address.
- Paste it as `PRINTER_EMAIL` in your `.env.local`.

## 5. Connect Frontend Upload

- Your frontend page (e.g. `pages/ready.js`) should POST the uploaded file to `/api/print` as `multipart/form-data`.
- The field name must be `file`.

**Example fetch code from frontend:**

```js
const formData = new FormData();
formData.append('file', selectedFile);

fetch('/api/print', {
  method: 'POST',
  body: formData,
});
```

## 6. Test Locally

Run the development server:

```
npm run dev
```

Open [http://localhost:3000/ready](http://localhost:3000/ready), upload a file, and confirm it gets printed.

## 7. Deploy

- Push your code to GitHub.
- Deploy the project on Vercel.
- Add `SENDER_EMAIL`, `SENDER_EMAIL_PASS`, and `PRINTER_EMAIL` to your Vercel Environment Variables.

## 8. Confirm Print Flow

- Upload a file via your live frontend.
- Check your Gmail “Sent” folder.
- Your Epson printer should receive and print the file.

## 9. Optional Enhancements

- Add file size limit (e.g., < 10 MB).
- Validate file types (PDF, JPG, PNG).
- Add upload status notifications in the UI.
- Rate limit or CAPTCHA for abuse prevention.
