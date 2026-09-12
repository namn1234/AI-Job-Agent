# 🤖 AI Job Agent

An AI-powered job search and resume tailoring platform that helps fresh graduates and junior developers discover relevant opportunities, evaluate job compatibility, and generate tailored resumes.

🌐 **Live App:** https://ai-job-agent-lake.vercel.app  
⚙️ **Backend API:** https://ai-job-agent-yy0m.onrender.com  
📚 **API Docs:** https://ai-job-agent-yy0m.onrender.com/docs

---

## 🚀 Features

- 🔎 Search real job opportunities from external job sources
- 🎯 Rule-based and AI-powered job matching
- 🧠 Gemini-based job analysis
- 📊 Match scores, recommendations, matching skills, and missing skills
- 🔔 New-job notification panel
- ✅ Applied / rejected job tracking
- ⚙️ Editable job-search requirements
- 📄 AI-tailored resume generation
- 💾 Saved resumes
- 📥 PDF and DOCX resume export
- 🔁 Scheduled job-search support

---

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS
- React Router

**Backend**
- Python
- FastAPI
- Uvicorn
- PyMongo

**Database**
- MongoDB Atlas

**AI**
- Google Gemini

**Deployment**
- Vercel
- Render
- MongoDB Atlas

---

## 🏗️ Architecture

```text
React / Vercel
      |
      v
FastAPI / Render
      |
      +------> MongoDB Atlas
      |
      +------> Job APIs
      |
      +------> Google Gemini
```

---

## 💻 Run Locally

```bash
git clone YOUR_REPOSITORY_URL
cd AI-Job-Agent

python -m venv .venv
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JOOBLE_API_KEY=your_job_api_key
```

Frontend:

```env
VITE_API_BASE_URL=your_backend_url
```

---

## 👨‍💻 Author

**Ismail Khan**

Software Engineering Graduate | MERN Stack Developer | Junior AI/ML Developer

- 💼 LinkedIn: https://linkedin.com/in/ismail-mern-dev
- 🐙 GitHub: https://github.com/namn1234
