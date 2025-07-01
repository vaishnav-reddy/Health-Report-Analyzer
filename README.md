# Health Report Analyzer

A simple, functional web app that allows users to upload lab reports (PDF or image) and instantly view their health parameters extracted into a clean, interactive table with trend analysis.

## 🚀 Features

✅ **Smart File Upload**: Drag & drop support for PDF/image reports  
✅ **Advanced OCR**: Text extraction using Tesseract.js with image optimization  
✅ **Intelligent Parameter Extraction**: Recognizes 15+ health parameters with fuzzy matching  
✅ **Interactive Table**: Responsive display with filtering and sorting  
✅ **Trend Analysis**: 6-month historical trend simulation with insights  
✅ **User Authentication**: Secure login system with JWT tokens  
✅ **Data Persistence**: MongoDB storage for reports and user data  
✅ **Modern UI**: Glass-morphism design with mobile responsiveness  

## 🧪 Supported Parameters

**Lipid Profile**: Total Cholesterol, HDL, LDL, VLDL, Non-HDL, Triglycerides  
**Blood Sugar**: Glucose, HbA1c  
**Complete Blood Count**: Hemoglobin, RBC, WBC, Platelets, PCV, MCV, MCH, MCHC, RDW  
**Differential Count**: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils  
**Vitamins**: Vitamin D, Vitamin B12  
**Thyroid**: TSH  

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Axios
- **Backend**: Node.js + Express + MongoDB
- **OCR**: Tesseract.js + Sharp (image processing)
- **Authentication**: JWT + bcrypt
- **File Processing**: Multer (in-memory) + PDF-parse
- **Database**: MongoDB with Mongoose

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Clean up any existing uploaded files (optional):**
   ```bash
   cd server && node cleanup-uploads.js && cd ..
   ```

3. **Configure environment:**
   - Server env variables are already set in `server/.env`
   - Client env points to `http://localhost:5000/api`

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Testing with Your Lab Reports

1. **Register/Login** to the application
2. **Upload your lab report** (PDF or clear image)
3. **View extracted parameters** in the interactive table
4. **Generate trends** to see 6-month historical simulation
5. **Get insights** on parameter status and recommendations

## 🔧 Troubleshooting

### If no parameters are extracted:

1. **Check image quality**: Ensure text is clear and readable
2. **Verify format**: The app works best with standard lab report formats
3. **Check console logs**: Server logs show extraction details
4. **Try different file**: PDF files generally work better than images

### Common issues:

- **MongoDB connection**: Ensure MongoDB is running or Atlas URI is correct
- **Port conflicts**: Change ports in package.json if needed
- **OCR timeout**: Large images may take longer to process

## 📁 Project Structure

```
Health-Report-Analyzer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── styles/         # CSS files
│   │   └── utils/          # API utilities
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── utils/              # Utilities (auth, extraction)
│   └── config/             # Database config
└── package.json           # Root package.json
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Environment variable protection
- In-memory file processing (no disk storage)
- Input validation and sanitization
- CORS configuration

## 🌐 Deployment Ready

✅ **Vercel Compatible**: No file system dependencies  
✅ **Render Compatible**: Ephemeral storage safe  
✅ **Railway Compatible**: Stateless design  
✅ **Heroku Compatible**: 12-factor app compliant  

The application processes files entirely in memory without saving to disk, making it perfect for serverless and container deployments.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

This tool is for informational purposes only. Always consult with healthcare professionals for medical advice.

