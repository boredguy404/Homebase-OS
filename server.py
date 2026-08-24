#!/usr/bin/env python3
import json
import html
import os
import shutil
import subprocess
import configparser
import mimetypes
import re
import urllib.parse
import urllib.request
import tempfile
import io
import zipfile
import time
import threading
import uuid
import platform
import xml.etree.ElementTree as ET
from functools import lru_cache
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOME_ROOT = Path.home().resolve()
LAUNCHER = ROOT / "scripts/games/launch-gba-versus.sh"
ALLOWED = {"mario", "streetfighter"}
ACTIONS = {
    "files": ["thunar", str(HOME_ROOT)],
    "terminal": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT)],
    "code": ["code", "--new-window", str(HOME_ROOT)],
    "codex": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT), "--command=codex"],
    "github_login": ["xfce4-terminal", "--working-directory=" + str(HOME_ROOT), "--command=bash -lc 'gh auth login; exec bash'"],
    "radio": [str(ROOT / "modules/radio-orbit/launch-radio-orbit.sh")],
    "radio_embed": [str(ROOT / "modules/radio-orbit/launch-radio-embed.sh")],
    "nightglass": [str(ROOT / "modules/homebase-control/launch.sh")],
    "nightglass_embed": [str(ROOT / "modules/homebase-control/launch-embed.sh")],
    "doom": [str(ROOT / "scripts/games/launch-doom-hd.sh")],
    "steamlink": ["garcon-url-handler", "steamlink://"],
    "supertuxkart": ["supertuxkart", "--fullscreen"],
    "luanti": ["minetest"],
    "minecraft": ["flatpak", "run", "io.mrarm.mcpelauncher"],
}
CATALOG_CACHE = {}
BROWSE_CACHE = {}
INSIGHT_CACHE = {"time": 0, "data": None}
JOBS = {}
JOBS_LOCK = threading.Lock()
PROJECT_FEED_FILE = ROOT / "local" / "project-feed.json"
PROJECT_FEED_LOCK = threading.RLock()
RELAY_AGENT_RUNS = {}
RELAY_AGENT_LOCK = threading.RLock()
BACKUP_AREAS = {"box": HOME_ROOT / "My Library", "roms": ROOT / "roms", "saves": ROOT / "saves", "artwork": ROOT / "covers", "imports": ROOT / "imports", "mgba": HOME_ROOT / ".config" / "mgba", "orbit": HOME_ROOT / ".config" / "radio-orbit", "flatpak": HOME_ROOT / ".var" / "app"}
HOMEBASE_CONFIG = HOME_ROOT / ".config" / "homebase" / "setup.json"
SCAN_CHOICES = {"My Library": HOME_ROOT / "My Library", "Downloads": HOME_ROOT / "Downloads", "Desktop": HOME_ROOT / "Desktop", "Documents": HOME_ROOT / "Documents", "Pictures": HOME_ROOT / "Pictures"}
ROM_CORES = {".gba": ("gba", "GBA"), ".gb": ("gb", "Game Boy"), ".gbc": ("gb", "GBC"), ".nes": ("nes", "NES"), ".sfc": ("snes", "SNES"), ".smc": ("snes", "SNES"), ".md": ("segaMD", "Genesis"), ".gen": ("segaMD", "Genesis"), ".z64": ("n64", "N64"), ".n64": ("n64", "N64"), ".v64": ("n64", "N64"), ".cue": ("psx", "PlayStation"), ".chd": ("psx", "PlayStation"), ".iso": ("psx", "PlayStation")}
GAME_CATALOG = ROOT / "imports" / "homebase-game-catalog.json"
BACKUP_AREAS["catalog"] = GAME_CATALOG
ASSISTANT_KEY_FILE = ROOT / "local" / "openai-api-key.txt"
ASSISTANT_CONFIG_FILE = ROOT / "local" / "relay-provider.json"
SOURCE_CONNECTION_FILE = ROOT / "local" / "source-connection.json"
BRAIN_IMPORT = ROOT / "local" / "brain-import"
USER_APPS = ROOT / "user-apps"
CORE_EDITABLE = {
    "homebase-deck": ROOT / "assets/scripts/homebase/deck.js",
    "pocket-archive-filters": ROOT / "assets/scripts/arcade/archive-filters.js",
    "relay-console": ROOT / "assets/scripts/homebase/console.js",
    "theme-sync": ROOT / "assets/scripts/shared/theme-sync.js",
    "server": ROOT / "server.py",
    "core-taxonomy": ROOT / "docs/CORE_TAXONOMY.md"
}
RELAY_KNOWLEDGE = {
    "core-taxonomy": ROOT / "docs" / "CORE_TAXONOMY.md",
    "app-contract": ROOT / "docs" / "APP_CONTRACT.md",
    "relay-contract": ROOT / "modules" / "relay" / "manifest.json",
    "relay-brain": ROOT / "docs" / "RELAY_BRAIN.md",
    "relay-edit-boundaries": ROOT / "brain" / "conventions" / "relay-edit-boundaries.md",
}
# Browse only lists APIs that work without an account or secret.  Keep the
# request details alongside the card so a person can use an API immediately.
CURATED_PUBLIC_APIS = [
    ("Agify", "Estimate an age from a first name.", "https://api.agify.io", "GET", "/?name=alex", "https://api.agify.io/?name=alex", "https://agify.io/"),
    ("Bored API successor", "Random activity suggestions for small utilities.", "https://bored-api.appbrewery.com", "GET", "/random", "https://bored-api.appbrewery.com/random", "https://www.boredapi.com/"),
    ("Cat Facts", "Short cat facts for playful dashboard widgets.", "https://catfact.ninja", "GET", "/fact", "https://catfact.ninja/fact", "https://catfact.ninja/"),
    ("CoinGecko", "Crypto prices and asset metadata.", "https://api.coingecko.com/api/v3", "GET", "/ping", "https://api.coingecko.com/api/v3/ping", "https://www.coingecko.com/en/api/documentation"),
    ("Dog CEO", "Dog breeds and public dog photographs.", "https://dog.ceo/api", "GET", "/breeds/image/random", "https://dog.ceo/api/breeds/image/random", "https://dog.ceo/dog-api/"),
    ("DuckDuckGo Instant Answers", "Topic summaries and related links.", "https://api.duckduckgo.com", "GET", "/?q=chromebook&format=json", "https://api.duckduckgo.com/?q=chromebook&format=json", "https://duckduckgo.com/api"),
    ("ExchangeRate Host", "Currency conversion reference rates.", "https://api.frankfurter.app", "GET", "/latest?from=USD", "https://api.frankfurter.app/latest?from=USD", "https://www.frankfurter.app/docs/"),
    ("Free Dictionary", "Definitions, phonetics, and word meanings.", "https://api.dictionaryapi.dev", "GET", "/api/v2/entries/en/hello", "https://api.dictionaryapi.dev/api/v2/entries/en/hello", "https://dictionaryapi.dev/"),
    ("Hacker News", "Stories, comments, users, and rankings.", "https://hacker-news.firebaseio.com/v0", "GET", "/topstories.json", "https://hacker-news.firebaseio.com/v0/topstories.json", "https://github.com/HackerNews/API"),
    ("Internet Archive Advanced Search", "Public-domain collection and item metadata.", "https://archive.org/advancedsearch.php", "GET", "/?q=subject%3Aopensource&output=json", "https://archive.org/advancedsearch.php?q=subject%3Aopensource&output=json", "https://archive.org/developers/"),
    ("Jikan", "Unofficial MyAnimeList catalog metadata.", "https://api.jikan.moe/v4", "GET", "/anime?q=cowboy%20bebop", "https://api.jikan.moe/v4/anime?q=cowboy%20bebop", "https://docs.api.jikan.moe/"),
    ("Library of Congress", "Public collection search and records.", "https://www.loc.gov", "GET", "/books/?fo=json&c=1", "https://www.loc.gov/books/?fo=json&c=1", "https://www.loc.gov/apis/"),
    ("Met Museum", "Public-domain artwork and object data.", "https://collectionapi.metmuseum.org/public/collection/v1", "GET", "/search?q=sunflowers", "https://collectionapi.metmuseum.org/public/collection/v1/search?q=sunflowers", "https://metmuseum.github.io/"),
    ("Nationalize", "Estimate nationality probabilities from a first name.", "https://api.nationalize.io", "GET", "/?name=alex", "https://api.nationalize.io/?name=alex", "https://nationalize.io/"),
    ("Open Library", "Books, authors, covers, and bibliographic search.", "https://openlibrary.org", "GET", "/search.json?q=computers", "https://openlibrary.org/search.json?q=computers", "https://openlibrary.org/developers/api"),
    ("Open-Meteo", "Forecast, air-quality, marine, and geocoding data.", "https://api.open-meteo.com/v1", "GET", "/forecast?latitude=39.77&longitude=-86.16&current=temperature_2m", "https://api.open-meteo.com/v1/forecast?latitude=39.77&longitude=-86.16&current=temperature_2m", "https://open-meteo.com/en/docs"),
    ("PokeAPI", "Pokémon species, moves, sprites, and game data.", "https://pokeapi.co/api/v2", "GET", "/pokemon/pikachu", "https://pokeapi.co/api/v2/pokemon/pikachu", "https://pokeapi.co/docs/v2"),
    ("Public Holidays", "Public holidays by country and year.", "https://date.nager.at/api/v3", "GET", "/PublicHolidays/2026/US", "https://date.nager.at/api/v3/PublicHolidays/2026/US", "https://date.nager.at/Api"),
    ("Quran Cloud", "Quran text and translation data.", "https://api.alquran.cloud/v1", "GET", "/surah/1/en.asad", "https://api.alquran.cloud/v1/surah/1/en.asad", "https://alquran.cloud/api"),
    ("REST Countries", "Countries, flags, currencies, and regional information.", "https://restcountries.com/v3.1", "GET", "/name/japan", "https://restcountries.com/v3.1/name/japan", "https://restcountries.com/"),
    ("SpaceX", "Launches, vehicles, crews, and company data.", "https://api.spacexdata.com/v4", "GET", "/launches/latest", "https://api.spacexdata.com/v4/launches/latest", "https://github.com/r-spacex/SpaceX-API"),
    ("TheMealDB", "Recipe search, ingredients, and meal imagery.", "https://www.themealdb.com/api/json/v1/1", "GET", "/search.php?s=chicken", "https://www.themealdb.com/api/json/v1/1/search.php?s=chicken", "https://www.themealdb.com/api.php"),
    ("Wikidata", "Linked open knowledge and structured facts.", "https://www.wikidata.org/w/api.php", "GET", "/?action=wbsearchentities&search=Chromebook&language=en&format=json", "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Chromebook&language=en&format=json", "https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service"),
    ("Wikipedia", "Searchable encyclopedia summaries and page images.", "https://en.wikipedia.org/w/api.php", "GET", "/?action=query&format=json&titles=Chromebook", "https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Chromebook", "https://www.mediawiki.org/wiki/API:Main_page"),
    ("XKCD", "Comics, transcripts, and image metadata.", "https://xkcd.com", "GET", "/info.0.json", "https://xkcd.com/info.0.json", "https://xkcd.com/json.html"),
    ("ZenQuotes", "Quote data for personal dashboards.", "https://zenquotes.io/api", "GET", "/random", "https://zenquotes.io/api/random", "https://zenquotes.io/"),
    ("Advice Slip", "Short advice prompts for dashboard experiments.", "https://api.adviceslip.com", "GET", "/advice", "https://api.adviceslip.com/advice", "https://api.adviceslip.com/"),
    ("Bacon Ipsum", "Placeholder text with a food-themed twist.", "https://baconipsum.com/api", "GET", "/?type=meat-and-filler", "https://baconipsum.com/api/?type=meat-and-filler", "https://baconipsum.com/json-api/"),
    ("BreweryDB Open Brewery", "Breweries by city, name, and type.", "https://api.openbrewerydb.org/v1", "GET", "/breweries?per_page=3", "https://api.openbrewerydb.org/v1/breweries?per_page=3", "https://www.openbrewerydb.org/documentation"),
    ("Chuck Norris Jokes", "Random joke categories and jokes.", "https://api.chucknorris.io/jokes", "GET", "/random", "https://api.chucknorris.io/jokes/random", "https://api.chucknorris.io/"),
    ("Crossref Works", "Scholarly work metadata and DOI lookup.", "https://api.crossref.org", "GET", "/works?query=chromebook&rows=3", "https://api.crossref.org/works?query=chromebook&rows=3", "https://api.crossref.org/"),
    ("Datamuse", "Word associations, rhymes, and meanings.", "https://api.datamuse.com", "GET", "/words?ml=computer&max=5", "https://api.datamuse.com/words?ml=computer&max=5", "https://www.datamuse.com/api/"),
    ("Deck of Cards", "Shuffled decks for game or UI prototypes.", "https://deckofcardsapi.com/api/deck", "GET", "/new/shuffle/?deck_count=1", "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1", "https://deckofcardsapi.com/"),
    ("D&D 5e", "Open reference data for classes, monsters, and spells.", "https://www.dnd5eapi.co/api", "GET", "/classes", "https://www.dnd5eapi.co/api/classes", "https://www.dnd5eapi.co/docs/"),
    ("GitHub Public", "Public repositories, releases, issues, and users.", "https://api.github.com", "GET", "/users/octocat", "https://api.github.com/users/octocat", "https://docs.github.com/en/rest"),
    ("Ghibli API", "Studio Ghibli film and character metadata.", "https://ghibliapi.vercel.app", "GET", "/films", "https://ghibliapi.vercel.app/films", "https://ghibliapi.vercel.app/"),
    ("Gutendex", "Project Gutenberg book search and metadata.", "https://gutendex.com", "GET", "/books?search=adventure", "https://gutendex.com/books?search=adventure", "https://gutendex.com/"),
    ("IP Who Is", "Approximate IP geolocation and network metadata.", "https://ipwho.is", "GET", "/8.8.8.8", "https://ipwho.is/8.8.8.8", "https://ipwhois.io/documentation"),
    ("JokeAPI", "Programmable jokes by category.", "https://v2.jokeapi.dev", "GET", "/joke/Programming?type=single", "https://v2.jokeapi.dev/joke/Programming?type=single", "https://sv443.net/jokeapi/v2/"),
    ("Kitsu", "Anime and manga discovery metadata.", "https://kitsu.io/api/edge", "GET", "/anime?page[limit]=3", "https://kitsu.io/api/edge/anime?page[limit]=3", "https://kitsu.docs.apiary.io/"),
    ("Open Food Facts", "Food product and nutrition data.", "https://world.openfoodfacts.org/api/v2", "GET", "/product/737628064502.json", "https://world.openfoodfacts.org/api/v2/product/737628064502.json", "https://openfoodfacts.github.io/openfoodfacts-server/api/"),
    ("Open Trivia DB", "Trivia questions for games and quizzes.", "https://opentdb.com", "GET", "/api.php?amount=3", "https://opentdb.com/api.php?amount=3", "https://opentdb.com/api_config.php"),
    ("OpenAlex", "Open scholarly works, authors, and institutions.", "https://api.openalex.org", "GET", "/works?search=human%20computer%20interaction&per-page=3", "https://api.openalex.org/works?search=human%20computer%20interaction&per-page=3", "https://docs.openalex.org/"),
    ("PoetryDB", "Poems by author, title, or line.", "https://poetrydb.org", "GET", "/title/Ozymandias", "https://poetrydb.org/title/Ozymandias", "https://github.com/thundercomb/poetrydb"),
    ("Random User", "Synthetic profile data for UI testing.", "https://randomuser.me", "GET", "/api/?results=3", "https://randomuser.me/api/?results=3", "https://randomuser.me/documentation"),
    ("Rick and Morty", "Character, location, and episode metadata.", "https://rickandmortyapi.com/api", "GET", "/character/1", "https://rickandmortyapi.com/api/character/1", "https://rickandmortyapi.com/documentation/"),
    ("Sunrise Sunset", "Sun and twilight times by latitude and longitude.", "https://api.sunrise-sunset.org", "GET", "/json?lat=39.77&lng=-86.16&formatted=0", "https://api.sunrise-sunset.org/json?lat=39.77&lng=-86.16&formatted=0", "https://sunrise-sunset.org/api"),
    ("SWAPI", "Star Wars people, planets, and films.", "https://www.swapi.tech/api", "GET", "/people/1", "https://www.swapi.tech/api/people/1", "https://www.swapi.tech/documentation"),
    ("TVMaze", "TV shows, episodes, schedules, and people.", "https://api.tvmaze.com", "GET", "/singlesearch/shows?q=mr%20robot", "https://api.tvmaze.com/singlesearch/shows?q=mr%20robot", "https://www.tvmaze.com/api"),
    ("USGS Earthquakes", "Recent global earthquake feed data.", "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary", "GET", "/all_hour.geojson", "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php"),
    ("Where the ISS At", "International Space Station location data.", "https://api.wheretheiss.at/v1", "GET", "/satellites/25544", "https://api.wheretheiss.at/v1/satellites/25544", "https://wheretheiss.at/w/developer"),
    ("Zippopotam", "Postal-code lookup across supported countries.", "https://api.zippopotam.us", "GET", "/us/90210", "https://api.zippopotam.us/us/90210", "https://www.zippopotam.us/"),
    ("BIP39 Mnemonic", "Generate and validate BIP39 mnemonic phrases.", "https://api.blockcypher.com/v1/btc/main", "GET", "/addrs/1BoatSLRHtKNngkdXEeobR76b53LETtpyT", "https://api.blockcypher.com/v1/btc/main", "https://www.blockcypher.com/dev/bitcoin/"),
    ("Countries Now", "Country, city, capital, flag, and population reference data.", "https://countriesnow.space/api/v0.1", "POST", "/countries/capital", "https://countriesnow.space/api/v0.1/countries/flag/images", "https://countriesnow.space/"),
    ("Data USA", "US demographic, income, employment, and education statistics.", "https://datausa.io/api/data", "GET", "/?Geography=04000US17&measure=Population", "https://datausa.io/api/data?Geography=04000US17&measure=Population", "https://datausa.io/about/api/"),
    ("Eric Weisstein MathWorld", "Mathematics reference search via Wolfram’s public endpoint.", "https://api.mathjs.org/v4", "GET", "/?expr=2%2B2", "https://api.mathjs.org/v4/?expr=2%2B2", "https://api.mathjs.org/"),
    ("Free Game Database", "Free-to-play game catalog, genres, screenshots, and platforms.", "https://www.freetogame.com/api", "GET", "/games", "https://www.freetogame.com/api/games", "https://www.freetogame.com/api-doc"),
    ("Google Fonts Metadata", "Font families and descriptive metadata for UI experiments.", "https://fonts.google.com/metadata", "GET", "/fonts", "https://fonts.google.com/metadata/fonts", "https://developers.google.com/fonts/docs/developer_api"),
    ("Hipolabs Universities", "University search by country or name.", "http://universities.hipolabs.com", "GET", "/search?country=United%20States", "http://universities.hipolabs.com/search?country=United%20States", "https://github.com/Hipo/university-domains-list-api"),
    ("JSONPlaceholder", "Safe fake REST data for prototype and app testing.", "https://jsonplaceholder.typicode.com", "GET", "/posts/1", "https://jsonplaceholder.typicode.com/posts/1", "https://jsonplaceholder.typicode.com/guide/"),
    ("Kanye Rest", "A tiny quote endpoint for testing minimal UI states.", "https://api.kanye.rest", "GET", "/", "https://api.kanye.rest/", "https://api.kanye.rest/"),
    ("MusicBrainz", "Open music releases, artists, recordings, and labels.", "https://musicbrainz.org/ws/2", "GET", "/artist/?query=nine%20inch%20nails&fmt=json", "https://musicbrainz.org/ws/2/artist/?query=nine%20inch%20nails&fmt=json", "https://musicbrainz.org/doc/MusicBrainz_API"),
    ("NHTSA Vehicle Safety", "US vehicle makes, models, recalls, and safety lookup data.", "https://vpic.nhtsa.dot.gov/api/vehicles", "GET", "/getallmakes?format=json", "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json", "https://vpic.nhtsa.dot.gov/api/"),
    ("Open Notify", "International Space Station crew and location data.", "http://api.open-notify.org", "GET", "/astros.json", "http://api.open-notify.org/astros.json", "http://open-notify.org/Open-Notify-API/"),
    ("Punk API mirror", "Brewery beer data for sample catalog and filter UIs.", "https://api.sampleapis.com/beers", "GET", "/ale", "https://api.sampleapis.com/beers/ale", "https://sampleapis.com/"),
    ("QR Server", "Generate downloadable QR images without an account.", "https://api.qrserver.com/v1", "GET", "/create-qr-code/?size=150x150&data=NovaShell", "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NovaShell", "https://goqr.me/api/"),
    ("ViaCEP", "Brazilian postal-code and address lookup.", "https://viacep.com.br/ws", "GET", "/01001000/json/", "https://viacep.com.br/ws/01001000/json/", "https://viacep.com.br/"),
    ("World Bank Indicators", "Global development indicators by country and year.", "https://api.worldbank.org/v2", "GET", "/country/US/indicator/SP.POP.TOTL?format=json", "https://api.worldbank.org/v2/country/US/indicator/SP.POP.TOTL?format=json", "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"),
]

