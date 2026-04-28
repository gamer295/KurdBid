# 📱 How to create your Android APK

I have set up the configuration for **Capacitor**. To create the actual `.apk` file you can install on your phone, follow these steps on your computer:

### Prerequisites
1. **Node.js** installed on your computer.
2. **Android Studio** installed on your computer.
3. Your project files downloaded from this editor (Export to ZIP).

### Step-by-Step Instructions

#### 1. Prepare the Mobile Project
Open a terminal in your project folder and run:
```bash
npm install
npm run build
npx cap add android
```

#### 2. Sync your code
Every time you change your code and want to see it on your phone, run:
```bash
npm run cap:sync
```

#### 3. Open in Android Studio
Run this command to open the mobile project in Android Studio:
```bash
npm run cap:open
```

#### 4. Build the APK
Inside **Android Studio**:
1. Wait for the "Gradle Sync" to finish (bottom progress bar).
2. Go to the top menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. Once finished, a popup will appear in the bottom right. Click **"locate"** to find your `app-debug.apk` file.

### 🛠 Troubleshooting Firebase Errors

#### ❌ Error: `auth/operation-not-allowed`
This means the login method is disabled in your Firebase project.
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Go to **Build > Authentication > Sign-in method**.
3. Enable **Email/Password** (the top toggle).
4. Enable **Google**.
5. Save your changes and wait 2-3 minutes.

#### ❌ Google Sign-in opens in Chrome
In mobile apps, `signInWithPopup` is blocked. I have updated the code to use `signInWithRedirect` when it detects it's running as an app.
- Ensure you have added your **SHA-1 fingerprint** to your Firebase Project Settings (under Android app) if you want Google Login to work natively.
- Add `https://kurdbid.firebaseapp.com/__/auth/handler` (replace with your project ID) to the "Authorized Redirect URIs" in Google Cloud Console.

### 💡 Pro Tip
You can also plug your Android phone into your computer via USB, enable **USB Debugging** in your phone's settings, and click the green **Play** button in Android Studio to install the app directly to your phone instantly!
