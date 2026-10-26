from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import create_tables
from routers import upload, flashcards, auth, sets, scores, friends, game

# Create database tables on startup
create_tables()

from services.auth import protect_browser_request
from services.session_config import ALLOWED_ORIGINS

app = FastAPI(title="Lumitudy API", dependencies=[Depends(protect_browser_request)])

@app.middleware("http")
async def private_responses(request, call_next):
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response

# Allow requests from frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

# Register routers
app.include_router(upload.router)
app.include_router(flashcards.router)
app.include_router(auth.router)
app.include_router(sets.router)
app.include_router(scores.router)
app.include_router(friends.router)
app.include_router(game.router)

@app.get("/")
def root():
    return {"message": "Lumitudy API is running"}
