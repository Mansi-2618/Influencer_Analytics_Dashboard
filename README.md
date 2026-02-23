# Instagram Influencer Analytics Dashboard 📊

A complete analytics platform for Instagram influencer data with automated data processing pipelines and an interactive dashboard for visualizing key metrics.

## 🎯 What This Project Does

This project helps you analyze Instagram influencer data through:

1. **Backend Pipelines** - Python-based automated data ingestion, processing, and sentiment analysis
2. **Frontend Dashboard** - Next.js analytics dashboard for visualizing influencer metrics

## 📁 Project Structure
```
INFLUENCER_ANALYTICS_DASHBOARD/
├── backend_pipelines/          # Python data processing pipelines
│   ├── ingest/                 # Pipeline 1: Data ingestion
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── process/                # Pipeline 2: Data processing
│   │   ├── main.py
│   │   └── requirements.txt
│   └── sentiment_analysis/     # Pipeline 3: Sentiment analysis
│       ├── main.py
│       └── requirements.txt
│
└── dashboard/                  # Next.js frontend application
    ├── src/
    │   ├── components/         # React components
    │   ├── lib/                # Utility functions and helpers
    │   ├── pages/              # Next.js pages/routes
    │   └── styles/             # CSS styling files
    ├── public/                 # Static assets (images, icons)
    ├── .dockerignore           # Docker ignore rules
    ├── .gitignore              # Git ignore rules
    ├── Dockerfile              # Docker configuration
    ├── .env.example            # Environment variables template
    ├── package.json            # Dependencies
    ├── next.config.mjs         # Next.js configuration
    ├── tailwind.config.js      # Tailwind CSS setup
    ├── middleware.js           # Route middleware
    └── (other config files)
```

## 🛠️ Prerequisites

Before you start, make sure you have these installed:

