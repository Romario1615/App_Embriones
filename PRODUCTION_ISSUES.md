# Production Issues - Render Deployment

## Current Error (as of 2025-11-27)

**Error:** 500 Internal Server Error + CORS blocking
**Location:** https://app-embriones.onrender.com/api/v1/donadoras/
**Frontend:** https://app-embriones.vercel.app

## Error Details

1. **500 Internal Server Error** - The backend is crashing before it can send CORS headers
2. **CORS Error** - "No 'Access-Control-Allow-Origin' header is present"

## Root Cause

The backend on Render is likely experiencing the same Cloudinary module import error we saw locally:
```
module 'cloudinary' has no attribute 'url'
```

This happened because there was old cached code using an incorrect Cloudinary API method.

## Fix Applied (Commit cc48f1f)

1. **Updated Cloudinary Service** - Changed to use `cloudinary.utils.cloudinary_url()`
2. **Added Production CORS** - Added `https://app-embriones.vercel.app` to allowed origins

## Next Steps

### On Render Dashboard:

1. Go to https://dashboard.render.com
2. Select your backend service "app-embriones"
3. Check the deployment status:
   - If deploying: Wait for it to complete
   - If failed: Check the logs for errors
   - If live but old: Trigger manual deploy

### Manual Deploy (if needed):

1. In Render dashboard → Backend service
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (~3-5 minutes)

### Check Logs:

1. Click on "Logs" tab in Render dashboard
2. Look for the startup sequence
3. Verify no errors related to Cloudinary

### Expected After Deploy:

- ✅ CORS headers should include Vercel origin
- ✅ Cloudinary service should work correctly
- ✅ 500 errors should be resolved
- ✅ Photo upload functionality should work

## Environment Variables on Render

Make sure these are set:
- `CLOUDINARY_CLOUD_NAME=dwnmf6niq`
- `CLOUDINARY_API_KEY=165586669561659`
- `CLOUDINARY_API_SECRET=w3K08BOp-z98EIdUbfCFwvMRbds`
- `DATABASE_URL` (PostgreSQL connection string)
- `SECRET_KEY` (for JWT tokens)

## Testing After Deploy

1. Visit https://app-embriones.vercel.app
2. Login with credentials
3. Navigate to Donadoras page
4. Try adding a new donadora with photo
5. Verify photo uploads to Cloudinary successfully

---

**Note:** The fix has been committed and pushed to GitHub. Render should auto-deploy within a few minutes.
