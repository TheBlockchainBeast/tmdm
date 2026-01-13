# TON Connect Manifest Setup

## Issue
TON Connect requires the manifest.json file to be served over HTTPS. Localhost doesn't work for TON Connect.

## Solution
Host the manifest.json file on GitHub and use the raw GitHub URL.

## Steps:

1. **Update the manifest.json file** with your actual URLs:
   - Update `YOUR_USERNAME` and `YOUR_REPO` in `public/manifest.json`
   - Update the `iconUrl` to point to your GitHub raw URL for the logo

2. **Push to GitHub**:
   ```bash
   git add public/manifest.json
   git commit -m "Add TON Connect manifest"
   git push origin main
   ```

3. **Update TonConnectProvider.tsx**:
   - Replace `YOUR_USERNAME/YOUR_REPO` in the GitHub raw URL
   - Or set `NEXT_PUBLIC_MANIFEST_URL` environment variable

4. **Example GitHub Raw URL**:
   ```
   https://raw.githubusercontent.com/yourusername/yourrepo/main/public/manifest.json
   ```

5. **For Production**:
   - Update the `url` field in manifest.json to your production domain
   - Update `iconUrl` to your production domain or GitHub raw URL
   - Make sure all URLs use HTTPS

## Environment Variable (Optional)
You can also set an environment variable:
```
NEXT_PUBLIC_MANIFEST_URL=https://raw.githubusercontent.com/yourusername/yourrepo/main/public/manifest.json
```