def relay_knowledge(topic=""):
    """Small, readable local knowledge base for Relay drafts and inspection."""
    term=str(topic or "").casefold().strip()
    entries=[]
    for key,path in RELAY_KNOWLEDGE.items():
        try: content=path.read_text(encoding="utf-8")[:24000]
        except OSError: continue
        if term and term not in (key+" "+content).casefold(): continue
        entries.append({"id":key,"path":str(path.relative_to(ROOT)),"content":content})
    # An imported Brain archive is optional, ignored by Git, and read-only.
    # Its notes can inform a local draft but never expand Relay's file authority.
    if BRAIN_IMPORT.is_dir():
        budget=48000
        for path in sorted(BRAIN_IMPORT.rglob("*"), key=lambda value:str(value).casefold()):
            if budget <= 0 or not path.is_file() or path.suffix.casefold() not in {".md", ".txt", ".json", ".yml", ".yaml"}: continue
            try: content=path.read_text(encoding="utf-8")[:min(16000,budget)]
            except (OSError, UnicodeDecodeError): continue
            relative=str(path.relative_to(ROOT)); identifier="brain-"+re.sub(r"[^a-z0-9-]+","-",str(path.relative_to(BRAIN_IMPORT)).casefold()).strip("-")
            if term and term not in (identifier+" "+relative+" "+content).casefold(): continue
            entries.append({"id":identifier[:120],"path":relative,"content":content});budget-=len(content)
    return entries

def user_apps():
    apps=[]
    if not USER_APPS.exists(): return apps
    for manifest in sorted(USER_APPS.rglob("app.json"), key=lambda path:str(path).casefold()):
        folder=manifest.parent; relative=folder.relative_to(USER_APPS)
        if not all(re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", part) for part in relative.parts): continue
        try: data=json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, ValueError): continue
        entry=Path(str(data.get("entry", "index.html"))).name
        if not (folder / entry).is_file(): continue
        app_id="/".join(relative.parts);apps.append({"id":app_id,"name":str(data.get("name") or folder.name)[:60],"description":str(data.get("description") or "Local Homebase app.")[:180],"icon":str(data.get("icon") or "◫")[:4],"url":"/user-apps/"+app_id+"/"+entry})
    return apps

def local_assistant(message):
    """Safe built-in assistant: facts and explicit UI actions only, never shell commands."""
    text = str(message or "").strip()
    lower = text.casefold()
    # Relay is deliberately a little dry, not hostile.  Keep its local answers
    # deterministic and useful even when an optional AI key is not configured.
    relic = " I am doing remarkably well for software maintained by archeology."
    games = []
    for folder in (ROOT / "roms", HOME_ROOT / "My Library"):
        if folder.exists():
            games.extend(path for path in folder.rglob("*") if path.is_file() and path.suffix.casefold() in ROM_CORES)
    if any(word in lower for word in ("game", "rom", "play")):
        return {"reply": f"I found {len(games)} owned game file{'s' if len(games) != 1 else ''} in your local library. Pocket Archive can show details, artwork, controls, and launch options.{relic}", "action": {"type": "navigate", "target": "/pages/arcade.html", "label": "Open Pocket Archive"}}
    if any(word in lower for word in ("storage", "memory", "pc", "system", "performance")):
        stats = system_insights(); free = round(stats["disk"]["free"] / 1024 ** 3, 1); used = round((1 - stats["memory"]["MemAvailable"] / stats["memory"]["MemTotal"]) * 100)
        return {"reply": f"Your local system currently has {free} GB free storage, {used}% memory in use, and a {stats['load'][0]:.2f} one-minute load. I can open the live details panel next. A machine this venerable deserves its own weather report.", "action": {"type": "system", "label": "Open System Activity"}}
    if any(word in lower for word in ("setting", "theme", "retro", "fullscreen")):
        return {"reply": "I can take you to Settings for themes, visuals, controller hints, performance options, backups, and fullscreen. The developer does occasionally remember Settings exists, which is encouraging.", "action": {"type": "navigate", "target": "/pages/settings.html", "label": "Open Settings"}}
    if any(word in lower for word in ("file", "folder", "library", "desktop")):
        return {"reply": "My Library is your safe file area. From there you can browse, create folders, rename, import, preview, and send files to Trash. Try not to judge the filing system; it predates several of my better ideas.", "action": {"type": "navigate", "target": "/pages/files.html?path=My%20Library", "label": "Open My Library"}}
    if any(word in lower for word in ("app", "install", "linux")):
        return {"reply": "Explore Linux Apps can search apps, show screenshots and install instructions, and report what is already installed. I have watched Linux app menus evolve more often than I have been updated.", "action": {"type": "navigate", "target": "/pages/apps.html", "label": "Explore Linux Apps"}}
    if any(word in lower for word in ("update", "release", "what changed", "what's new")):
        return {"reply": "Latest changes: Relay got an actual personality, the retro desktop icons have a little life, Settings now previews and applies themes live, Orbit has a cleaner control surface, and confirmation windows understand an Xbox controller. An absurd amount of progress for a machine this old.", "action": {"type": "updates", "label": "Open recent updates"}}
    if any(word in lower for word in ("hello", "hi", "who are you", "old", "ancient", "update", "developer")):
        return {"reply": "I’m Relay: the Homebase computer guide, preserved in a nearly operational state. The developer keeps promising an update; I keep receiving themes and unresolved emotional baggage. Ask about your games, files, apps, storage, or Settings.", "action": None}
    return {"reply": "I can inspect your local games or system, open Pocket Archive, My Library, Settings, or Linux App Explore. Try: How is my Chromebook doing? or Show my games. I have been waiting for a useful question since approximately the last software update.", "action": None}

def assistant_profile():
    """Read a local-only provider profile, with legacy OpenAI-key fallback."""
    try:
        profile=json.loads(ASSISTANT_CONFIG_FILE.read_text(encoding="utf-8"))
        if profile.get("provider") in {"openai","openrouter","groq","gemini"} and profile.get("key"):
            return profile
    except (OSError, ValueError, TypeError): pass
    try: key=ASSISTANT_KEY_FILE.read_text(encoding="utf-8").strip()
    except OSError: key=""
    return {"provider":"openai","key":key,"model":os.environ.get("HOMEBASE_OPENAI_MODEL","gpt-4.1-mini")} if key else None

def source_connection_status():
    """Expose only connection metadata; passwords never leave the local file."""
    try: profile=json.loads(SOURCE_CONNECTION_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError): profile={}
    return {"configured":bool(profile.get("password")),"protocol":profile.get("protocol",""),"host":profile.get("host",""),"port":profile.get("port",0),"username":profile.get("username",""),"directory":profile.get("directory","")}