- **Node.js** version 20 or higher ([Download here](https://nodejs.org/))
- **Python** version 3.9 or higher ([Download here](https://www.python.org/))
- **Docker** (optional, for containerized deployment) ([Download here](https://www.docker.com/))
- **Google Cloud SDK** (optional, for Cloud Run deployment) ([Download here](https://cloud.google.com/sdk))

---

## 🚀 Getting Started

### Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/influencer-analytics.git
cd influencer-analytics
```

---

## 💻 Dashboard Setup (Frontend)

The dashboard is a Next.js application that is being built from scratch and then we added all the components, pages, and styling.

### Option A: Use Existing Dashboard (If Cloning This Repo)

If you've cloned this repository, the dashboard already exists. Skip to **Step 1** below.

### Option B: Create Next.js App from Scratch (For New Projects)

If you want to create a similar dashboard from scratch:

#### Step 1: Create a New Next.js App
The folder name is same as your next.js app name, for example frontend_dashboard is the folder name so your app name is also same.
```bash
# Navigate to your project root
cd INFLUENCER_ANALYTICS

# Create a new Next.js app
npx create-next-app@latest dashboard
```

You'll be asked a few questions:
```
✔ Would you like to use TypeScript? … No / Yes
✔ Would you like to use ESLint? … No / Yes
✔ Would you like to use Tailwind CSS? … No / Yes
✔ Would you like to use `src/` directory? … No / Yes
✔ Would you like to use App Router? (recommended) … No / Yes
✔ Would you like to customize the default import alias (@/*)? … No / Yes
```

**Recommended answers:**
- TypeScript: No (unless you prefer TypeScript)
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: No (we're using Pages Router)
- Import alias: Yes

#### Step 2: Navigate to Dashboard
```bash
cd dashboard
```

#### Step 3: Install Additional Dependencies (if needed)
```bash
npm install axios recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# Add any other libraries you need
```

#### Step 4: Create Your Project Structure

Now you can start building! Create folders and files as needed:
```bash
# Create directories
mkdir src/components
mkdir src/lib
mkdir src/styles

# Start adding your components, pages, etc.
```

---

### Working with the Existing Dashboard

### Step 1: Go to Dashboard Folder
```bash
cd dashboard
```

### Step 2: Install Dependencies

**Windows:**
```bash
npm install
```

**Linux/Mac:**
```bash
npm install
```

This will install all the packages listed in `package.json`.

### Step 3: Set Up Environment Variables

First, create your environment file:

**Windows:**
```bash
copy .env.example .env.local
```

**Linux/Mac:**
```bash
cp .env.example .env.local
```

Then open `.env.local` in your text editor and add your actual values:
```env
For Local Testing:
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
# Add any other environment variables you need
```

### Step 4: Run the Development Server
```bash
npm run dev
```

Open your browser and go to `http://localhost:3000` - you should see the dashboard!

### Step 5: Build for Production (Optional)

When you're ready to deploy:
```bash
npm run build
npm start
```

---

## Backend Pipelines Setup

We have three separate pipelines - each one handles a different part of the data processing. They're all deployed on Google Cloud Run, but you can also run them locally.

### Pipeline 1: Data Ingestion

#### Step 1: Navigate to Ingest Folder
```bash
cd backend_pipelines/ingest
```

#### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` at the beginning of your command line - this means the virtual environment is active.

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Run the Pipeline
```bash
python main.py
```

#### Step 5: Deactivate When Done
```bash
deactivate
```

---

### Pipeline 2: Data Processing

Follow the same steps as Pipeline 1, but navigate to the process folder:
```bash
cd backend_pipelines/process
```

Then repeat steps 2-5 from Pipeline 1.

---

### Pipeline 3: Sentiment Analysis

Again, same steps but for sentiment analysis:
```bash
cd backend_pipelines/sentiment_analysis
```

Then repeat steps 2-5 from Pipeline 1.

---

## 🎨 Customizing the Dashboard

After setting up, you can customize the dashboard by:

1. **Adding Components**: Create new React components in `src/components/`
2. **Creating Pages**: Add new pages in `src/pages/`
3. **Styling**: Modify styles in `src/styles/` or use Tailwind classes
4. **Adding Utilities**: Create helper functions in `src/lib/`
5. **Static Assets**: Add images, icons, fonts in `public/`

---

## 🐳 Running with Docker

If you prefer using Docker, here's how to run the dashboard in a container.

### Build the Docker Image
```bash
cd dashboard
docker build -t influencer-dashboard .
```

### Run the Container
```bash
docker run -p 8080:8080 influencer-dashboard
```

Now open `http://localhost:8080` in your browser!

---

## ☁️ Deploying to Google Cloud Run

All components of this project can be deployed to Google Cloud Run. Here's how to deploy each one.

### Prerequisites

Make sure you're logged in to Google Cloud:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with your actual Google Cloud project ID.

---

### Deploy Pipeline 1: Data Ingestion

#### Step 1: Create Dockerfile for Ingest Pipeline

Create a file named `Dockerfile` in `backend_pipelines/ingest/`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
```

#### Step 2: Deploy to Cloud Run
```bash
cd backend_pipelines/ingest

gcloud run deploy ingest-pipeline \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

After deployment, you'll get a URL like: `https://ingest-pipeline-xxxxx.run.app`

---

### Deploy Pipeline 2: Data Processing

#### Step 1: Create Dockerfile for Process Pipeline

Create a file named `Dockerfile` in `backend_pipelines/process/`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
```

#### Step 2: Deploy to Cloud Run
```bash
cd backend_pipelines/process

gcloud run deploy process-pipeline \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

After deployment, you'll get a URL like: `https://process-pipeline-xxxxx.run.app`

---

### Deploy Pipeline 3: Sentiment Analysis

#### Step 1: Create Dockerfile for Sentiment Analysis Pipeline

Create a file named `Dockerfile` in `backend_pipelines/sentiment_analysis/`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python", "main.py"]
```

#### Step 2: Deploy to Cloud Run
```bash
cd backend_pipelines/sentiment_analysis

gcloud run deploy sentiment-analysis-pipeline \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

After deployment, you'll get a URL like: `https://sentiment-analysis-pipeline-xxxxx.run.app`

---

### Deploy Dashboard to Cloud Run

**Option 1: Using Cloud Build (Recommended)**
```bash
cd dashboard

gcloud run deploy influencer-dashboard \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1
```

**Option 2: Build Docker Image Locally**
```bash
cd dashboard

# Build the image
docker build -t gcr.io/YOUR_PROJECT_ID/influencer-dashboard .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/influencer-dashboard

# Deploy to Cloud Run
gcloud run deploy influencer-dashboard \
  --image gcr.io/YOUR_PROJECT_ID/influencer-dashboard \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --port 8080
```

After deployment, you'll get a URL like: `https://influencer-dashboard-xxxxx.run.app`

---

## 🔗 Connecting Everything Together

After deploying all components, update your dashboard's environment variables:

1. Go to your deployed dashboard on Cloud Run
2. Click "Edit & Deploy New Revision"
3. Under "Variables & Secrets", add:
```
NEXT_PUBLIC_INGEST_URL=https://ingest-pipeline-xxxxx.run.app
NEXT_PUBLIC_PROCESS_URL=https://process-pipeline-xxxxx.run.app
NEXT_PUBLIC_SENTIMENT_URL=https://sentiment-analysis-pipeline-xxxxx.run.app
```

Replace the URLs with your actual deployed pipeline URLs.

---

## 💰 Cost Optimization Tips

- **Memory & CPU**: Start with 512Mi and 1 CPU, adjust based on usage
- **Auto-scaling**: Cloud Run scales to zero when not in use - you only pay when pipelines are running
- **Regional Deployment**: Deploy in the region closest to your users
- **Request Timeout**: Set appropriate timeouts for long-running pipelines
```bash
gcloud run deploy pipeline-name \
  --timeout 600 \
  --max-instances 10 \
  --min-instances 0
```

---

## 📊 Monitoring Your Deployments

View logs for any deployed service:
```bash
# View dashboard logs
gcloud run logs read influencer-dashboard --region us-central1

# View pipeline logs
gcloud run logs read ingest-pipeline --region us-central1
gcloud run logs read process-pipeline --region us-central1
gcloud run logs read sentiment-analysis-pipeline --region us-central1
```

---

## 📝 Important Notes

### Environment Variables

- Never commit `.env.local` or `.env` files to GitHub - they contain sensitive information
- Always use `.env.example` as a template for others
- When deploying to Cloud Run, set environment variables using the `--set-env-vars` flag

### Dependencies

- The `node_modules` folder is automatically ignored by Git (via `.gitignore`)
- The `venv` folder is also ignored - everyone creates their own virtual environment
- Always run `npm install` after cloning to get all dependencies

### Virtual Environments (Python)

- Always create a new virtual environment for each pipeline
- Always activate it before installing packages or running scripts
- This keeps your dependencies isolated and prevents conflicts

---

### Dockerfiles for Pipelines

- Each pipeline needs its own Dockerfile
- Keep them simple and focused
- Use Python 3.9-slim for smaller image sizes

---

## 🤝 Contributing

If you want to add features or fix bugs:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Make your changes
4. Commit (`git commit -m "Add some feature"`)
5. Push to your branch (`git push origin feature-name`)
6. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

**Built using Next.js, Python, and Google Cloud**
