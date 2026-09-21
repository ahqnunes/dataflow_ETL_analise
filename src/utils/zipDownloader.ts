import JSZip from 'jszip';
import { PROJECT_CODE_FILES } from '../data/projectFiles';

export async function downloadProjectZip() {
  const zip = new JSZip();

  // Add all project code files
  for (const file of PROJECT_CODE_FILES) {
    zip.file(file.path, file.content);
  }

  // Add requirements.txt
  zip.file(
    'requirements.txt',
    `# Core ETL and Data Processing
pandas>=2.1.0
numpy>=1.26.0

# Database Connectors & ORM
psycopg2-binary>=2.9.9
SQLAlchemy>=2.0.25

# Synthetic Data Generation
Faker>=22.5.1
python-dateutil>=2.8.2

# Configuration and CLI
python-dotenv>=1.0.1
click>=8.1.7
tabulate>=0.9.0
`
  );

  // Add Dockerfile
  zip.file(
    'Dockerfile',
    `FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "src_python/main.py", "--full-run"]
`
  );

  // Add .env.example
  zip.file(
    '.env.example',
    `POSTGRES_USER=dataflow_user
POSTGRES_PASSWORD=dataflow_secret
POSTGRES_DB=dataflow_db
DB_HOST=localhost
DB_PORT=5432
`
  );

  // Generate ZIP blob
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'dataflow-etl-pipeline-portfolio.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
