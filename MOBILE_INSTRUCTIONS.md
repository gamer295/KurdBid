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
4. Save your changes and wait 2-3 minutes.

#### ❌ Error: `auth/unauthorized-domain`
This happens because Firebase doesn't recognize your GitHub Pages URL yet.
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication > Settings > Authorized domains**.
3. Click **Add domain** and enter: `gamer295.github.io`
4. Click **Add** and wait 1 minute.

### 💡 Pro Tip
You can also plug your Android phone into your computer via USB, enable **USB Debugging** in your phone's settings, and click the green **Play** button in Android Studio to install the app directly to your phone instantly!
