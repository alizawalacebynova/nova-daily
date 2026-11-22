import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

COUNTRIES = [
    ("United States", "US", "en-US"), ("France", "FR", "en-US"),
    ("Mexico", "MX", "en-US"), ("United Kingdom", "GB", "en-GB"),
    ("Australia", "AU", "en-AU"), ("Canada", "CA", "en-CA"),
    ("Brazil", "BR", "en-US"), ("New Zealand", "NZ", "en-US"),
]

# A story must mention the selected country or a well-known local demonym/place.
# Edition metadata alone is never treated as proof of story relevance.
COUNTRY_KEYWORDS = {
    "United States": ("United States", "USA", "U.S.", "American", "Americans", "Washington", "New York", "Los Angeles", "California", "Texas", "Florida", "Chicago", "Boston", "Seattle", "Miami", "Alaska", "Hawaii"),
    "France": ("France", "French", "Paris", "Marseille", "Lyon", "Nice", "Bordeaux", "Toulouse", "French Riviera"),
    "Mexico": ("Mexico", "Mexican", "Mexico City", "Guadalajara", "Monterrey", "Cancun", "Tijuana", "Puebla", "Oaxaca"),
    "United Kingdom": ("United Kingdom", "Britain", "British", "England", "English", "Scotland", "Scottish", "Wales", "Welsh", "Northern Ireland", "London", "Manchester", "Liverpool", "Birmingham", "Edinburgh", "Glasgow", "Cardiff"),
    "Australia": ("Australia", "Australian", "Sydney", "Melbourne", "Brisbane", "Perth", "Canberra", "Adelaide", "Tasmania"),
    "Canada": ("Canada", "Canadian", "Toronto", "Ottawa", "Vancouver", "Montreal", "Québec", "Quebec", "Calgary", "Edmonton", "Winnipeg"),
    "Brazil": ("Brazil", "Brazilian", "Brasília", "Sao Paulo", "São Paulo", "Rio de Janeiro", "Amazonas", "Rio Grande do Sul"),
    "New Zealand": ("New Zealand", "New Zealander", "Kiwi", "Auckland", "Wellington", "Christchurch", "Hamilton", "Dunedin"),
}
PUBLISHERS = "(site:apnews.com OR site:reuters.com OR site:cnn.com)"

def clean(value):
    value = re.sub(r"<[^>]*>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()

def node_text(node, name):
    found = node.find(name)
    return clean(found.text if found is not None and found.text else "")

def parse_date(value):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception:
        return None

def category(title, summary):
    value = (title + " " + summary).lower()
    rules = [
        ("Sports", r"sport|nba|nfl|mlb|ncaa|soccer|football|basketball|tennis"),
        ("Technology", r"technology|artificial intelligence|software|cyber|robot"),
        ("Business", r"business|economy|stock|market|company|finance"),
        ("Science", r"science|space|nasa|research|climate"),
        ("Crime", r"crime|arrest|murder|police|court"),
        ("Politics", r"politic|election|congress|president|senate"),
        ("Lifestyle", r"lifestyle|fashion|travel|food|health"),
        ("Music", r"music|singer|album|concert"),
        ("Movies", r"movie|film|box office|cinema"),
        ("TV Series", r"tv series|television|netflix|streaming|episode|drama"),
        ("Celebrity", r"celebrity|actor|actress|star"),
    ]
    for name, pattern in rules:
        if re.search(pattern, value):
            return name
    return "World News"

def publisher(title):
    value = title.lower()
    if "ap news" in value:
        return "Associated Press (AP)"
    if "reuters" in value:
        return "Reuters"
    if "cnn" in value:
        return "CNN"
    return "Google News"

def is_relevant_to_country(country_name, title, summary):
    text = title + " " + summary
    for keyword in COUNTRY_KEYWORDS[country_name]:
        if re.search(r"(?<!\\w)" + re.escape(keyword) + r"(?!\\w)", text, flags=re.IGNORECASE):
            return True
    return False

def is_generic_section_page(title):
    # Exclude navigation/edition pages such as "England - AP News".
    return bool(re.fullmatch(
        r"[^|:–—-]{2,55}\\s*[-|:–—]\\s*(?:AP News|Reuters|CNN)",
        title.strip(),
        flags=re.IGNORECASE,
    ))

stories = {}
for country_name, country_code, language in COUNTRIES:
    region = language.split("-")[-1]
    query = f'when:7d "{country_name}" {PUBLISHERS}'
    params = urllib.parse.urlencode({
        "q": query, "hl": language, "gl": country_code,
        "ceid": f"{country_code}:{region}",
    })
    feed_url = "https://news.google.com/rss/search?" + params
    request = urllib.request.Request(feed_url, headers={"User-Agent": "NOVA-DAILY/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            root = ET.fromstring(response.read())
        count = 0
        for item in root.findall(".//item"):
            title = node_text(item, "title")
            link = node_text(item, "link")
            summary = node_text(item, "description")
            if not title or not link.startswith("http"):
                continue
            if is_generic_section_page(title):
                continue
            if not is_relevant_to_country(country_name, title, summary):
                continue
            noise = (title + " " + summary).lower()
            if any(term in noise for term in ("sitemap", "rss feed", "podcast feed", "newsletter sign up")):
                continue
            key = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
            story = {
                "id": "rss-" + key,
                "title": title,
                "summary": summary[:500] or "Open the original report for details.",
                "image_url": None,
                "url": link,
                "source": publisher(title),
                "country": country_name,
                "category": category(title, summary),
                "published_at": parse_date(node_text(item, "pubDate")),
            }
            if key not in stories:
                stories[key] = story
                count += 1
        print(f"{country_name}: collected {count} new stories")
    except Exception as exc:
        print(f"{country_name}: feed unavailable - {exc}")

ordered = sorted(
    stories.values(),
    key=lambda item: item.get("published_at") or "",
    reverse=True,
)[:300]
Path("news.json").write_text(
    json.dumps(ordered, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Saved {len(ordered)} country-tagged headlines to news.json")
