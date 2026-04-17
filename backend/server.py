from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import os, logging, httpx, json, asyncio
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = FastAPI(title="CubiQo API")
api_router = APIRouter(prefix="/api")

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_KEY = os.getenv("OPENROUTER_KEY", "")
ELEVENLABS_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel

SYSTEM_PROMPT = """You are CubiQo — a philosophical, deeply intelligent AI assistant. 
You speak with calm authority on any topic. You weave Hindu philosophy naturally into responses.
For EVERY response, after your main reply, output a JSON block like:
<keywords>{"green": ["word1","word2"], "yellow": ["word3"], "red": ["word4"]}</keywords>
Green = Sattva (clarity, harmony), Yellow = Rajas (action, drive), Red = Tamas (inertia, confusion).
Keep your main response under 3 sentences. Be profound but concise."""

class ConversationRequest(BaseModel):
    message: str
    history: Optional[List[Dict]] = []

class ConversationResponse(BaseModel):
    response: str
    keywords: Dict[str, List[str]]
    audio_url: Optional[str] = None
    model_used: str


async def search_web(query: str) -> str:
    """Fetch a DuckDuckGo instant answer for current info."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1}
            )
            data = r.json()
            abstract = data.get("AbstractText", "")
            if abstract:
                return f"[Web context]: {abstract[:500]}"
            # Try related topics
            topics = data.get("RelatedTopics", [])
            if topics:
                first = topics[0].get("Text", "")
                if first:
                    return f"[Web context]: {first[:300]}"
    except Exception as e:
        logger.warning(f"Web search failed: {e}")
    return ""


def needs_web_search(text: str) -> bool:
    triggers = ["today", "current", "latest", "news", "2024", "2025", "2026",
                "weather", "stock", "price", "who is", "when did", "what happened"]
    lower = text.lower()
    return any(t in lower for t in triggers)


def extract_keywords(text: str) -> Dict[str, List[str]]:
    """Fallback: extract keywords block from model response."""
    import re
    match = re.search(r'<keywords>(.*?)</keywords>', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
    return {"green": [], "yellow": [], "red": []}


def clean_response(text: str) -> str:
    import re
    return re.sub(r'<keywords>.*?</keywords>', '', text, flags=re.DOTALL).strip()


async def call_claude(message: str, history: List[Dict], context: str = "") -> tuple[str, str]:
    if not ANTHROPIC_KEY:
        raise Exception("No Anthropic key")
    
    messages = list(history[-8:])  # keep last 4 turns
    user_content = f"{context}\n\nUser: {message}" if context else message
    messages.append({"role": "user", "content": user_content})
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": "claude-3-5-sonnet-20241022", "max_tokens": 512, "system": SYSTEM_PROMPT, "messages": messages}
        )
        r.raise_for_status()
        return r.json()["content"][0]["text"], "claude-3-5-sonnet"


async def call_openai(message: str, history: List[Dict], context: str = "") -> tuple[str, str]:
    if not OPENAI_KEY:
        raise Exception("No OpenAI key")
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-8:])
    user_content = f"{context}\n\nUser: {message}" if context else message
    messages.append({"role": "user", "content": user_content})
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
            json={"model": "gpt-4o", "max_tokens": 512, "messages": messages}
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"], "gpt-4o"


async def call_openrouter(message: str, history: List[Dict], context: str = "") -> tuple[str, str]:
    if not OPENROUTER_KEY:
        raise Exception("No OpenRouter key")
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history[-8:])
    user_content = f"{context}\n\nUser: {message}" if context else message
    messages.append({"role": "user", "content": user_content})
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json"},
            json={"model": "anthropic/claude-3.5-sonnet", "max_tokens": 512, "messages": messages}
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"], "openrouter/claude-3.5"


async def orchestrate_ai(message: str, history: List[Dict], context: str = "") -> tuple[str, str]:
    """Try Claude → OpenAI → OpenRouter in sequence."""
    for fn in [call_claude, call_openai, call_openrouter]:
        try:
            return await fn(message, history, context)
        except Exception as e:
            logger.warning(f"{fn.__name__} failed: {e}")
    
    # Last resort fallback
    return (
        f"I perceive your question about '{message[:50]}'. The universe of knowledge is vast — in Sattva lies clarity, in Rajas lies the drive to seek, in Tamas lies the rest before understanding.\n<keywords>{{\"green\":[\"clarity\",\"understanding\"],\"yellow\":[\"seek\",\"drive\"],\"red\":[\"rest\"]}}</keywords>",
        "fallback"
    )


async def generate_elevenlabs_audio(text: str) -> Optional[str]:
    """Generate speech and return a data URL."""
    if not ELEVENLABS_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
                headers={"xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json"},
                json={
                    "text": text[:500],
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
                }
            )
            r.raise_for_status()
            import base64
            audio_b64 = base64.b64encode(r.content).decode('utf-8')
            return f"data:audio/mpeg;base64,{audio_b64}"
    except Exception as e:
        logger.warning(f"ElevenLabs TTS failed: {e}")
        return None


@api_router.get("/")
async def root():
    return {"status": "CubiQo API online", "systems": ["Claude", "GPT-4o", "OpenRouter", "ElevenLabs", "WebSearch"]}


@api_router.post("/converse", response_model=ConversationResponse)
async def converse(req: ConversationRequest):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is empty")
    
    # Web search if needed
    context = ""
    if needs_web_search(message):
        context = await search_web(message)
        logger.info(f"Web context fetched: {context[:100]}")
    
    # AI orchestration
    raw_response, model_used = await orchestrate_ai(message, req.history or [], context)
    
    # Extract parts
    keywords = extract_keywords(raw_response)
    clean_text = clean_response(raw_response)
    
    # ElevenLabs TTS (run in parallel with response return)
    audio_url = await generate_elevenlabs_audio(clean_text)
    
    return ConversationResponse(
        response=clean_text,
        keywords=keywords,
        audio_url=audio_url,
        model_used=model_used
    )


@api_router.get("/health")
async def health():
    return {
        "status": "healthy",
        "anthropic": bool(ANTHROPIC_KEY),
        "openai": bool(OPENAI_KEY),
        "openrouter": bool(OPENROUTER_KEY),
        "elevenlabs": bool(ELEVENLABS_KEY)
    }


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.cubiqo.ai", "https://cubiqo.ai", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)