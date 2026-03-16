# **App Name**: NEU VisitTrack

## Core Features:

- Secure User Authentication: Utilize Firebase Authentication with Google Sign-In for institutional emails for both Visitor and Admin roles, alongside RFID tag number validation.
- Visitor Check-in Terminal: Provide a terminal interface to accept RFID scans or Google Sign-In for visitor identification, with immediate validation against blocked status in Firestore.
- Purpose of Visit Selection: Allow authenticated visitors to select their purpose of visit from pre-defined options (e.g., Reading Books, Research in Thesis).
- Automatic Visit Logging: Automatically save visit details including User ID, Timestamp, and Purpose of Visit to Firestore upon successful check-in.
- Admin Dashboard & Analytics: Provide a secure dashboard for admins to view visitor statistics, with filtering options by date range (Today, This Week, This Month, Custom).
- User Management Controls: Enable administrators to view a list of registered users and toggle their 'is_blocked' status directly within the dashboard.
- AI-Powered Visit Insights Tool: Generate brief summaries, identify patterns, and provide trend analyses of visit logs to assist admins in understanding library usage, leveraging a generative AI tool.

## Style Guidelines:

- The color scheme is professional and focused. Primary interactive elements and headings use a dignified, deep blue (#3960AB). This hue promotes a sense of reliability and clarity, reflecting the institutional context.
- The background features a very subtle, desaturated cool grey with a hint of the primary hue (#E7EAEF), ensuring readability and a calm user experience without being stark white.
- An accent color, a vibrant, modern aqua-cyan (#3CC2DD), is used sparingly for highlights, call-to-action elements, and subtle indicators to guide user attention and add a touch of contemporary appeal.
- Headlines and prominent text ('Space Grotesk', sans-serif) provide a modern, technical, yet highly legible appearance. Body text and all other content ('Inter', sans-serif) are designed for optimal readability, reflecting the app's clean and functional purpose.
- Clean, line-art icons should be used to represent actions and data types. Icons should be easily understandable and complement the modern aesthetic, especially for administrative tasks and visitor options.
- A structured and organized layout is essential. For the visitor terminal, this means a clear, step-by-step flow with large, touch-friendly elements. For the admin dashboard, a responsive, column-based layout provides an intuitive display of data and management tools across various screen sizes.
- Subtle, non-distracting animations for transitions, feedback on successful actions, and data updates. Examples include smooth loading indicators and gentle button press effects to enhance user interaction without being intrusive.