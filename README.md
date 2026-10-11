# PDF Tools

A small website I made for doing basic PDF stuff without having to install another app.

You can merge PDFs, split out a page, convert a PDF page to JPG, add text to a PDF, and do a few other things. There's also an OCR tool that tries to read text from images.

## What it can do

- **Merge PDFs** — Put multiple PDF files together.
- **Split PDF** — Extract a page into a separate file.
- **PDF to JPG** — Turn a PDF page into an image.
- **Password removal** — Make an unprotected copy of a PDF if you have the password.
- **OCR** — Read text from an uploaded image.
- **Add text** — Put some extra text on a PDF page.
- **Compression** — Re-save a PDF in an attempt to reduce its size.

## How it works

Everything runs in the browser using JavaScript. The files are processed on the client side, so the website doesn't need its own backend to handle them.

I used `pdf-lib` for editing PDFs, `PDF.js` for rendering pages, and `Tesseract.js` for OCR.

## Files

- `index.html` — The page and its controls.
- `style.css` — The styling.
- `app.js` — The actual functionality.

## Running it

Open `index.html` in a browser. If some features don't work when opening it directly, try running it through a local development server.

## A note

This is a personal project, so some features may have limitations. For example, compression won't necessarily make every PDF smaller, and password removal requires the correct password for protected files.