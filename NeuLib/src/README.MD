# NEU Library Visitor Log

A modern, RFID-integrated library visitor management system built for **New Era University**. This application streamlines the check-in process for students, faculty, and staff using institutional Google accounts and physical RFID IDs.

## 🚀 GitHub Readiness & Security

This project is configured to be shared securely on GitHub. All sensitive API keys and Firebase configurations are handled via environment variables.

### 1. Environment Configuration
Create a `.env.local` file in the root directory (this file is ignored by Git thanks to `.gitignore`) and add your credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
GEMINI_API_KEY=your_google_ai_api_key
```

### 2. Prerequisites
- **Node.js**: Version 24.0 or higher.
- **NPM**: Version 10.0 or higher.

### 3. Getting Started
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## 🛠 Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **AI**: [Google Genkit](https://github.com/firebase/genkit) (Gemini 2.5 Flash)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 CI/CD
The GitHub Actions workflow in `.github/workflows/main.yml` is configured to use **Node.js 24** and opts into the `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` flag to ensure maximum compatibility with GitHub's latest infrastructure.

## 🔒 Security Policy
- **Institutional Access Only**: Access is strictly limited to `@neu.edu.ph` email addresses.
- **RFID Authentication**: Direct Firestore queries verify physical ID taps.
- **Admin Roles**: Specific administrative actions are restricted to authorized accounts defined in Firestore.
