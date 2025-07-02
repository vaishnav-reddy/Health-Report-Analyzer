# 🩺 Health Report Analyzer

Upload your lab reports (PDF/image) and get your health data automatically extracted into organized tables with trend analysis. No more manual data entry!

## What It Does
- Upload lab reports and get instant data extraction
- View results in clean, sortable tables
- Track trends over time
- Secure login and data storage

## Supported Tests
Cholesterol, Blood Sugar, Blood Count, Vitamins, Thyroid, and more.

## Tech Stack
React + Node.js + MongoDB + OCR

## Quick Start

**Prerequisites:** Node.js + MongoDB

```bash
# Install everything
npm run install-all

# Start the app
npm run dev
```

Open http://localhost:3000 and start uploading your reports!

## Common Issues
- **No data extracted?** Try PDF instead of image
- **Can't connect?** Make sure MongoDB is running
- **Slow upload?** Large files take time to process

## Security
Your files are processed in memory only - never saved to disk. JWT authentication keeps your data secure.

---
*Disclaimer: For informational purposes only. Always consult healthcare professionals for medical advice.*

