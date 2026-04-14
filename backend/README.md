# Capstone Project Backend API

This is a FastAPI-based backend application utilizing SQLAlchemy, Pydantic, and MySQL. It includes a user authentication system using JWT tokens and bcrypt password hashing.

## Setup Instructions

### 1. Environment Setup
Create a virtual environment and install the required packages:

```
# Create virtual environment
python -m venv venv

# Activate it (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variable
Create a .env file in the backend of the project with your MySQL database credentials:
```
DB_HOST=localhost
DB_NAME=your_database_name
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
```

### 3. Seeding the Database
1. Open your terminal in the root folder of the project
2. Activate your virtual environment:
```
source venv/bin/activate
```
3. Run the seed script:
```
python seed.py
```

### 4. Start uvicorn server
1. Run uvicorn command in your terminal
```
uvicorn backend.api.main:app --reload
```
2. Open this link below in your browser
```
http://127.0.0.1:8000/docs#/
```

### Pytest unit testing
Run the following command in the root folder
```
pytest backend/api/unit_testing
```