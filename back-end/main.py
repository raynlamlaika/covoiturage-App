from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime, timedelta
import requests
import asyncio
from typing import List, Dict, Optional
import logging
import os
from sqlalchemy.orm import Session

# Import auth module
from auth import (
    UserRegister, UserLogin, Token, User, UserUpdate,
    register_user, login_user, get_current_user, get_user_profile,
    update_user_profile, delete_user_account, oauth,
    get_or_create_oauth_user, create_token_from_oauth_user
)
from database import get_db, UserDB

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AFCON 2025 Match API with Auth")

# Add session middleware (required for OAuth)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-change-in-production"),
    max_age=3600
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global cache for matches
matches_cache = {
    "data": [],
    "last_updated": None
}

# Configuration
CACHE_DURATION_HOURS = 1
THESPORTSDB_API_URL = "https://www.thesportsdb.com/api/v1/json/3"
AFCON_LEAGUE_ID = "4416"

# API Keys (set these as environment variables)
API_FOOTBALL_KEY = os.getenv("API_FOOTBALL_KEY", "")  # Get free key at api-football.com
FOOTBALL_DATA_KEY = os.getenv("FOOTBALL_DATA_KEY", "")  # Get free key at football-data.org

class AFCONDataFetcher: 
    def __init__(self):
        self.thesportsdb_url = THESPORTSDB_API_URL
        self.league_id = AFCON_LEAGUE_ID
        self.api_football_key = API_FOOTBALL_KEY
        self.football_data_key = FOOTBALL_DATA_KEY
    
    def fetch_all_sources(self) -> List[Dict]:
        """
        Try multiple APIs in order of preference
        """
        # Try API-Football first (best data quality)
        if self.api_football_key:
            logger.info("Trying API-Football...")
            matches = self.fetch_from_api_football()
            if matches:
                return matches
        # Try Football-Data.org
        if self.football_data_key:
            logger.info("Trying Football-Data.org...")
            matches = self.fetch_from_football_data()
            if matches:
                return matches
        
        # Try TheSportsDB (free, no key needed)
        logger.info("Trying TheSportsDB...")
        matches = self.fetch_from_thesportsdb()
        if matches:
            return matches
        
        # Fallback to mock data
        logger.warning("All APIs failed, using fallback data")
        return self.get_fallback_data()
    
    def fetch_from_api_football(self) -> List[Dict]:
        """
        Fetch from API-Football (RapidAPI)
        Sign up at: https://www.api-football.com/
        AFCON 2025 League ID: 6 (Africa Cup of Nations)
        """
        try:
            headers = {
                "x-rapidapi-key": self.api_football_key,
                "x-rapidapi-host": "v3.football.api-sports.io"
            }
            
            # Get current season (2025)
            url = "https://v3.football.api-sports.io/fixtures"
            params = {
                "league": 6,  # Africa Cup of Nations
                "season": 2025,
                "timezone": "Africa/Casablanca"
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("response"):
                    return self.parse_api_football_data(data["response"])
            else:
                logger.error(f"API-Football error: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error fetching from API-Football: {e}")
        
        return []
    
    def parse_api_football_data(self, fixtures) -> List[Dict]:
        """Parse API-Football response"""
        events = []
        now = datetime.now()
        
        for idx, fixture in enumerate(fixtures, 1):
            try:
                # Parse fixture datetime
                fixture_date = fixture["fixture"]["date"]
                event_datetime = datetime.fromisoformat(fixture_date.replace('Z', '+00:00'))
                
                # Only future matches
                if event_datetime.replace(tzinfo=None) >= now:
                    parsed_event = {
                        "id": idx,
                        "event": "can",
                        "teamA": fixture["teams"]["home"]["name"],
                        "teamB": fixture["teams"]["away"]["name"],
                        "date": event_datetime.strftime("%Y-%m-%dT%H:%M:%S"),
                        "availableSeats": 2,
                        "location": f"{fixture['fixture']['venue']['name']}, {fixture['fixture']['venue']['city']}",
                        "logoFrom": fixture["teams"]["home"]["logo"] or "http://127.0.0.1:8080/static/logo.png",
                        "logoTo": fixture["teams"]["away"]["logo"] or "http://127.0.0.1:8080/static/logo.png",
                        "status": fixture["fixture"]["status"]["short"]
                    }
                    events.append(parsed_event)
            
            except Exception as e:
                logger.error(f"Error parsing API-Football fixture: {e}")
                continue
        
        events.sort(key=lambda x: x['date'])
        logger.info(f"API-Football: Found {len(events)} matches")
        return events
    
    def fetch_from_football_data(self) -> List[Dict]:
        """
        Fetch from Football-Data.org
        Sign up at: https://www.football-data.org/
        Free tier: 10 requests per minute
        """
        try: 
            headers = {
                "X-Auth-Token": self.football_data_key
            }
            
            # AFCON competition code (check their docs for exact ID)
            url = "https://api.football-data.org/v4/competitions/CLI/matches"
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("matches"):
                    return self.parse_football_data(data["matches"])
            else:
                logger.error(f"Football-Data.org error: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error fetching from Football-Data.org: {e}")
        
        return []
    
    def parse_football_data(self, matches) -> List[Dict]:
        """Parse Football-Data.org response"""
        events = []
        now = datetime.now()
        
        for idx, match in enumerate(matches, 1):
            try:
                match_date = datetime.fromisoformat(match["utcDate"].replace('Z', ''))
                
                if match_date >= now:
                    parsed_event = {
                        "id": idx,
                        "event": "can",
                        "teamA": match["homeTeam"]["name"],
                        "teamB": match["awayTeam"]["name"],
                        "date": match_date.strftime("%Y-%m-%dT%H:%M:%S"),
                        "availableSeats": 2,
                        "location": match.get("venue", "Stadium, Morocco"),
                        "logoFrom": match["homeTeam"].get("crest", "http://127.0.0.1:8080/static/logo.png"),
                        "logoTo": match["awayTeam"].get("crest", "http://127.0.0.1:8080/static/logo.png"),
                        "status": match["status"]
                    }
                    events.append(parsed_event)
            
            except Exception as e:
                logger.error(f"Error parsing Football-Data match: {e}")
                continue
        
        events.sort(key=lambda x: x['date'])
        logger.info(f"Football-Data.org: Found {len(events)} matches")
        return events
    
    def fetch_from_thesportsdb(self) -> List[Dict]:
        """
        Fetch from TheSportsDB (free, no API key needed)
        """
        try:
            url = f"{self.thesportsdb_url}/eventsnextleague.php?id={self.league_id}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_thesportsdb_data(data)
        
        except Exception as e:
            logger.error(f"Error fetching from TheSportsDB: {e}")
        
        return []
    
    def parse_thesportsdb_data(self, data) -> List[Dict]:
        """Parse TheSportsDB data"""
        events = []
        
        if not data or 'events' not in data or not data['events']:
            return []
        
        now = datetime.now()
        
        for idx, event in enumerate(data['events'], 1):
            try:
                event_date_str = event.get('dateEvent', '')
                event_time_str = event.get('strTime', '00:00:00')
                
                if event_date_str: 
                    event_datetime = datetime.strptime(
                        f"{event_date_str} {event_time_str}",
                        "%Y-%m-%d %H:%M:%S"
                    )
                    
                    if event_datetime >= now:
                        parsed_event = {
                            "id": idx,
                            "event": "can",
                            "teamA": event.get('strHomeTeam', 'TBD'),
                            "teamB": event.get('strAwayTeam', 'TBD'),
                            "date": event_datetime.strftime("%Y-%m-%dT%H:%M:%S"),
                            "availableSeats": 2,
                            "location": self.format_location(event),
                            "logoFrom": event.get('strHomeTeamBadge') or "http://127.0.0.1:8080/static/logo.png",
                            "logoTo": event.get('strAwayTeamBadge') or "http://127.0.0.1:8080/static/logo.png"
                        }
                        events.append(parsed_event)
            
            except Exception as e:
                logger.error(f"Error parsing TheSportsDB event: {e}")
                continue
        
        events.sort(key=lambda x: x['date'])
        logger.info(f"TheSportsDB: Found {len(events)} matches")
        return events
    
    def format_location(self, event: Dict) -> str:
        """Format venue location"""
        venue = event.get('strVenue', '')
        city = event.get('strCity', '')
        country = event.get('strCountry', 'Morocco')
        
        if venue and city:
            return f"{venue}, {city}"
        elif venue:
            return f"{venue}, {country}"
        elif city:
            return f"{city}, {country}"
        else:
            return f"Stadium, {country}"
    
    def get_fallback_data(self) -> List[Dict]:
        """Fallback mock data"""
        today = datetime.now()
        
        return [
            {
                "id": 1,
                "event": "can",
                "teamA": "Morocco",
                "teamB": "Gabon",
                "date": (today + timedelta(days=1, hours=20)).strftime("%Y-%m-%dT%H:%M:%S"),
                "availableSeats": 2,
                "location": "Stade Mohammed V, Casablanca",
                "logoFrom": "http://127.0.0.1:8080/static/logo.png",
                "logoTo": "http://127.0.0.1:8080/static/logo.png"
            },
            {
                "id": 2,
                "event": "can",
                "teamA": "Egypt",
                "teamB": "Ghana",
                "date": (today + timedelta(days=2, hours=17)).strftime("%Y-%m-%dT%H:%M:%S"),
                "availableSeats": 2,
                "location": "Stade de Marrakech, Marrakech",
                "logoFrom": "http://127.0.0.1:8080/static/logo.png",
                "logoTo": "http://127.0.0.1:8080/static/logo.png"
            }
        ]


def dataTaker() -> List[Dict]:
    """Main function to fetch match data"""
    global matches_cache
    
    if matches_cache["last_updated"]:
        time_since_update = datetime.now() - matches_cache["last_updated"]
        if time_since_update < timedelta(hours=CACHE_DURATION_HOURS):
            logger.info("Returning cached data")
            return matches_cache["data"]
    
    logger.info("Fetching fresh match data...")
    fetcher = AFCONDataFetcher()
    matches = fetcher.fetch_all_sources()
    
    matches_cache["data"] = matches
    matches_cache["last_updated"] = datetime.now()
    
    return matches


async def auto_update_matches():
    """Background task to update matches"""
    while True: 
        try:
            logger.info("Auto-updating matches...")
            dataTaker()
            logger.info(f"Next update in {CACHE_DURATION_HOURS} hour(s)")
        except Exception as e:
            logger.error(f"Error in auto-update: {e}")
        
        await asyncio.sleep(CACHE_DURATION_HOURS * 3600)


@app.on_event("startup")
async def startup_event():
    """Initialize data on startup"""
    logger.info("Starting AFCON Match Server...")
    dataTaker()
    asyncio.create_task(auto_update_matches())
    logger.info("Server started successfully!")


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/api/matches")
def get_matches():
    """Get ALL upcoming AFCON matches"""
    matches = dataTaker()
    return matches


@app.get("/api/matches/refresh")
def refresh_matches():
    """Force refresh match data"""
    global matches_cache
    matches_cache["last_updated"] = None
    matches = dataTaker()
    
    return {
        "message": "Matches refreshed successfully",
        "count": len(matches),
        "data": matches
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "matches_count": len(matches_cache["data"]),
        "last_updated": matches_cache["last_updated"].isoformat() if matches_cache["last_updated"] else None,
        "cache_duration_hours": CACHE_DURATION_HOURS,
        "api_keys_configured": {
            "api_football": bool(API_FOOTBALL_KEY),
            "football_data": bool(FOOTBALL_DATA_KEY)
        }
    }


@app.get("/")
def root():
    """Root endpoint with API info"""
    return {
        "message": "AFCON 2025 Match API",
        "endpoints": {
            "matches": "/api/matches",
            "refresh": "/api/matches/refresh",
            "health": "/api/health",
            "auth": {
                "register": "/api/auth/register",
                "login": "/api/auth/login",
                "profile": "/api/auth/profile"
            }
        },
        "data_sources": [
            "API-Football (if key provided)",
            "Football-Data.org (if key provided)",
            "TheSportsDB (free, no key)",
            "Fallback mock data"
        ],
        "setup": {
            "api_football": "Get free key at https://www.api-football.com/",
            "football_data": "Get free key at https://www.football-data.org/"
        }
    }


# ============================================
# Authentication Endpoints
# ============================================


# the auth for user rotes login  http://localhost:8080/api/auth/login

# for the regester    http://localhost:8080/api/auth/register

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    return register_user(user_data, db)


@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    return login_user(user_data, db)


@app.get("/api/auth/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile (requires authentication)"""
    return get_user_profile(current_user)


@app.get("/api/auth/verify")
def verify_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid"""
    return {
        "valid": True,
        "username": current_user.username,
        "email": current_user.email
    }

@app.put("/api/auth/profile")
def update_profile(update_data: UserUpdate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user profile (requires authentication)"""
    return update_user_profile(current_user, update_data, db)


@app.delete("/api/auth/account")
def delete_account(password: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete user account (requires authentication and password confirmation)"""
    return delete_user_account(current_user, password, db)


# ============================================
# Google OAuth Endpoints
# ============================================

@app.get("/api/auth/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/api/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Google OAuth callback handler"""
    try:
        # Get the token from Google
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        email = user_info.get('email')
        name = user_info.get('name', email.split('@')[0])
        google_id = user_info.get('sub')
        
        if not email or not google_id:
            raise HTTPException(status_code=400, detail="Email or Google ID not provided")
        
        # Get or create user
        user = get_or_create_oauth_user(email, name, google_id, db)
        
        # Create access token
        token_response = create_token_from_oauth_user(user)
        
        # Redirect to frontend with token in URL
        from fastapi.responses import RedirectResponse
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/auth/callback?token={token_response.access_token}&username={token_response.username}&email={token_response.email}"
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?error={str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