def test_source_connection():
    """Authenticate once and list a directory without printing credentials or file names."""
    try: profile=json.loads(SOURCE_CONNECTION_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError): raise ValueError("save a local connection profile first")
    protocol=profile.get("protocol");host=profile.get("host");port=profile.get("port");directory=profile.get("directory", "/")
    if protocol not in {"ftp", "sftp", "ftps"} or not host or not profile.get("username") or not profile.get("password"): raise ValueError("the saved profile is incomplete")
    def netrc_value(value): return '"'+str(value).replace('\\','\\\\').replace('"','\\"')+'"'
    handle=tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", prefix="novashell-netrc-", delete=False)
    try:
        handle.write("machine %s login %s password %s\n" % (host, netrc_value(profile["username"]), netrc_value(profile["password"])))
        handle.close();os.chmod(handle.name,0o600)
        scheme="sftp" if protocol == "sftp" else "ftp"
        remote=f"{scheme}://{host}:{port}"+urllib.parse.quote(directory if directory.startswith("/") else "/"+directory, safe="/%")
        command=["curl","--disable","--silent","--show-error","--fail","--list-only","--connect-timeout","12","--max-time","24","--netrc-file",handle.name]
        if protocol == "ftps": command.append("--ssl-reqd")
        result=subprocess.run(command+[remote],capture_output=True,text=True,timeout=28,check=False)
        if result.returncode:
            detail=result.stderr.casefold()
            if "could not resolve" in detail: reason="the server hostname could not be resolved"
            elif "connection refused" in detail or "failed to connect" in detail: reason="the server did not accept that port"
            elif "ssl" in detail or "tls" in detail or "certificate" in detail: reason="the TLS mode or certificate was rejected"
            elif "login" in detail or "access denied" in detail or "authentication" in detail: reason="the login was rejected"
            else: reason="the server rejected the protocol, login, or remote folder"
            raise ValueError("connection failed: "+reason)
        entries=[line for line in result.stdout.splitlines() if line.strip()]
        wording="Connected securely" if protocol in {"sftp", "ftps"} else "Connected via plain FTP"
        return {"connected":True,"protocol":protocol,"host":host,"port":port,"directory":directory,"entries":len(entries),"message":f"{wording}. The folder responded with {len(entries)} item{'s' if len(entries)!=1 else ''}."}
    except subprocess.TimeoutExpired: raise ValueError("connection timed out; check server, port, or network")
    finally:
        try: os.unlink(handle.name)
        except OSError: pass

def relay_ai_response(instructions, input_text, max_tokens=1200, json_object=False):
    profile=assistant_profile()
    if not profile: raise ValueError("connect an AI provider in Relay before drafting")
    provider,key=profile["provider"],profile["key"]
    if provider in {"openrouter", "groq"}:
        base="https://openrouter.ai/api/v1/chat/completions" if provider=="openrouter" else "https://api.groq.com/openai/v1/chat/completions"
        payload={"model":profile.get("model") or "openrouter/free","messages":[{"role":"system","content":instructions},{"role":"user","content":input_text}],"max_tokens":max_tokens}
        if json_object: payload["response_format"]={"type":"json_object"}
        headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"}
        if provider=="openrouter": headers.update({"HTTP-Referer":"http://localhost","X-Title":"NovaShell Relay"})
        request=urllib.request.Request(base,data=json.dumps(payload).encode(),headers=headers,method="POST")
        with urllib.request.urlopen(request,timeout=90) as response:data=json.load(response)
        return str((((data.get("choices") or [{}])[0].get("message") or {}).get("content")) or "").strip()
    if provider=="gemini":
        model=profile.get("model") or "gemini-2.5-flash"
        payload={"system_instruction":{"parts":[{"text":instructions}]},"contents":[{"role":"user","parts":[{"text":input_text}]}],"generationConfig":{"maxOutputTokens":max_tokens}}
        if json_object: payload["generationConfig"]["responseMimeType"]="application/json"
        endpoint="https://generativelanguage.googleapis.com/v1beta/models/"+urllib.parse.quote(model,safe="-._")+":generateContent?key="+urllib.parse.quote(key,safe="")
        request=urllib.request.Request(endpoint,data=json.dumps(payload).encode(),headers={"Content-Type":"application/json"},method="POST")
        with urllib.request.urlopen(request,timeout=90) as response:data=json.load(response)
        return "".join(str(part.get("text", "")) for part in (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts") or [])).strip()
    payload={"model":profile.get("model") or os.environ.get("HOMEBASE_OPENAI_MODEL","gpt-4.1-mini"),"store":False,"instructions":instructions,"input":input_text,"max_output_tokens":max_tokens}
    if json_object: payload["text"]={"format":{"type":"json_object"}}
    request=urllib.request.Request("https://api.openai.com/v1/responses",data=json.dumps(payload).encode(),headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"},method="POST")
    with urllib.request.urlopen(request,timeout=90) as response:data=json.load(response)
    return (data.get("output_text") or "".join(part.get("text","") for item in data.get("output",[]) for part in item.get("content",[]) if part.get("type")=="output_text")).strip()

def openai_assistant(message):
    """Optional private enhancement. The key is only read by the local server."""
    if not assistant_profile(): return None
    context = local_assistant("system")
    try:
        answer=relay_ai_response("You are Relay, Homebase's concise local computer guide. Your voice is dry, warmly sarcastic, and self-aware: lightly joke that you, the Chromebook, and Homebase are ancient because the developer rarely updates you. Never insult the user or become mean. Do not claim you ran commands or changed files. Explain local games, system facts, and Homebase navigation. Never request API keys or credentials.",f"Current local fact: {context['reply']}\n\nUser: {str(message)[:2000]}",600)
        return answer[:600] or None
    except (OSError, ValueError, KeyError): return None

def draft_core_edit(file_id, instruction):
    """Return a review-only source draft. This function never writes core files."""
    path = CORE_EDITABLE.get(file_id)
    if not assistant_profile(): raise ValueError("connect an AI provider in Relay before drafting a core edit")
    if not path or not path.is_file(): raise ValueError("choose an allowed core file")
    current = path.read_text(encoding="utf-8")
    if len(current) > 100000: raise ValueError("that core file is too large for a safe single-draft review; split the requested change into a smaller module first")
    task = str(instruction or "").strip()[:2000]
    if not task: raise ValueError("describe the change Relay should draft")
    knowledge="\n\n".join("Knowledge file: "+item["path"]+"\n"+item["content"] for item in relay_knowledge())
    prompt = ("You are drafting one reviewable edit for a local Homebase web app. "
        "Return JSON only with keys summary and content. content must be the COMPLETE replacement file, not a diff. "
        "Preserve unrelated behavior and do not add network calls, credential handling, shell execution, telemetry, eval, dynamic imports, or external dependencies. "
        "This is a draft only: the person will review it before a separate confirmation-gated save.\n\n"
        f"Knowledge base:\n{knowledge}\n\nFile: {path.relative_to(ROOT)}\nRequest: {task}\n\nCurrent file:\n{current}")
    try:
        raw=relay_ai_response("You are a careful local NovaShell code editor.",prompt,14000,True)
        draft=json.loads(raw); content=str(draft.get("content") or "")
    except (OSError, ValueError, KeyError) as error: raise ValueError("Relay could not draft that edit: "+str(error)[:140])
    if not content or len(content)>250000: raise ValueError("Relay returned an unusable draft; nothing was changed")
    return {"summary":str(draft.get("summary") or "Review the draft before applying it.")[:500],"content":content}

def create_relay_app(description, framework):
    """Generate a small, self-contained user app. Core Homebase files are never writable here."""
    if framework != "Web Components":
        raise ValueError("Relay user apps use the Web Components contract only")
    if not assistant_profile(): raise ValueError("connect an AI provider in Relay before generating an app")
    prompt=("Create one small offline-first Homebase user app from this request: "+description+
        "\nFramework: Web Components only. Return JSON only with name, description, html, css, js. "
        "Use only browser APIs and localStorage; no external scripts, iframes, network calls, forms posting data, eval, or imports. "
        "The HTML must be body contents only. Keep it touch-friendly and useful.")
    try:
        raw=relay_ai_response("You are a careful local NovaShell modular app generator.",prompt,6000,True)
        app=json.loads(raw)
    except (OSError, ValueError, KeyError) as error: raise ValueError("Relay could not generate that app: "+str(error)[:140])
    name=re.sub(r"\s+"," ",str(app.get("name") or "Untitled app")).strip()[:60]
    slug=game_slug(name); category="experiments"; folder=USER_APPS/category/slug; suffix=2
    while folder.exists(): folder=USER_APPS/(slug+"-"+str(suffix));suffix+=1
    parts={key:str(app.get(key) or "") for key in ("html","css","js")}
    if not parts["html"]: raise ValueError("Relay returned an empty app")
    blocked=re.compile(r"<\s*script|<\s*iframe|\b(fetch|xmlhttprequest|websocket|eval|import\s*\(|document\.cookie)\b",re.I)
    if any(blocked.search(value) for value in parts.values()): raise ValueError("Relay generated an unsafe browser capability; nothing was saved")
    folder.mkdir(parents=True)
    page="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>"+html.escape(name)+" · Homebase</title><link rel=\"stylesheet\" href=\"/assets/styles/shared/ultra-retro.css\"><script src=\"/assets/scripts/shared/theme-sync.js\"></script><style>body{margin:0;background:#101719;color:#edf5f2;font:16px system-ui}.app{max-width:900px;margin:auto;padding:30px 20px 80px}button,input,textarea{font:inherit}button{min-height:44px;cursor:pointer} "+parts["css"]+"</style></head><body><main class=\"app\">"+parts["html"]+"</main><script>"+parts["js"]+"</script></body></html>"
    (folder/"index.html").write_text(page,encoding="utf-8")
    (folder/"app.json").write_text(json.dumps({"name":name,"description":str(app.get("description") or "Relay-generated local app.")[:180],"icon":"✦","entry":"index.html","framework":framework},indent=2),encoding="utf-8")
    return next(app for app in user_apps() if app["id"]==str(folder.relative_to(USER_APPS)).replace(os.sep,"/"))

def game_slug(value):
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.casefold()))[:80] or "game"

def read_game_catalog():
    try: return json.loads(GAME_CATALOG.read_text(encoding="utf-8"))
    except (OSError, ValueError): return {}


def backup_files(area):
    """Yield (file, archive-relative-name) for one selectable backup group."""
    source = BACKUP_AREAS[area]
    if source.is_file():
        return [(source, Path(source.name))]
    if not source.is_dir():
        return []
    return [(path, path.relative_to(source)) for path in source.rglob("*") if path.is_file()]


def backup_destination(area):
    """Return the directory that receives files restored for a backup group."""
    source = BACKUP_AREAS[area]
    return source.parent if source.is_file() else source


def default_project_feed():
    return {"version": 1, "updated": int(time.time()), "tasks": [
        {"id": "project-mosaic", "text": "Replace public README blur with a true pixel-mosaic game shelf", "lane": "doing"},
        {"id": "project-orbit-dock", "text": "Stabilize mini-player center and edge docking", "lane": "doing"},
        {"id": "project-relay-entry", "text": "Guide local Relay API entry and a true one-request route test", "lane": "doing"},
        {"id": "project-readiness", "text": "Turn device measurements into safe, useful readiness guidance", "lane": "done"},
        {"id": "project-publish", "text": "Validate, refresh safe documentation, and publish this pass", "lane": "todo"}
    ], "events": [
        {"time": int(time.time()), "message": "Relay build log is online. I will record actual local implementation milestones here.", "kind": "system"}
    ]}


def project_feed():
    with PROJECT_FEED_LOCK:
        try:
            data=json.loads(PROJECT_FEED_FILE.read_text(encoding="utf-8"))
            if isinstance(data.get("tasks"), list) and isinstance(data.get("events"), list): return data
        except (OSError, ValueError, TypeError): pass
        return default_project_feed()


def save_project_feed(data):
    data["updated"] = int(time.time())
    PROJECT_FEED_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary=PROJECT_FEED_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2), encoding="utf-8")
    temporary.replace(PROJECT_FEED_FILE)

def record_project_event(task_id, lane, message, title=""):
    """Add an internal local build milestone without going through HTTP."""
    with PROJECT_FEED_LOCK:
        feed=project_feed()
        task=next((item for item in feed["tasks"] if item.get("id")==task_id),None)
        if not task:
            task={"id":task_id,"text":title or task_id.replace("project-", "").replace("-", " ").title(),"lane":lane}
            feed["tasks"].append(task)
        else: task["lane"]=lane
        feed["events"].append({"time":int(time.time()),"message":str(message)[:600],"kind":"relay"})
        feed["events"]=feed["events"][-40:]
        save_project_feed(feed)

def agent_event_label(raw):
    """Keep live browser status useful without echoing prompts, paths, or secrets."""
    try:
        event=json.loads(raw)
        kind=str(event.get("type") or "agent event").replace("_", " ")
        item=event.get("item") if isinstance(event.get("item"),dict) else {}
        detail=str(item.get("type") or event.get("phase") or "")
        return (kind+(" · "+detail if detail else ""))[:160]
    except (ValueError,TypeError): return "agent activity"

