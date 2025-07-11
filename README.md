# 🎓 BrightMind Learning Platform

## 📘 Project Overview

**BrightMind** is a modern, fast, and scalable **e-learning platform** built using React and Supabase.  
It features a **role-based access system** for Admins, Instructors, and Students, allowing secure and personalized content delivery across user types.

---

## 🔗 Live & Source Links

- 🚀 **Live App**: [https://brighthubmind.netlify.app](https://brighthubmind.netlify.app)
- 💻 **GitHub Repo**: [https://github.com/webdevabdul0/brightmind-learning-nexus](https://github.com/webdevabdul0/brightmind-learning-nexus)

---

## 🚀 Getting Started

To run the project locally, make sure you have **Node.js** and **npm** installed.

### 🔧 Setup Instructions

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/webdevabdul0/brightmind-learning-nexus.git

# 2. Navigate to the project directory
cd brightmind-learning-nexus

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
\`\`\`

---

## 👥 Role-Based Access

The platform includes user roles with distinct access levels:

- **Admin** – Manage users, courses, and platform settings
- **Instructor** – Create, edit, and manage course content
- **Student** – Enroll in and consume courses, track progress

Authentication and role management is powered by **Supabase Auth + Row Level Security (RLS).**

---

## 🧱 Tech Stack

| Layer         | Tech                           |
|---------------|--------------------------------|
| Frontend      | React + Vite + TypeScript      |
| Styling       | Tailwind CSS + shadcn/ui       |
| Backend       | Supabase (PostgreSQL + Auth)   |
| Auth          | Supabase Auth + Role Control   |
| Deployment    | Netlify                        |

---

## 🧠 Features

- 🔐 Secure authentication with Supabase
- 👤 Role-based dashboard views
- 📚 Course management and content creation
- 📝 Real-time database updates and storage
- 🎨 Clean, accessible UI with Tailwind and shadcn/ui

---

## 🌐 Deployment

The app is deployed on **Netlify**.  
To deploy your own fork:

1. Push to your own GitHub repo
2. Link your repo to Netlify
3. Add environment variables (see below)
4. Set a custom domain (optional)

---

## 🔐 Environment Variables

Create a `.env` file with the following:

\`\`\`env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
