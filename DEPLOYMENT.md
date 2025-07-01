# 🚀 Deployment Guide

## Backend Deployment (Render)

1. **Create New Web Service on Render**
   - Connect your GitHub repository
   - Set Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables on Render:**
   ```
   NODE_ENV=production
   JWT_SECRET=7fbcf7fb6f40b91eb3e3dca4901baced72feb315305b233e2f10ea2373f387f280491958149ebbc31a4409798f3853d6a711ceae5c2314ddce509780aa49c222
   SESSION_EXPIRE=7d
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-analyzer?retryWrites=true&w=majority
   ```

3. **Update CORS Origins:**
   - After frontend deployment, update `server.js` with your Vercel URL

## Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   - Connect your GitHub repository
   - Set Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Environment Variables on Vercel:**
   ```
   VITE_API_URL=https://your-render-app-name.onrender.com/api
   ```

## Post-Deployment Steps

1. **Update Backend CORS:**
   ```javascript
   origin: ['https://your-vercel-app.vercel.app']
   ```

2. **Test the Flow:**
   - Register a new user
   - Upload a health report
   - Verify trends and insights work

## Important Notes

- ✅ User data stored in MongoDB (secure & scalable)
- ✅ Reports stored in MongoDB with user isolation
- ✅ JWT authentication with bcrypt password hashing
- ✅ File uploads work (consider cloud storage for production files)
- ✅ OCR processing works on Render with a robust, regex-based extractor
- ⚠️ Set up MongoDB Atlas for production database

## MongoDB Setup

1. **Create MongoDB Atlas Account** (free tier available)
2. **Create a new cluster**
3. **Create database user and get connection string**
4. **Add connection string to MONGODB_URI environment variable**
5. **Whitelist Render's IP addresses or use 0.0.0.0/0 for all IPs**

## Troubleshooting

- **CORS Errors**: Check frontend URL in backend CORS config
- **API Not Found**: Verify VITE_API_URL in Vercel environment
- **Upload Fails**: Check file size limits and network timeout
- **Auth Issues**: Verify JWT_SECRET is set on Render