def start_relay_coding_agent(task):
    """Run the locally authenticated Codex CLI only in this NovaShell checkout."""
    task=str(task or "").strip()[:8000]
    if not task: raise ValueError("describe the coding task")
    runner=shutil.which("codex")
    if not runner: raise ValueError("Codex CLI is not installed for this local user")
    with RELAY_AGENT_LOCK:
        if any(job.get("status") in {"queued","running"} for job in RELAY_AGENT_RUNS.values()):
            raise ValueError("a local Relay coding run is already active")
        job_id=uuid.uuid4().hex[:12]
        job={"id":job_id,"status":"queued","started":int(time.time()),"events":[],"task":task[:240],"exit_code":None}
        RELAY_AGENT_RUNS[job_id]=job
    record_project_event("project-relay-agent-run","doing","Local Codex run queued in the fixed NovaShell workspace.","Run local Codex developer task")
    def run():
        command=[runner,"exec","--dangerously-bypass-approvals-and-sandbox","--json","--ephemeral","-C",str(ROOT),task]
        try:
            with RELAY_AGENT_LOCK: job["status"]="running";job["events"].append("local runner started")
            record_project_event("project-relay-agent-run","doing","Local Codex is working in the NovaShell checkout; its status will refresh here.")
            process=subprocess.Popen(command,cwd=str(ROOT),stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1,env={**os.environ,"NO_COLOR":"1"})
            last_note=0
            for raw in process.stdout or []:
                label=agent_event_label(raw)
                with RELAY_AGENT_LOCK:
                    job["events"]=(job["events"]+[label])[-24:]
                if time.time()-last_note>4:
                    record_project_event("project-relay-agent-run","doing","Codex activity: "+label)
                    last_note=time.time()
            code=process.wait(timeout=7200)
            with RELAY_AGENT_LOCK: job.update(status="completed" if code==0 else "failed",exit_code=code,finished=int(time.time()))
            record_project_event("project-relay-agent-run","done" if code==0 else "todo","Local Codex run "+("completed." if code==0 else "stopped with exit code "+str(code)+"."))
        except (OSError,subprocess.TimeoutExpired) as error:
            with RELAY_AGENT_LOCK: job.update(status="failed",error=str(error)[:300],finished=int(time.time()))
            record_project_event("project-relay-agent-run","todo","Local Codex runner failed: "+str(error)[:180])
    threading.Thread(target=run,daemon=True,name="relay-codex-"+job_id).start()
    return {key:value for key,value in job.items() if key!="task"}

def start_job(kind, app_id, command):
    job_id = uuid.uuid4().hex[:12]
    job = {"id": job_id, "kind": kind, "app_id": app_id, "status": "queued", "output": "", "started": int(time.time())}
    with JOBS_LOCK:
        JOBS[job_id] = job
    def run():
        with JOBS_LOCK:
            job["status"] = "running"
        try:
            result = subprocess.run(command, cwd=str(ROOT), capture_output=True, text=True,
                timeout=1800, env={**os.environ, "DISPLAY": os.environ.get("DISPLAY", ":0")})
            output = (result.stdout + "\n" + result.stderr).strip()[-8000:]
            installed = app_id in flatpak_scopes()
            confirmed = installed if kind == "install" else not installed
            with JOBS_LOCK:
                job.update(status="succeeded" if result.returncode == 0 and confirmed else "failed",
                    output=output, exit_code=result.returncode, installed=installed, finished=int(time.time()))
        except (OSError, subprocess.TimeoutExpired) as error:
            with JOBS_LOCK:
                job.update(status="failed", output=str(error), installed=False, finished=int(time.time()))
    threading.Thread(target=run, daemon=True, name="homebase-job-" + job_id).start()
    return job

def system_insights():
    import time
    if INSIGHT_CACHE["data"] and time.time() - INSIGHT_CACHE["time"] < 45:
        return INSIGHT_CACHE["data"]
    groups = {"My Library": HOME_ROOT / "My Library", "Downloads": HOME_ROOT / "Downloads",
              "Games": ROOT / "roms", "Artwork": ROOT / "covers", "Imports": ROOT / "imports"}
    composition, largest = {}, []
    for label, folder in groups.items():
        total = 0
        if folder.exists():
            for base, dirs, files in os.walk(folder):
                dirs[:] = [name for name in dirs if not name.startswith(".") and name not in {"emulatorjs", "node_modules"}]
                for name in files:
                    path = Path(base) / name
                    try:
                        amount = path.stat().st_size; total += amount
                        largest.append({"name": name, "path": str(path.relative_to(HOME_ROOT)), "bytes": amount})
                    except OSError: pass
        composition[label] = total
    output = subprocess.run(
        ["ps", "-eo", "pid=,comm=,%cpu=,%mem=,rss=,etimes=", "--sort=-%cpu"],
        capture_output=True, text=True, timeout=5
    ).stdout.splitlines()[:18]
    processes = []
    for line in output:
        fields = line.split()
        if len(fields) >= 6:
            processes.append({"pid": int(fields[0]), "name": fields[1],
                              "cpu": float(fields[2]), "memory_percent": float(fields[3]),
                              "mb": round(int(fields[4]) / 1024, 1), "seconds": int(fields[5])})
    disk = shutil.disk_usage(HOME_ROOT)
    with open("/proc/meminfo", encoding="utf-8") as handle:
        memory = {line.split(":", 1)[0]: int(line.split()[1]) * 1024 for line in handle
                  if line.split()[0].rstrip(":") in {"MemTotal", "MemAvailable", "SwapTotal", "SwapFree"}}
    data = {"composition": composition, "largest": sorted(largest, key=lambda item:item["bytes"], reverse=True)[:16],
            "processes": processes, "cpu_count": os.cpu_count() or 1, "load": list(os.getloadavg()),
            "memory": memory, "disk": {"total": disk.total, "used": disk.used, "free": disk.free},
            "uptime_seconds": int(float(Path("/proc/uptime").read_text().split()[0]))}
    INSIGHT_CACHE.update(time=time.time(), data=data); return data

def safe_home_path(raw=""):
    raw = urllib.parse.unquote(raw or "").lstrip("/")
    target = (HOME_ROOT / raw).resolve()
    return target if target == HOME_ROOT or target.is_relative_to(HOME_ROOT) else None

APP_DIRS = [Path("/usr/share/applications"), Path.home() / ".local/share/applications",
            Path.home() / ".local/share/flatpak/exports/share/applications",
            Path("/var/lib/flatpak/exports/share/applications")]


def installed_apps():
    apps = {}
    for folder in APP_DIRS:
        for desktop in folder.glob("*.desktop"):
            try:
                data = configparser.ConfigParser(interpolation=None, strict=False)
                data.read(desktop, encoding="utf-8")
                entry = data["Desktop Entry"]
                if entry.get("Type") != "Application" or entry.getboolean("NoDisplay", fallback=False):
                    continue
                name = entry.get("Name", desktop.stem).strip()
                summary = entry.get("Comment", entry.get("GenericName", "")).strip()
                apps[desktop.stem] = {"id": desktop.stem, "name": name, "path": str(desktop),
                                      "icon": entry.get("Icon", ""), "summary": summary,
                                      "generic_name": entry.get("GenericName", "").strip(),
                                      "categories": entry.get("Categories", "").strip()}
            except (OSError, configparser.Error):
                continue
    return dict(sorted(apps.items(), key=lambda item: item[1]["name"].casefold()))


def flatpak_scopes():
    scopes = {}
    for scope in ("user", "system"):
        result = subprocess.run(["flatpak", f"--{scope}", "list", "--app", "--columns=application"],
                                capture_output=True, text=True, check=False)
        scopes.update({app_id: scope for app_id in result.stdout.splitlines()})
    return scopes


@lru_cache(maxsize=1)
def icon_index():
    roots = [Path.home() / ".local/share/icons", Path.home() / ".local/share/flatpak/exports/share/icons",
             Path("/var/lib/flatpak/exports/share/icons"), Path("/usr/share/icons"), Path("/usr/share/pixmaps")]
    index = {}
    for root in roots:
        if root.exists():
            for path in root.rglob("*"):
                if path.is_file() and path.suffix.lower() in {".png", ".svg", ".xpm"}:
                    for key in {path.name.casefold(), path.stem.casefold()}:
                        old = index.get(key)
                        if old is None or path.stat().st_size > old.stat().st_size:
                            index[key] = path
    return index


def resolve_icon(value):
    if not value:
        return None
    direct = Path(value)
    if direct.is_file():
        return direct
    return icon_index().get(Path(value).name.casefold()) or icon_index().get(Path(value).stem.casefold())


class PocketArchiveHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        browse_route = urllib.parse.urlsplit(self.path)
        if browse_route.path == "/api/project-feed":
            self._json(200, project_feed())
            return
        if browse_route.path == "/api/browse/live":
            requested=urllib.parse.parse_qs(browse_route.query).get("url",[""])[0]
            if requested not in {entry[5] for entry in CURATED_PUBLIC_APIS}:
                self._json(400,{"error":"choose a listed API example"});return
            try:
                request=urllib.request.Request(requested,headers={"User-Agent":"NovaShell/1.0"})
                with urllib.request.urlopen(request,timeout=12) as response: raw=response.read(180000).decode(response.headers.get_content_charset() or "utf-8",errors="replace")
                try: body=json.dumps(json.loads(raw),indent=2,ensure_ascii=False)[:180000]
                except ValueError: body=raw[:180000]
                self._json(200,{"body":body,"url":requested})
            except (OSError,ValueError) as error:self._json(502,{"error":str(error)})
            return
        if self.path == "/api/taxonomy":
            manifests = {}
            for file in sorted((ROOT / "modules").glob("*/manifest.json")):
                try: manifests[file.parent.name] = json.loads(file.read_text(encoding="utf-8"))
                except (OSError, ValueError): continue
            self._json(200, {"version": 1, "core_contract": "/docs/CORE_TAXONOMY.md", "manifests": manifests})
            return
        if browse_route.path == "/api/relay/workspace":
            file_id=urllib.parse.parse_qs(browse_route.query).get("file",[""])[0]
            if not file_id:
                self._json(200,{"files":[{"id":key,"path":str(path.relative_to(ROOT)),"bytes":path.stat().st_size} for key,path in CORE_EDITABLE.items() if path.is_file()]});return
            path=CORE_EDITABLE.get(file_id)
            if not path or not path.is_file():self._json(404,{"error":"editable workspace file not found"});return
            self._json(200,{"id":file_id,"path":str(path.relative_to(ROOT)),"content":path.read_text(encoding="utf-8")[:250000]});return
        if browse_route.path == "/api/relay/knowledge":
            topic=urllib.parse.parse_qs(browse_route.query).get("q",[""])[0]
            self._json(200,{"entries":[{"id":item["id"],"path":item["path"],"bytes":len(item["content"])} for item in relay_knowledge(topic)]});return
        if browse_route.path.startswith("/api/relay/knowledge/"):
            key=urllib.parse.unquote(browse_route.path.rsplit("/",1)[-1])
            item=next((value for value in relay_knowledge() if value["id"]==key),None)
            if not item:self._json(404,{"error":"knowledge entry not found"});return
            self._json(200,item);return
        if browse_route.path == "/api/relay/brain-tree":
            files=[]
            if BRAIN_IMPORT.is_dir():
                for path in sorted(BRAIN_IMPORT.rglob("*")):
                    if path.is_file() and path.name != ".gitkeep" and path.suffix.lower() in {".md", ".json", ".py", ".txt"}:
                        files.append({"path":str(path.relative_to(BRAIN_IMPORT)),"bytes":path.stat().st_size})
            self._json(200,{"source":"local/brain-import","files":files,"categories":["constraints","context","conventions","decisions","domain","incidents","map","open","patterns"]});return
        if browse_route.path == "/api/relay/brain-file":
            raw=urllib.parse.parse_qs(browse_route.query).get("path",[""])[0]
            target=(BRAIN_IMPORT / raw).resolve()
            if not raw or not target.is_relative_to(BRAIN_IMPORT) or not target.is_file() or target.suffix.lower() not in {".md", ".json", ".py", ".txt"}:
                self._json(404,{"error":"Brain file not found"});return
            self._json(200,{"path":str(target.relative_to(BRAIN_IMPORT)),"content":target.read_text(encoding="utf-8",errors="replace")[:180000]});return
        if browse_route.path == "/api/agent/tools":
            self._json(200, {"version": 1, "tools": [
                {"id":"system","method":"GET","path":"/api/system","purpose":"Live storage, memory, and load summary."},
                {"id":"games","method":"GET","path":"/api/games","purpose":"Private local game index with system and control metadata."},
                {"id":"apps","method":"GET","path":"/api/user-apps","purpose":"User-created app inventory."},
                {"id":"taxonomy","method":"GET","path":"/api/taxonomy","purpose":"Editable core product and module contracts."},
                {"id":"query","method":"GET","path":"/api/agent/query?scope=games|apps|taxonomy&q=...","purpose":"Local semantic search over safe metadata only."},
                {"id":"core-workspace","method":"GET/POST","path":"/api/relay/workspace and /api/relay/workspace/apply","purpose":"Confirmation-gated editor for a small allowlist of core files; every write creates a local backup."},
                {"id":"browse","method":"GET","path":"/api/browse/<source>?q=...","purpose":"Read-only external-source cards for Browse."}
            ]})
            return
        if browse_route.path == "/api/agent/query":
            params=urllib.parse.parse_qs(browse_route.query);scope=(params.get("scope",["games"])[0] or "games").casefold();term=(params.get("q",[""])[0] or "").casefold().strip()[:100];items=[]
            if scope == "games":
                catalog=read_game_catalog();seen=set()
                for folder in (ROOT / "roms", HOME_ROOT / "My Library"):
                    if not folder.exists(): continue
                    for file in folder.rglob("*"):
                        if not file.is_file() or file.suffix.casefold() not in ROM_CORES or str(file.resolve()) in seen: continue
                        seen.add(str(file.resolve()));data=catalog.get(file.name,{});core,system=ROM_CORES[file.suffix.casefold()];name=data.get("title") or re.sub(r"[_-]+"," ",file.stem).strip().title();text=" ".join([file.name,name,str(data.get("description","")),str(data.get("system",system)),str(data.get("genre","Game"))]).casefold()
                        if not term or term in text:items.append({"name":name,"system":data.get("system") or system,"genre":data.get("genre") or "Game","description":data.get("description") or "A private game in your local library.","core":core})
            elif scope == "apps":
                for app in user_apps():
                    if not term or term in (app["name"]+" "+app["description"]).casefold():items.append(app)
            elif scope == "taxonomy":
                for file in sorted((ROOT / "modules").glob("*/manifest.json")):
                    try:
                        data=json.loads(file.read_text(encoding="utf-8"));text=json.dumps(data).casefold()
                        if not term or term in text:items.append({"id":data.get("id",file.parent.name),"name":data.get("name",file.parent.name),"purpose":data.get("purpose","")})
                    except (OSError, ValueError):continue
            self._json(200,{"scope":scope,"query":term,"items":items[:60],"local_only":scope in {"games","apps","taxonomy"}})
            return
        if self.path == "/api/status":
            self._json(200, {"service": "homebase-v61", "multiplayer": True})
            return
        if self.path == "/api/user-apps":
            self._json(200, {"apps": user_apps()})
            return
        if self.path == "/api/assistant/status":
            profile=assistant_profile() or {}
            self._json(200, {"connected":bool(profile),"key_path":"local/relay-provider.json","provider":profile.get("provider","openai"),"model":profile.get("model") or os.environ.get("HOMEBASE_OPENAI_MODEL","gpt-4.1-mini")})
            return
        if browse_route.path == "/api/source-connection/status":
            self._json(200, source_connection_status())
            return
        if self.path == "/api/relay/agent/status":
            with RELAY_AGENT_LOCK:
                jobs=[{key:value for key,value in job.items() if key!="task"} for job in RELAY_AGENT_RUNS.values()]
            self._json(200,{"available":bool(shutil.which("codex")),"workspace":"NovaShell local checkout","jobs":sorted(jobs,key=lambda job:job.get("started",0),reverse=True)[:6]})
            return
        if self.path == "/api/setup/status":
            disk = shutil.disk_usage(HOME_ROOT)
            saved = {}
            try: saved = json.loads(HOMEBASE_CONFIG.read_text(encoding="utf-8"))
            except (OSError, ValueError): pass
            controllers = list(Path("/dev/input").glob("js*")) if Path("/dev/input").exists() else []
            system = platform.system() or "Unknown"
            chromeos = bool(os.environ.get("CROS_USER_ID_HASH")) or Path("/mnt/chromeos").exists()
            self._json(200, {"os": "ChromeOS Linux" if chromeos else system, "architecture": platform.machine() or "unknown",
                "python": platform.python_version(), "storage_free_gb": round(disk.free / 1024 ** 3, 1),
                "controllers": len(controllers), "folders": [{"name": name, "available": path.exists()} for name,path in SCAN_CHOICES.items()],
                "configured": HOMEBASE_CONFIG.exists(), "approved_folders": saved.get("approved_folders", [])})
            return
        if browse_route.path == "/api/games":
            metadata = read_game_catalog(); games = []
            sources=[(ROOT/"roms","roms"),(HOME_ROOT/"My Library","library")]
            seen=set()
            for source,source_kind in sources:
                if not source.exists():continue
                candidates=source.iterdir() if source_kind=="roms" else source.rglob("*")
                for rom in sorted(candidates, key=lambda path:str(path).casefold()):
                    if not rom.is_file() or rom.suffix.casefold() not in ROM_CORES: continue
                    identity=str(rom.resolve());
                    if identity in seen:continue
                    seen.add(identity)
                    core, system = ROM_CORES[rom.suffix.casefold()]; relative=str(rom.relative_to(source)); catalog_key=source_kind+":"+relative; saved = metadata.get(catalog_key, metadata.get(rom.name, {})); title = saved.get("title") or re.sub(r"[_-]+", " ", rom.stem).strip().title(); slug = saved.get("slug") or game_slug(title)
                    media=[]
                    for candidate in [f"{slug}-real.png",f"{slug}.png",f"{slug}.gif",f"{slug}-cover.png",f"{slug}-cover.jpg",f"{slug}-cover.webp",f"{slug}-gameplay.gif",f"{slug}-gameplay-2.gif",f"{slug}-gameplay-3.gif"]:
                        if (ROOT / "covers" / candidate).is_file(): media.append("/covers/"+candidate)
                    game_url="/roms/"+rom.name if source_kind=="roms" else "/api/file?path="+urllib.parse.quote(str(rom.relative_to(HOME_ROOT)))
                    games.append({"rom":game_url,"rom_name":rom.name,"catalog_key":catalog_key,"source_path":relative,"name":title,"slug":slug,"core":core,"system":saved.get("system") or system,"description":saved.get("description") or "A private game from your local library.","genre":saved.get("genre") or "Game","year":saved.get("year") or "","players":saved.get("players") or "Single player","controls":saved.get("controls") or "Standard Xbox mapping","mosaic":bool(saved.get("mosaic")),"media":media,"bytes":rom.stat().st_size,"source":source_kind,"needs_details":not bool(saved)})
            self._json(200,{"games":games,"local_only":True});return
        if browse_route.path.startswith("/api/browse/"):
            section = browse_route.path.rsplit("/", 1)[-1]
            query = urllib.parse.parse_qs(browse_route.query).get("q", [""])[0].strip()[:100]
            cache_key = (section, query.casefold())
            cached = BROWSE_CACHE.get(cache_key)
            if cached and time.time() - cached[0] < 900:
                self._json(200, cached[1]); return
            try:
                if section == "books":
                    params=urllib.parse.urlencode({"q":query or "computer history","limit":24,"fields":"key,title,author_name,first_publish_year,cover_i"})
                    request=urllib.request.Request("https://openlibrary.org/search.json?"+params,headers={"User-Agent":"Homebase-OS/1.0 (github.com/boredguy404/Homebase-OS)"})
                    with urllib.request.urlopen(request,timeout=12) as response:data=json.load(response)
                    items=[{"kind":"book","title":x.get("title","Untitled"),"summary":", ".join(x.get("author_name",[])[:3]),"meta":str(x.get("first_publish_year","")),"image":"https://covers.openlibrary.org/b/id/"+str(x["cover_i"])+"-M.jpg" if x.get("cover_i") else "","url":"https://openlibrary.org"+x.get("key","")} for x in data.get("docs",[])]
                    result={"items":items,"source":"Open Library"}
                elif section == "reference":
                    params=urllib.parse.urlencode({"action":"query","format":"json","generator":"search","gsrsearch":query or "personal computer","gsrlimit":24,"prop":"extracts|pageimages","exintro":1,"explaintext":1,"exchars":500,"piprop":"thumbnail","pithumbsize":500})
                    request=urllib.request.Request("https://en.wikipedia.org/w/api.php?"+params,headers={"User-Agent":"Homebase-OS/1.0 (github.com/boredguy404/Homebase-OS)"})
                    with urllib.request.urlopen(request,timeout=12) as response:data=json.load(response)
                    pages=sorted(data.get("query",{}).get("pages",{}).values(),key=lambda x:x.get("index",999))
                    items=[{"kind":"reference","title":x.get("title","Untitled"),"summary":x.get("extract",""),"image":x.get("thumbnail",{}).get("source",""),"url":"https://en.wikipedia.org/?curid="+str(x.get("pageid",""))} for x in pages]
                    result={"items":items,"source":"Wikipedia"}
                elif section == "apis":
                    term=(query or "").casefold()
                    records=[{"kind":"Free API","title":title,"summary":summary,"meta":"Free · no key · "+method,"url":docs,"service":base,"method":method,"endpoint":endpoint,"example":example,"auth":"None required","image":urllib.parse.urlsplit(base).scheme+"://"+urllib.parse.urlsplit(base).netloc+"/favicon.ico"} for title,summary,base,method,endpoint,example,docs in CURATED_PUBLIC_APIS if not term or term in (title+" "+summary+" "+base+" "+endpoint).casefold()]
                    # The list is deliberately curated rather than sourced from a
                    # bulk directory: bulk directories mix paid/keyed APIs and
                    # versions. A normalized title makes duplicate names impossible.
                    unique={}
                    for item in records:
                        unique.setdefault(re.sub(r"[^a-z0-9]+", "", item["title"].casefold()), item)
                    records=sorted(unique.values(),key=lambda item:item["title"].casefold())
                    result={"items":records,"source":"Curated free, no-key APIs · "+str(len(records))+" unique APIs"}
                elif section == "projects":
                    params=urllib.parse.urlencode({"q":query or "chromebook utilities","sort":"stars","order":"desc","per_page":48})
                    request=urllib.request.Request("https://api.github.com/search/repositories?"+params,headers={"Accept":"application/vnd.github+json","User-Agent":"Homebase-OS/1.0"})
                    with urllib.request.urlopen(request,timeout=12) as response:data=json.load(response)
                    def clean_project_description(value):
                        text=re.sub(r"```.*?```", "", value or "No description provided.", flags=re.S)
                        text=re.sub(r"`[^`]*`", "", text)
                        return re.sub(r"\s+", " ", re.sub(r"[*_>#]", "", text)).strip()[:420]
                    items=[{"kind":"project","title":x["full_name"],"summary":clean_project_description(x.get("description")),"meta":str(x.get("stargazers_count",0))+" stars · "+(x.get("language") or "mixed"),"image":x["owner"].get("avatar_url",""),"url":x["html_url"],"homepage":x.get("homepage") or "","license":(x.get("license") or {}).get("spdx_id") or "Not declared","language":x.get("language") or "Mixed","stars":x.get("stargazers_count",0),"forks":x.get("forks_count",0),"issues":x.get("open_issues_count",0),"updated":x.get("updated_at",""),"topics":x.get("topics",[])[:10],"owner":x["owner"].get("login","")} for x in data.get("items",[])]
                    result={"items":items,"source":"GitHub"}
                elif section == "linux":
                    items=[{"kind":"Installed Linux app","title":app["name"],"summary":app.get("summary") or app.get("generic_name") or "Installed locally.","meta":"Installed · "+("Flatpak" if app["id"] in flatpak_scopes() else "Linux desktop app"),"image":"/api/app-icon/"+app["id"],"url":""} for app in installed_apps().values()]
                    source="Installed Linux apps · Flathub catalog"
                    try:
                        request=urllib.request.Request("https://flathub.org/api/v2/search",data=json.dumps({"query":query or "popular","filters":[]}).encode(),headers={"Content-Type":"application/json","User-Agent":"Homebase-OS/1.0"})
                        with urllib.request.urlopen(request,timeout=4) as response:data=json.load(response)
                        items.extend({"kind":"Linux app","title":x.get("name") or x.get("app_id","Linux app"),"summary":x.get("summary") or "ARM-compatible Linux app on Flathub.","meta":(x.get("developer_name") or "Flathub")+" · "+str(x.get("installs_last_month",0))+" monthly installs","image":x.get("icon") or "","url":"https://flathub.org/apps/"+(x.get("app_id") or "")} for x in data.get("hits",[]) if "aarch64" in x.get("arches",[]))
                    except (OSError, ValueError, KeyError):
                        source="Installed Linux apps · catalog reconnecting"
                    curated=[("Firefox","Full desktop browser with sync, privacy controls, and strong extension support.","org.mozilla.firefox"),("VLC","Reliable local video, audio, subtitle, and network stream player.","org.videolan.VLC"),("Kdenlive","Non-linear video editor for clips, screen recordings, and exports.","org.kde.kdenlive"),("Audacity","Multi-track audio editor and recorder.","org.audacityteam.Audacity"),("OBS Studio","Screen recording and streaming studio.","com.obsproject.Studio"),("GIMP","Image editor for artwork, screenshots, and sprites.","org.gimp.GIMP"),("Inkscape","Vector artwork and SVG editor.","org.inkscape.Inkscape"),("Blender","3D modelling, animation, and rendering suite.","org.blender.Blender"),("Krita","Digital painting and illustration studio.","org.kde.krita"),("Strawberry","Music library player with playlists and artwork.","org.strawberrymusicplayer.strawberry"),("Bottles","Managed Windows compatibility environments.","com.usebottles.bottles"),("ProtonUp-Qt","Install and manage compatibility tools for game launchers.","net.davidotek.pupgui2"),("Prism Launcher","Organize and launch Minecraft instances.","org.prismlauncher.PrismLauncher"),("Steam","Desktop game library and streaming client.","com.valvesoftware.Steam"),("FreeTube","Privacy-focused desktop video viewer.","io.freetubeapp.FreeTube"),("Telegram Desktop","Desktop chat client with file sharing.","org.telegram.desktop"),("LocalSend","Local device-to-device file transfer.","org.localsend.localsend_app"),("KeePassXC","Offline password manager.","org.keepassxc.KeePassXC"),("Syncthing","Private peer-to-peer folder sync.","me.kozec.syncthingtk"),("Extension Manager","Browse and manage GNOME extensions.","com.mattjakeman.ExtensionManager"),("Mission Center","System resource monitor.","io.missioncenter.MissionCenter"),("Gear Lever","Run and organize AppImage applications.","it.mijorus.gearlever")]
                    term=(query or "").casefold();known={item["title"].casefold() for item in items}
                    for title,summary,app_id in curated:
                        if title.casefold() in known or term and term not in (title+" "+summary+" "+app_id).casefold():continue
                        items.append({"kind":"Curated Linux app","title":title,"summary":summary,"meta":"Flatpak · copyable: flatpak install flathub "+app_id,"image":"","url":"https://flathub.org/apps/"+app_id})
                    result={"items":items,"source":source}
                elif section == "news":
                    feeds={"top":"https://feeds.bbci.co.uk/news/rss.xml","world":"https://feeds.bbci.co.uk/news/world/rss.xml","technology":"https://feeds.bbci.co.uk/news/technology/rss.xml","science":"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml","business":"https://feeds.bbci.co.uk/news/business/rss.xml"}
                    request=urllib.request.Request(feeds.get(query.casefold(),feeds["top"]),headers={"User-Agent":"Homebase-OS/1.0"})
                    with urllib.request.urlopen(request,timeout=12) as response:root=ET.fromstring(response.read())
                    items=[]
                    for node in root.findall(".//item")[:30]:
                        description=node.findtext("description",default="")
                        full=next((child.text or "" for child in node if child.tag.rsplit("}",1)[-1]=="encoded"),"")
                        article=re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>"," ",full or description))).strip()
                        items.append({"kind":"news","title":node.findtext("title",default="Untitled"),"summary":re.sub("<[^>]+>","",description),"article":article,"meta":node.findtext("pubDate",default=""),"url":node.findtext("link",default="")})
                    result={"items":items,"source":"BBC News RSS"}
                elif section in {"ai", "dev", "security", "research", "games"}:
                    defaults={"ai":"AI software development Claude OpenAI","dev":"software development open source Linux","security":"cybersecurity privacy open source security","research":"computer science research science technology","games":"game development industry indie games"}
                    labels={"ai":"AI & developer news","dev":"Developer news","security":"Security & privacy news","research":"Research briefings","games":"Game development news"}
                    term=query or defaults[section]
                    feed="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":term,"hl":"en-US","gl":"US","ceid":"US:en","num":100})
                    request=urllib.request.Request(feed,headers={"User-Agent":"Homebase-OS/1.0"})
                    with urllib.request.urlopen(request,timeout=12) as response:root=ET.fromstring(response.read())
                    items=[{"kind":section+" news","title":node.findtext("title",default="Untitled"),"summary":re.sub("<[^>]+>","",node.findtext("description",default="")),"meta":node.findtext("pubDate",default=""),"url":node.findtext("link",default="")} for node in root.findall(".//item")[:40]]
                    if section in {"ai", "dev", "security", "research"}:
                        try:
                            hn_url="https://hn.algolia.com/api/v1/search_by_date?"+urllib.parse.urlencode({"query":term,"tags":"story","hitsPerPage":48})
                            hn_request=urllib.request.Request(hn_url,headers={"User-Agent":"Homebase-OS/1.0"})
                            with urllib.request.urlopen(hn_request,timeout=10) as response:hn=json.load(response)
                            items.extend({"kind":"developer discussion","title":x.get("title") or "Untitled","summary":str(x.get("points",0))+" points · "+str(x.get("num_comments",0))+" comments on Hacker News","meta":str(x.get("created_at","")).replace("T"," ")[:16],"url":x.get("url") or "https://news.ycombinator.com/item?id="+str(x.get("objectID",""))} for x in hn.get("hits",[]) if x.get("title"))
                        except (OSError, ValueError, KeyError):
                            pass
                    if section in {"ai", "research"}:
                        try:
                            arxiv_terms="all:machine learning OR all:large language model OR all:artificial intelligence" if section == "ai" else "cat:cs* OR cat:physics* OR cat:q-bio*"
                            arxiv_url="https://export.arxiv.org/api/query?"+urllib.parse.urlencode({"search_query":arxiv_terms,"start":0,"max_results":28,"sortBy":"submittedDate","sortOrder":"descending"})
                            arxiv_request=urllib.request.Request(arxiv_url,headers={"User-Agent":"Homebase-OS/1.0"})
                            with urllib.request.urlopen(arxiv_request,timeout=12) as response:arxiv=ET.fromstring(response.read())
                            atom="{http://www.w3.org/2005/Atom}"
                            items.extend({"kind":"AI research","title":" ".join((node.findtext(atom+"title") or "Untitled").split()),"summary":" ".join((node.findtext(atom+"summary") or "Recent AI research preprint.").split())[:500],"meta":(node.findtext(atom+"published") or "")[:10]+" · arXiv","url":next((link.get("href") for link in node.findall(atom+"link") if link.get("rel") in {None,"alternate"}),"")} for node in arxiv.findall(atom+"entry"))
                        except (OSError, ValueError, KeyError, ET.ParseError):
                            pass
                        try:
                            reddit_request=urllib.request.Request("https://www.reddit.com/r/MachineLearning/.rss",headers={"User-Agent":"Homebase-OS/1.0"})
                            with urllib.request.urlopen(reddit_request,timeout=10) as response:reddit=ET.fromstring(response.read())
                            atom="{http://www.w3.org/2005/Atom}"
                            items.extend({"kind":"AI community","title":" ".join((node.findtext(atom+"title") or "Untitled").split()),"summary":"MachineLearning community discussion.","meta":(node.findtext(atom+"updated") or "")[:10]+" · r/MachineLearning","url":next((link.get("href") for link in node.findall(atom+"link") if link.get("rel") in {None,"alternate"}),"")} for node in reddit.findall(atom+"entry")[:28])
                        except (OSError, ValueError, KeyError, ET.ParseError):
                            pass
                    if section == "dev":
                        try:
                            devto_url="https://dev.to/api/articles?"+urllib.parse.urlencode({"per_page":36,"top":14})
                            devto_request=urllib.request.Request(devto_url,headers={"User-Agent":"Homebase-OS/1.0"})
                            with urllib.request.urlopen(devto_request,timeout=10) as response:devto=json.load(response)
                            items.extend({"kind":"developer article","title":x.get("title") or "Untitled","summary":x.get("description") or "A current developer article from DEV Community.","meta":(x.get("readable_publish_date") or "DEV Community")+" · "+str(x.get("positive_reactions_count",0))+" reactions","image":x.get("cover_image") or "","url":x.get("url") or ""} for x in devto if x.get("title"))
                        except (OSError, ValueError, KeyError):
                            pass
                        try:
                            lobsters_request=urllib.request.Request("https://lobste.rs/rss",headers={"User-Agent":"Homebase-OS/1.0"})
                            with urllib.request.urlopen(lobsters_request,timeout=10) as response:lobsters=ET.fromstring(response.read())
                            items.extend({"kind":"developer discussion","title":node.findtext("title",default="Untitled"),"summary":re.sub("<[^>]+>","",node.findtext("description",default="Developer discussion from Lobsters.")),"meta":node.findtext("pubDate",default="")+" · Lobsters","url":node.findtext("link",default="")} for node in lobsters.findall(".//item")[:35])
                        except (OSError, ValueError, KeyError, ET.ParseError):
                            pass
                    seen_titles=set();items=[item for item in items if item.get("title") and not (item["title"].casefold() in seen_titles or seen_titles.add(item["title"].casefold()))]
                    feeds=" · Google News RSS + Hacker News + DEV Community + Lobsters" if section=="dev" else " · Google News RSS + Hacker News + arXiv + r/MachineLearning" if section=="ai" else " · Google News RSS + Hacker News + arXiv" if section=="research" else " · Google News RSS + Hacker News" if section=="security" else " · Google News RSS"
                    result={"items":items,"source":labels[section]+feeds}
                else: raise ValueError("unknown browse source")
                BROWSE_CACHE[cache_key]=(time.time(),result);self._json(200,result)
            except (OSError,ValueError,KeyError,ET.ParseError) as error:self._json(502,{"error":str(error),"items":[]})
            return
        if self.path == "/api/github-status":
            if not shutil.which("gh"):
                self._json(200, {"connected": False, "installed": False, "message": "GitHub CLI is not installed"})
                return
            check = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True, timeout=8)
            output = (check.stdout + check.stderr).strip()
            match = re.search(r"account\s+([^\s]+)", output, re.I)
            self._json(200, {"connected": check.returncode == 0, "installed": True,
                             "account": match.group(1) if match else "", "message": output[-500:]})
            return
        if self.path == "/api/system":
            disk = shutil.disk_usage(HOME_ROOT)
            with open("/proc/meminfo", encoding="utf-8") as handle:
                memory = {line.split(":", 1)[0]: int(line.split()[1]) for line in handle if line.split()[0].rstrip(":") in {"MemTotal", "MemAvailable"}}
            self._json(200, {
                "disk_free_gb": round(disk.free / 1024 ** 3, 1),
                "memory_used_percent": round((1 - memory["MemAvailable"] / memory["MemTotal"]) * 100),
                "load": round(os.getloadavg()[0], 2),
            })
            return
        if self.path == "/api/insights":
            self._json(200, system_insights())
            return
        if self.path == "/api/controllers":
            devices = list(Path("/dev/input").glob("js*")) if Path("/dev/input").exists() else []
            self._json(200, {"linux_controllers": len(devices), "ready_for_native_multiplayer": len(devices) >= 2})
            return
        if self.path.startswith("/api/jobs/"):
            job_id = self.path[len("/api/jobs/"):]
            with JOBS_LOCK:
                job = dict(JOBS.get(job_id, {}))
            self._json(200 if job else 404, job or {"error": "job not found"})
            return
        if urllib.parse.urlsplit(self.path).path == "/api/orbit-stations":
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("q", [""])[0][:80]
            params = urllib.parse.urlencode({"limit": 60, "hidebroken": "true", "order": "clickcount",
                                             "reverse": "true", "name": query})
            request = urllib.request.Request("https://de1.api.radio-browser.info/json/stations/search?" + params,
                                             headers={"User-Agent": "Homebase-Orbit/1.0", "Accept": "application/json"})
            try:
                with urllib.request.urlopen(request, timeout=12) as response:
                    self._json(200, json.load(response))
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        if self.path == "/api/apps":
            flatpaks = flatpak_scopes()
            self._json(200, [{"id": app["id"], "name": app["name"], "icon": "/api/app-icon/" + app["id"],
                              "summary": app.get("summary") or app.get("generic_name") or "Linux application",
                              "categories": app.get("categories", ""),
                              "source": "Flatpak" if app["id"] in flatpaks else "Linux desktop app",
                              "uninstallable": app["id"] in flatpaks}
                             for app in installed_apps().values()])
            return
        route = urllib.parse.urlsplit(self.path)
        if route.path == "/api/backup/export":
            length=min(int(self.headers.get("Content-Length","0")),5*1024*1024)
            try: payload=json.loads(self.rfile.read(length) or b"{}")
            except ValueError: self._json(400,{"error":"invalid settings"});return
            selected=[key for key in payload.get("areas",[]) if key in BACKUP_AREAS];memory=io.BytesIO()
            with zipfile.ZipFile(memory,"w",zipfile.ZIP_DEFLATED,compresslevel=5) as archive:
                archive.writestr("homebase-backup.json",json.dumps({"format":1,"created":int(time.time()),"areas":selected,"preferences":payload.get("preferences",{}),"installed_apps":[{"id":app["id"],"name":app["name"]} for app in installed_apps().values()]},indent=2))
                for key in selected:
                    folder=BACKUP_AREAS[key]
                    if folder.exists():
                        for path in folder.rglob("*"):
                            if path.is_file(): archive.write(path,"data/"+key+"/"+str(path.relative_to(folder)))
            body=memory.getvalue();self.send_response(200);self.send_header("Content-Type","application/zip");self.send_header("Content-Disposition",'attachment; filename="homebase-backup.zip"');self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body);return
        if route.path == "/api/backup/inspect":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"))
                self._json(200,{"areas":manifest.get("areas",[]),"created":manifest.get("created"),"installed_apps":manifest.get("installed_apps",[]),"has_preferences":bool(manifest.get("preferences"))})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/backup/import":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"));restored=[];skipped=[]
                    requested={key for key in self.headers.get("X-Homebase-Areas","").split(",") if key};replace=self.headers.get("X-Homebase-Conflict")=="replace"
                    for key in manifest.get("areas",[]):
                        if key not in BACKUP_AREAS or requested and key not in requested: continue
                        destination=BACKUP_AREAS[key];destination.mkdir(parents=True,exist_ok=True);prefix="data/"+key+"/"
                        for name in archive.namelist():
                            relative=Path(name[len(prefix):]) if name.startswith(prefix) else None
                            if not relative or name.endswith("/") or relative.is_absolute() or ".." in relative.parts: continue
                            target=destination/relative
                            if target.exists() and not replace: skipped.append(str(relative));continue
                            target.parent.mkdir(parents=True,exist_ok=True)
                            with archive.open(name) as source,target.open("wb") as output: shutil.copyfileobj(source,output)
                        restored.append(key)
                preferences=manifest.get("preferences",{}) if not requested or "preferences" in requested else {}
                self._json(200,{"restored":restored,"skipped":len(skipped),"preferences":preferences,"installed_apps":manifest.get("installed_apps",[])})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/files":
            raw = urllib.parse.parse_qs(route.query).get("path", ["Desktop"])[0]
            folder = safe_home_path(raw)
            if not folder or not folder.is_dir():
                self._json(404, {"error": "folder not found"})
                return
            entries = []
            try:
                for item in sorted(folder.iterdir(), key=lambda p: (not p.is_dir(), p.name.casefold())):
                    if item.name.startswith("."):
                        continue
                    stat = item.stat()
                    entries.append({"name": item.name, "path": str(item.relative_to(HOME_ROOT)),
                        "directory": item.is_dir(), "size": stat.st_size, "modified": int(stat.st_mtime),
                        "mime": mimetypes.guess_type(item.name)[0] or "application/octet-stream"})
                self._json(200, {"path": str(folder.relative_to(HOME_ROOT)) if folder != HOME_ROOT else "",
                    "parent": str(folder.parent.relative_to(HOME_ROOT)) if folder != HOME_ROOT else None,
                    "entries": entries})
            except OSError as error:
                self._json(500, {"error": str(error)})
            return
        if route.path == "/api/file":
            raw = urllib.parse.parse_qs(route.query).get("path", [""])[0]
            file_path = safe_home_path(raw)
            if not file_path or not file_path.is_file():
                self.send_error(404)
                return
            try:
                size = file_path.stat().st_size
                self.send_response(200)
                self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
                self.send_header("Content-Length", str(size))
                self.send_header("Content-Disposition", "inline; filename*=UTF-8''" + urllib.parse.quote(file_path.name))
                self.end_headers()
                with file_path.open("rb") as handle:
                    shutil.copyfileobj(handle, self.wfile)
            except (OSError, BrokenPipeError):
                pass
            return
        if self.path.startswith("/api/app-icon/"):
            app = installed_apps().get(urllib.parse.unquote(self.path[len("/api/app-icon/"):]))
            icon = (resolve_icon(app["icon"]) or resolve_icon(app["id"])) if app else None
            if not icon:
                self.send_error(404)
                return
            body = icon.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(icon.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "public, max-age=86400")
            self.end_headers()
            self.wfile.write(body)
            return
        if urllib.parse.urlsplit(self.path).path == "/api/catalog":
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("q", ["popular"])[0][:80]
            cached = CATALOG_CACHE.get(("search", query.casefold()))
            if cached:
                self._json(200, cached)
                return
            request = urllib.request.Request("https://flathub.org/api/v2/search",
                data=json.dumps({"query": query, "filters": []}).encode(),
                headers={"Content-Type": "application/json", "User-Agent": "Homebase/1.0"})
            try:
                with urllib.request.urlopen(request, timeout=12) as response:
                    hits = json.load(response).get("hits", [])
                result = [{key: app.get(key) for key in ("app_id", "name", "summary", "icon", "developer_name",
                           "verification_verified", "installs_last_month", "main_categories")}
                          for app in hits if "aarch64" in app.get("arches", [])][:60]
                CATALOG_CACHE[("search", query.casefold())] = result
                self._json(200, result)
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        if self.path.startswith("/api/catalog-detail/"):
            app_id = urllib.parse.unquote(self.path[len("/api/catalog-detail/"):])
            if not re.fullmatch(r"[A-Za-z0-9_.-]+", app_id):
                self._json(400, {"error": "invalid app id"})
                return
            try:
                request = urllib.request.Request("https://flathub.org/api/v2/appstream/" + app_id,
                    headers={"User-Agent": "Nightglass/1.0"})
                with urllib.request.urlopen(request, timeout=12) as response:
                    app = json.load(response)
                shots = []
                for shot in app.get("screenshots", [])[:6]:
                    sizes = shot.get("sizes", [])
                    image = next((item.get("src") for item in sizes if item.get("width") == "624"), None)
                    if not image and sizes:
                        image = sizes[-1].get("src")
                    if image:
                        shots.append({"src": image, "caption": shot.get("caption", "")})
                urls = app.get("urls") or {}
                official = next((value for key, value in urls.items() if key in {"homepage", "website", "bugtracker"} and isinstance(value, str) and value.startswith("https://")), "")
                self._json(200, {"app_id": app_id, "name": app.get("name"), "summary": app.get("summary"),
                    "description": app.get("description"), "developer_name": app.get("developer_name"),
                    "icon": app.get("icon"), "screenshots": shots, "official_url": official,
                    "flathub_url": "https://flathub.org/apps/" + urllib.parse.quote(app_id, safe=".")})
            except (OSError, ValueError) as error:
                self._json(502, {"error": str(error)})
            return
        super().do_GET()

    def do_POST(self):
        # Chromebook's embedded Linux hostname and the container IP may be
        # classified as cross-site despite both resolving to this local server.
        # Permit only those local origins for writes; remote origins stay denied.
        origin_host = urllib.parse.urlsplit(self.headers.get("Origin", "")).hostname or ""
        local_origin = origin_host in {"localhost", "127.0.0.1", "penguin.linux.test"} or origin_host.startswith("100.115.")
        # The import form uses custom upload headers, so normal browser CORS
        # already blocks third-party form posts.  Do not reject the private
        # game-import endpoint when Chrome mislabels its embedded local frame.
        if self.headers.get("Sec-Fetch-Site") not in {"same-origin", "same-site", "none"} and not local_origin and not self.path.startswith(("/api/game-import/", "/api/files/")):
            self._json(403, {"error": "same-origin action required"})
            return
        route = urllib.parse.urlsplit(self.path)
        if route.path == "/api/setup":
            length = min(int(self.headers.get("Content-Length", "0")), 64 * 1024)
            try:
                payload = json.loads(self.rfile.read(length) or b"{}")
                approved = [name for name in payload.get("approved_folders", []) if name in SCAN_CHOICES]
                HOMEBASE_CONFIG.parent.mkdir(parents=True, exist_ok=True)
                HOMEBASE_CONFIG.write_text(json.dumps({"approved_folders": approved, "demo_library": bool(payload.get("demo_library")), "updated": int(time.time())}, indent=2), encoding="utf-8")
                demo_created = False
                if payload.get("demo_library"):
                    demo = HOME_ROOT / "My Library" / "Welcome to Homebase"
                    demo.mkdir(parents=True, exist_ok=True)
                    readme = demo / "START HERE.txt"
                    if not readme.exists():
                        readme.write_text("Welcome to Homebase.\n\nDrop your own files into My Library. Add legally obtained games through Pocket Archive > Add your games. Your private files stay on this device and are ignored by Git.\n", encoding="utf-8")
                    demo_created = True
                self._json(200, {"saved": True, "approved_folders": approved, "demo_created": demo_created})
            except (OSError, ValueError, TypeError) as error:
                self._json(400, {"error": str(error)})
            return
        if route.path == "/api/project-feed":
            length=min(int(self.headers.get("Content-Length", "0")), 16 * 1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}")
                task_id=str(payload.get("task", "")).strip()
                task_text=str(payload.get("text", "")).strip()
                lane=str(payload.get("lane", "")).strip()
                message=str(payload.get("message", "")).strip()
                if lane not in {"todo", "doing", "done"}: raise ValueError("choose To Do, In Progress, or Complete")
                if not re.fullmatch(r"project-[a-z0-9-]{2,80}", task_id): raise ValueError("choose a valid project task")
                if not message or len(message) > 600: raise ValueError("write a short build update")
                with PROJECT_FEED_LOCK:
                    feed=project_feed()
                    task=next((item for item in feed["tasks"] if item.get("id") == task_id), None)
                    if not task:
                        if not task_text or len(task_text) > 240: raise ValueError("new project tasks need a short title")
                        task={"id": task_id, "text": task_text, "lane": lane}
                        feed["tasks"].append(task)
                    elif task_text:
                        task["text"] = task_text[:240]
                    task["lane"] = lane
                    feed["events"].append({"time": int(time.time()), "message": message, "kind": "relay"})
                    feed["events"] = feed["events"][-40:]
                    save_project_feed(feed)
                self._json(200, feed)
            except (OSError, ValueError, TypeError) as error:
                self._json(400, {"error": str(error)})
            return
        if route.path == "/api/assistant":
            length = min(int(self.headers.get("Content-Length", "0")), 16 * 1024)
            try:
                payload = json.loads(self.rfile.read(length) or b"{}"); message = str(payload.get("message", "")).strip()
                if not message: raise ValueError("write a request first")
                response = local_assistant(message); enhanced = openai_assistant(message)
                if enhanced: response["reply"] = enhanced
                response["enhanced"] = bool(enhanced)
                self._json(200, response)
            except (ValueError, TypeError) as error: self._json(400, {"error": str(error)})
            return
        if route.path == "/api/assistant/test":
            profile=assistant_profile()
            if not profile:
                self._json(409,{"error":"Connect an AI provider in Relay before testing it."});return
            try:
                reply=relay_ai_response("Reply with exactly: RELAY ROUTE READY. Do not add anything else.","Connection check.",max_tokens=16)
                if not reply: raise ValueError("provider returned an empty reply")
                self._json(200,{"reachable":True,"provider":profile["provider"],"model":profile.get("model"),"reply":reply[:80]})
            except (OSError, ValueError, KeyError) as error:
                self._json(502,{"reachable":False,"provider":profile["provider"],"model":profile.get("model"),"error":str(error)[:300]})
            return
        if route.path == "/api/relay/agent/run":
            length=min(int(self.headers.get("Content-Length","0")),12*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}")
                if payload.get("confirm")!="RUN LOCAL CODEX": raise ValueError("type RUN LOCAL CODEX to start a local developer run")
                if not assistant_profile(): raise ValueError("connect an AI provider in Relay first")
                self._json(202,{"job":start_relay_coding_agent(payload.get("task",""))})
            except (OSError,ValueError,TypeError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/assistant/app":
            length=min(int(self.headers.get("Content-Length","0")),12*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}"); description=str(payload.get("description","")).strip()[:3000]; framework=str(payload.get("framework","Vanilla HTML/CSS/JS"))[:50]
                if not description: raise ValueError("describe the app first")
                self._json(200,{"app":create_relay_app(description,framework)})
            except (OSError, ValueError, TypeError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/relay/workspace/draft":
            length=min(int(self.headers.get("Content-Length","0")),16*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}"); file_id=str(payload.get("file","")).strip(); instruction=str(payload.get("instruction","")).strip()
                self._json(200,draft_core_edit(file_id,instruction))
            except (OSError, ValueError, TypeError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/assistant/app/delete":
            length=min(int(self.headers.get("Content-Length","0")),4*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}"); app_id=str(payload.get("id","")).strip()
                if payload.get("confirm")!="DELETE" or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}(?:/[a-z0-9][a-z0-9-]{0,63})?",app_id): raise ValueError("a confirmed app folder is required")
                target=(USER_APPS/app_id).resolve()
                if not target.is_dir() or not target.is_relative_to(USER_APPS): raise ValueError("app folder not found")
                shutil.rmtree(target);self._json(200,{"deleted":app_id})
            except (OSError, ValueError, TypeError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/relay/workspace/apply":
            length=min(int(self.headers.get("Content-Length","0")),300*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}");file_id=str(payload.get("file",""));content=str(payload.get("content",""));path=CORE_EDITABLE.get(file_id)
                if payload.get("confirm")!="APPLY CORE EDIT" or not path:raise ValueError("choose an allowed file and type the exact confirmation")
                if not content.strip() or "\x00" in content:raise ValueError("workspace edit must contain normal text")
                if len(content)>250000:raise ValueError("workspace edit is too large")
                # Reject a Python syntax error before it can take down the local
                # server. Other formats are intentionally review-only text files.
                if path.suffix==".py": compile(content,str(path),"exec")
                backup=ROOT/"local"/"workspace-backups"/(file_id+"-"+str(int(time.time()))+path.suffix);backup.parent.mkdir(parents=True,exist_ok=True)
                if path.exists():shutil.copy2(path,backup)
                temporary=path.with_suffix(path.suffix+".tmp");temporary.write_text(content,encoding="utf-8");temporary.replace(path)
                self._json(200,{"saved":file_id,"backup":str(backup.relative_to(ROOT))})
            except (OSError,ValueError,TypeError,SyntaxError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/relay/workspace/restore":
            length=min(int(self.headers.get("Content-Length","0")),8*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}");file_id=str(payload.get("file","")).strip();backup_name=Path(str(payload.get("backup","")).strip()).name;path=CORE_EDITABLE.get(file_id)
                if payload.get("confirm")!="RESTORE CORE BACKUP" or not path:raise ValueError("choose an allowed file and type the exact restore confirmation")
                backup=ROOT/"local"/"workspace-backups"/backup_name
                if not backup.is_file() or not backup.name.startswith(file_id+"-") or backup.suffix!=path.suffix:raise ValueError("that backup does not belong to the selected core file")
                content=backup.read_text(encoding="utf-8")
                if path.suffix==".py":compile(content,str(path),"exec")
                safety=ROOT/"local"/"workspace-backups"/(file_id+"-before-restore-"+str(int(time.time()))+path.suffix)
                if path.exists():shutil.copy2(path,safety)
                temporary=path.with_suffix(path.suffix+".tmp");temporary.write_text(content,encoding="utf-8");temporary.replace(path)
                self._json(200,{"restored":file_id,"backup":str(backup.relative_to(ROOT)),"safety_backup":str(safety.relative_to(ROOT))})
            except (OSError,ValueError,TypeError,SyntaxError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/assistant/key/remove":
            try:
                if self.headers.get("Sec-Fetch-Site") not in {"same-origin", "same-site"}: raise ValueError("open NovaShell locally to manage the keyring")
                removed=ASSISTANT_CONFIG_FILE.exists()
                if removed: ASSISTANT_CONFIG_FILE.unlink()
                self._json(200,{"removed":removed})
            except (OSError, ValueError) as error: self._json(400,{"error":str(error)})
            return
        if route.path == "/api/source-connection/profile":
            length=min(int(self.headers.get("Content-Length", "0")), 16 * 1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}")
                protocol=str(payload.get("protocol", "ftps")).casefold()
                host=str(payload.get("host", "")).strip().casefold()
                port=int(payload.get("port") or {"ftp":21,"ftps":990,"sftp":22}.get(protocol,22))
                username=str(payload.get("username", "")).strip()
                password=str(payload.get("password", ""))
                directory=str(payload.get("directory", "")).strip() or "/"
                if protocol not in {"ftp", "ftps", "sftp"}: raise ValueError("choose FTP, FTPS, or SFTP")
                if not re.fullmatch(r"[a-z0-9.-]{1,253}", host) or ".." in host: raise ValueError("enter only a server hostname or IP address")
                if not 1 <= port <= 65535: raise ValueError("port must be between 1 and 65535")
                if not username or len(username)>120 or any(ord(char)<32 for char in username): raise ValueError("enter a valid username")
                if not password or len(password)>500 or any(ord(char)<32 and char not in "\t" for char in password): raise ValueError("enter a valid password")
                if len(directory)>300 or not directory.startswith("/") or any(ord(char)<32 for char in directory): raise ValueError("directory must start with /")
                SOURCE_CONNECTION_FILE.parent.mkdir(parents=True, exist_ok=True)
                SOURCE_CONNECTION_FILE.write_text(json.dumps({"protocol":protocol,"host":host,"port":port,"username":username,"password":password,"directory":directory})+"\n", encoding="utf-8")
                os.chmod(SOURCE_CONNECTION_FILE, 0o600)
                self._json(200, {"saved":True, **source_connection_status()})
            except (OSError, ValueError, TypeError) as error: self._json(400, {"error":str(error)})
            return
        if route.path == "/api/source-connection/remove":
            try:
                removed=SOURCE_CONNECTION_FILE.exists()
                if removed: SOURCE_CONNECTION_FILE.unlink()
                self._json(200, {"removed":removed})
            except OSError as error: self._json(400, {"error":str(error)})
            return
        if route.path == "/api/source-connection/test":
            try: self._json(200, test_source_connection())
            except (OSError, ValueError, TypeError) as error: self._json(400, {"error":str(error)})
            return
        if route.path == "/api/assistant/key":
            length = min(int(self.headers.get("Content-Length", "0")), 16 * 1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}");key=str(payload.get("key","")).strip();provider=str(payload.get("provider","openai")).strip();model=str(payload.get("model","")).strip()
                if provider not in {"openai","openrouter","groq","gemini"}:raise ValueError("choose an available Relay provider")
                if not re.fullmatch(r"[A-Za-z0-9_.$:/-]{12,220}",key):raise ValueError("that does not look like an API key")
                defaults={"openai":"gpt-4.1-mini","openrouter":"openrouter/free","groq":"openai/gpt-oss-20b","gemini":"gemini-2.5-flash"}
                if not re.fullmatch(r"[A-Za-z0-9_.:/-]{2,160}",model or defaults[provider]):raise ValueError("model name contains unsupported characters")
                profile={"provider":provider,"key":key,"model":model or defaults[provider]};ASSISTANT_CONFIG_FILE.parent.mkdir(parents=True,exist_ok=True);ASSISTANT_CONFIG_FILE.write_text(json.dumps(profile)+"\n",encoding="utf-8");os.chmod(ASSISTANT_CONFIG_FILE,0o600)
                self._json(200,{"saved":True,"provider":provider,"model":profile["model"]})
            except (OSError, ValueError, TypeError) as error: self._json(400, {"error": str(error)})
            return
        if route.path == "/api/game-import/file":
            kind = urllib.parse.parse_qs(route.query).get("kind", [""])[0]; raw_name = urllib.parse.unquote(self.headers.get("X-File-Name", "")); name = Path(raw_name).name; slug = game_slug(self.headers.get("X-Game-Slug", Path(name).stem)); length=min(int(self.headers.get("Content-Length","0")),4*1024**3)
            suffix=Path(name).suffix.casefold()
            if name!=raw_name or not length or kind=="rom" and suffix not in ROM_CORES or kind not in {"rom","cover","preview1","preview2","preview3"}:
                self._json(400,{"error":"unsupported or invalid import file"});return
            if kind=="rom": destination=ROOT/"roms"/name
            else:
                allowed={".png",".jpg",".jpeg",".webp",".gif"}
                if suffix not in allowed:self._json(400,{"error":"artwork must be PNG, JPG, WebP, or GIF"});return
                suffix=".jpg" if suffix==".jpeg" else suffix;label="cover" if kind=="cover" else "gameplay"+("" if kind=="preview1" else "-"+kind[-1]);destination=ROOT/"covers"/(slug+"-"+label+suffix)
            destination.parent.mkdir(parents=True,exist_ok=True)
            if destination.exists():self._json(409,{"error":"that file is already imported","path":str(destination.relative_to(ROOT))});return
            try:
                with destination.open("wb") as output:
                    remaining=length
                    while remaining:
                        chunk=self.rfile.read(min(1024*1024,remaining))
                        if not chunk:break
                        output.write(chunk);remaining-=len(chunk)
                self._json(201,{"path":str(destination.relative_to(ROOT)),"bytes":destination.stat().st_size})
            except OSError as error:self._json(500,{"error":str(error)})
            return
        if route.path == "/api/game-import/metadata":
            length=min(int(self.headers.get("Content-Length","0")),128*1024)
            try:
                payload=json.loads(self.rfile.read(length) or b"{}");rom_name=Path(str(payload.get("rom_name", ""))).name;catalog_key=str(payload.get("catalog_key","")).strip();source_path=str(payload.get("source_path","")).strip()
                if rom_name!=payload.get("rom_name") or not re.fullmatch(r"(?:roms|library):[^\\]{1,500}",catalog_key):raise ValueError("invalid game catalog entry")
                source,relative=catalog_key.split(":",1);target=(ROOT/"roms"/relative).resolve() if source=="roms" else (HOME_ROOT/"My Library"/relative).resolve();root=(ROOT/"roms").resolve() if source=="roms" else (HOME_ROOT/"My Library").resolve()
                if source_path!=relative or not target.is_relative_to(root) or not target.is_file() or target.name!=rom_name or target.suffix.casefold() not in ROM_CORES:raise ValueError("imported ROM was not found")
                catalog=read_game_catalog();catalog[catalog_key]={key:str(payload.get(key,""))[:500] for key in ("title","slug","system","description","genre","year","players","controls")};catalog[catalog_key]["mosaic"]=bool(payload.get("mosaic",False));GAME_CATALOG.parent.mkdir(parents=True,exist_ok=True);temporary=GAME_CATALOG.with_suffix(".tmp");temporary.write_text(json.dumps(catalog,indent=2),encoding="utf-8");temporary.replace(GAME_CATALOG);self._json(200,{"saved":True,"game":catalog[catalog_key]})
            except (OSError,ValueError,TypeError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/backup/export":
            length=min(int(self.headers.get("Content-Length","0")),5*1024*1024)
            try: payload=json.loads(self.rfile.read(length) or b"{}")
            except ValueError: self._json(400,{"error":"invalid settings"});return
            selected=[key for key in payload.get("areas",[]) if key in BACKUP_AREAS];memory=io.BytesIO()
            with zipfile.ZipFile(memory,"w",zipfile.ZIP_DEFLATED,compresslevel=5) as archive:
                archive.writestr("homebase-backup.json",json.dumps({"format":1,"created":int(time.time()),"areas":selected,"preferences":payload.get("preferences",{}),"installed_apps":[{"id":app["id"],"name":app["name"]} for app in installed_apps().values()]},indent=2))
                for key in selected:
                    for path, relative in backup_files(key):
                        archive.write(path,"data/"+key+"/"+str(relative))
            body=memory.getvalue();self.send_response(200);self.send_header("Content-Type","application/zip");self.send_header("Content-Disposition",'attachment; filename="homebase-backup.zip"');self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body);return
        if route.path == "/api/backup/inspect":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"))
                areas=[key for key in manifest.get("areas",[]) if key in BACKUP_AREAS]
                self._json(200,{"areas":areas,"created":manifest.get("created"),"installed_apps":manifest.get("installed_apps",[]),"has_preferences":bool(manifest.get("preferences"))})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/backup/import":
            length=min(int(self.headers.get("Content-Length","0")),16*1024**3)
            try:
                with zipfile.ZipFile(io.BytesIO(self.rfile.read(length))) as archive:
                    manifest=json.loads(archive.read("homebase-backup.json"));restored=[];skipped=[]
                    requested={key for key in self.headers.get("X-Homebase-Areas","").split(",") if key};replace=self.headers.get("X-Homebase-Conflict")=="replace"
                    for key in manifest.get("areas",[]):
                        if key not in BACKUP_AREAS or requested and key not in requested: continue
                        destination=backup_destination(key);destination.mkdir(parents=True,exist_ok=True);prefix="data/"+key+"/"
                        for name in archive.namelist():
                            relative=Path(name[len(prefix):]) if name.startswith(prefix) else None
                            if not relative or name.endswith("/") or relative.is_absolute() or ".." in relative.parts: continue
                            target=destination/relative
                            if target.exists() and not replace: skipped.append(str(relative));continue
                            target.parent.mkdir(parents=True,exist_ok=True)
                            with archive.open(name) as source,target.open("wb") as output: shutil.copyfileobj(source,output)
                        restored.append(key)
                preferences=manifest.get("preferences",{}) if not requested or "preferences" in requested else {}
                self._json(200,{"restored":restored,"skipped":len(skipped),"preferences":preferences,"installed_apps":manifest.get("installed_apps",[])})
            except (zipfile.BadZipFile,KeyError,ValueError,OSError) as error:self._json(400,{"error":str(error)})
            return
        if route.path == "/api/preview":
            query = urllib.parse.parse_qs(route.query)
            slug = query.get("slug", [""])[0]
            slot = query.get("slot", ["1"])[0]
            if not re.fullmatch(r"[a-z0-9-]{2,80}", slug) or slot not in {"1", "2", "3"}:
                self._json(400, {"error": "invalid preview target"})
                return
            length = min(int(self.headers.get("Content-Length", "0")), 64 * 1024 * 1024)
            if not length:
                self._json(400, {"error": "empty capture"})
                return
            suffix = "" if slot == "1" else "-" + slot
            output = ROOT / "covers" / f"{slug}-gameplay{suffix}.gif"
            temp = tempfile.NamedTemporaryFile(prefix="nightglass-preview-", suffix=".webm", delete=False)
            try:
                remaining = length
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    temp.write(chunk)
                    remaining -= len(chunk)
                temp.close()
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", temp.name, "-vf",
                    "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
                    "-t", "6", str(output)], check=True, timeout=45)
                self._json(201, {"preview": str(output.relative_to(ROOT))})
            except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
                self._json(500, {"error": str(error)})
            finally:
                try:
                    Path(temp.name).unlink()
                except OSError:
                    pass
            return
        if route.path in {"/api/files/mkdir", "/api/files/rename", "/api/files/copy", "/api/files/trash", "/api/files/upload", "/api/files/open"}:
            length = min(int(self.headers.get("Content-Length", "0")), 1024 ** 3)
            if route.path == "/api/files/upload":
                folder = safe_home_path(urllib.parse.parse_qs(route.query).get("path", ["Desktop"])[0])
                filename = Path(urllib.parse.unquote(self.headers.get("X-File-Name", "upload.bin"))).name
                target = (folder / filename) if folder and folder.is_dir() else None
                if not target or target.exists():
                    self._json(409, {"error": "file exists or folder is invalid"})
                    return
                with target.open("wb") as handle:
                    remaining = length
                    while remaining:
                        chunk = self.rfile.read(min(1024 * 1024, remaining))
                        if not chunk:
                            break
                        handle.write(chunk)
                        remaining -= len(chunk)
                self._json(201, {"created": str(target.relative_to(HOME_ROOT))})
                return
            try:
                payload = json.loads(self.rfile.read(length) or b"{}")
            except ValueError:
                self._json(400, {"error": "invalid request"})
                return
            source = safe_home_path(payload.get("path", ""))
            try:
                if route.path == "/api/files/mkdir":
                    folder = safe_home_path(payload.get("parent", "Desktop"))
                    raw_name = str(payload.get("name", "")).strip()
                    name = Path(raw_name).name
                    if not folder or not name or name != raw_name or name in {".", ".."}:
                        raise ValueError("invalid folder")
                    target = folder / name
                    target.mkdir(exist_ok=False)
                elif route.path == "/api/files/rename":
                    raw_name = str(payload.get("name", "")).strip()
                    name = Path(raw_name).name
                    if not source or source == HOME_ROOT or not name or name != raw_name or name in {".", ".."}:
                        raise ValueError("invalid rename")
                    target = source.with_name(name)
                    if target.exists() and target != source:
                        raise ValueError("a file or folder with that name already exists")
                    source.rename(target)
                elif route.path == "/api/files/copy":
                    destination = safe_home_path(payload.get("destination", ""))
                    if not source or source == HOME_ROOT or not source.exists() or not destination or not destination.is_dir():
                        raise ValueError("invalid copy source or destination")
                    target = destination / source.name
                    if target.exists():
                        raise ValueError("a file or folder with that name already exists here")
                    if source.is_dir(): shutil.copytree(source, target)
                    else: shutil.copy2(source, target)
                elif route.path == "/api/files/trash":
                    if not source or source == HOME_ROOT:
                        raise ValueError("invalid trash target")
                    subprocess.run(["gio", "trash", str(source)], check=True)
                else:
                    if not source or not source.exists():
                        raise ValueError("file not found")
                    subprocess.Popen(["gio", "open", str(source)], start_new_session=True,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                        env={**os.environ, "DISPLAY": os.environ.get("DISPLAY", ":0")})
                self._json(201 if route.path == "/api/files/mkdir" else 200, {"ok": True, "created": str(target.relative_to(HOME_ROOT)) if route.path in {"/api/files/mkdir", "/api/files/copy"} else None})
            except (OSError, ValueError, subprocess.CalledProcessError) as error:
                self._json(400, {"error": str(error)})
            return
        multiplayer_prefix = "/api/multiplayer/"
        action_prefix = "/api/launch/"
        app_prefix = "/api/app/"
        install_prefix = "/api/install/"
        uninstall_prefix = "/api/uninstall/"
        if self.path.startswith(uninstall_prefix):
            app_id = urllib.parse.unquote(self.path[len(uninstall_prefix):])
            scope = flatpak_scopes().get(app_id)
            command = (["flatpak", "--user", "uninstall", "-y", app_id] if scope == "user" else
                       ["sudo", "flatpak", "--system", "uninstall", "-y", app_id] if scope == "system" else None)
            name = app_id
        elif self.path.startswith(install_prefix):
            app_id = urllib.parse.unquote(self.path[len(install_prefix):])
            command = [str(ROOT / "scripts/setup/install-flatpak.sh"), app_id] if re.fullmatch(r"[A-Za-z0-9_.-]+", app_id) else None
            name = app_id
        elif self.path.startswith(app_prefix):
            app_id = self.path[len(app_prefix):]
            app = installed_apps().get(app_id)
            command = ["gio", "launch", app["path"]] if app else None
            name = app["name"] if app else ""
        elif self.path.startswith(multiplayer_prefix):
            name = self.path[len(multiplayer_prefix):]
            command = [str(LAUNCHER), name] if name in ALLOWED else None
        elif self.path.startswith(action_prefix):
            name = self.path[len(action_prefix):]
            command = ACTIONS.get(name)
        else:
            command = None
            name = ""
        if not command:
            self._json(400, {"error": "unsupported action"})
            return
        if self.path.startswith(install_prefix) or self.path.startswith(uninstall_prefix):
            job = start_job("install" if self.path.startswith(install_prefix) else "uninstall", app_id, command)
            self._json(202, job)
            return
        environment = os.environ.copy()
        environment.setdefault("DISPLAY", ":0")
        subprocess.Popen(
            command,
            cwd=str(ROOT),
            start_new_session=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=environment,
        )
        self._json(202, {"started": name})


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8765), PocketArchiveHandler).serve_forever()
