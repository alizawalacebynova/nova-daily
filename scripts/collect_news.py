import hashlib
import json
import re
import urllib.request
import urllib.parse
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

COUNTRIES = [
    ("United States", "US", "en-US"), ("United Kingdom", "GB", "en-GB"),
    ("Canada", "CA", "en-CA"), ("Australia", "AU", "en-AU"),
    ("India", "IN", "en-IN"), ("Sri Lanka", "LK", "en-LK"),
    ("Japan", "JP", "en-US"), ("Germany", "DE", "en-US"),
    ("France", "FR", "en-US"), ("Brazil", "BR", "en-US"),
    ("Mexico", "MX", "en-US"), ("United Arab Emirates", "AE", "en-US"),
    ("South Africa", "ZA", "en-US"), ("New Zealand", "NZ", "en-US"),
]
SOURCES = "site:apnews.com OR site:reuters.com OR site:cnn.com"
FEEDS = []
for country_name, country_code, language in COUNTRIES:
    query = f'when:7d "{country_name}" ({SOURCES})'
    params = urllib.parse.urlencode({
        "q": query, "hl": language, "gl": country_code,
        "ceid": f"{country_code}:{language.split('-')[-1]}"
    })
    FEEDS.append((country_name, f"https://news.google.com/rss/search?{params}", country_name))
mport hashlib
import json
import re
import urllib.request
import urllib.parse
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = [
    ("Associated Press (AP)", "https://news.google.com/rss/search?q=when%3A24h+site%3Aapnews.com&hl=en-US&gl=US&ceid=US%3Aen"),
    ("Reuters", "https://news.google.com/rss/search?q=when%3A24h+site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen"),
    ("CNN", "https://news.google.com/rss/search?q=when%3A24h+site%3Acnn.com&hl=en-US&gl=US&ceid=US%3Aen"),
]

def clean(value):
    value = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", value or "", flags=re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()

def text(node, name):
    found = node.find(name)
    return clean(found.text if found is not None and found.text else "")

def image_url(item):
    # Use thumbnail/media image URLs supplied by the RSS feed.
    for element in item.iter():
        tag = element.tag.rsplit("}", 1)[-1].lower()
        if tag in ("thumbnail", "content", "enclosure"):
            candidate = element.attrib.get("url", "")
            if candidate.startswith(("https://", "http://")):
                return candidate
    description = text(item, "description")
    match = re.search(r"""<img[^>]+src=["']([^"']+)["']""", description, re.I)
    if match and match.group(1).startswith(("https://", "http://")):
        return match.group(1)
    return None

def commons_image(headline):
    """Find a reusable, openly licensed image on Wikimedia Commons."""
    stop = {"with", "from", "after", "over", "into", "about", "says", "said",
            "new", "latest", "live", "what", "this", "that", "their", "will",
            "have", "been", "are", "for", "the", "and", "but", "who", "how"}
    words = re.findall(r"[A-Za-z0-9]{3,}", headline.lower())
    query_words = []
    for word in words:
        if word not in stop and word not in query_words:
            query_words.append(word)
    if not query_words:
        return None
    params = {
        "action": "query", "generator": "search",
        "gsrsearch": " ".join(query_words[:5]), "gsrnamespace": "6",
        "gsrlimit": "8", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": "640",
        "iiextmetadatafilter": "LicenseShortName|Artist|Credit",
        "format": "json", "origin": "*",
    }
    request_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(request_url, headers={
        "User-Agent": "NOVA-DAILY/1.0 (personal news dashboard)"
    })
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
        candidates = []
        for page in data.get("query", {}).get("pages", {}).values():
            info_list = page.get("imageinfo", [])
            if not info_list:
                continue
            info = info_list[0]
            metadata = info.get("extmetadata", {})
            license_name = clean(metadata.get("LicenseShortName", {}).get("value", ""))
            lower = license_name.lower()
            if not license_name or not (
                "creative commons" in lower or lower.startswith("cc") or "public domain" in lower
            ):
                continue
            thumb = info.get("thumburl") or info.get("url")
            if not thumb:
                continue
            searchable = page.get("title", "").lower()
            score = sum(1 for word in query_words if word in searchable)
            candidates.append((score, {
                "image_url": thumb,
                "image_page_url": info.get("descriptionurl", ""),
                "image_license": license_name,
                "image_credit": clean(metadata.get("Artist", {}).get("value", "")) or
                                clean(metadata.get("Credit", {}).get("value", "")) or
                                "Wikimedia Commons contributor",
            }))
        if not candidates:
            return None
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1] if candidates[0][0] >= 1 else None
    except Exception as exc:
        print(f"Commons image search skipped: {exc}")
        return None

def category(title, summary):
    t = (title + " " + summary).lower()
    rules = [
        ("Movies", r"movie|film|box office|cinema"),
        ("TV Series", r"tv series|television|netflix|streaming|episode|drama"),
        ("Celebrity", r"celebrity|actor|actress|star"),
        ("Music", r"music|singer|album|concert"),
        ("Sports", r"sport|nba|nfl|mlb|soccer|football|tennis"),
        ("Crime", r"crime|arrest|murder|police|court"),
        ("Technology", r"technology|artificial intelligence|software|cyber"),
        ("Business", r"business|economy|stock|market|company|finance"),
        ("Science", r"science|space|nasa|research|climate"),
        ("Lifestyle", r"lifestyle|fashion|travel|food|health"),
        ("Politics", r"politic|election|congress|president|senate"),
    ]
    for name, pattern in rules:
        if re.search(pattern, t):
            return name
    return "USA News"

def parse_date(value):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
    except Exception:
        return None

stories = {}
for source_name, feed_url, country_name in FEEDS:
    request = urllib.request.Request(feed_url, headers={"User-Agent": "NOVA-DAILY/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            root = ET.fromstring(response.read())
        for item in root.findall(".//item"):
            title = text(item, "title")
            link = text(item, "link")
            summary = text(item, "description")
            if not title or not link.startswith("http"):
                continue
            # Ignore feed noise and non-story pages.
            noise = (title + " " + summary).lower()
            if any(term in noise for term in (
                "sitemap", "video playlist", "photo gallery index",
                "rss feed", "podcast feed", "newsletter sign up"
            )):
                continue
            key = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
            published = parse_date(text(item, "pubDate"))
            title_lower = title.lower()
            publisher = "Associated Press (AP)" if "ap news" in title_lower else "Reuters" if "reuters" in title_lower else "CNN" if "cnn" in title_lower else "Google News"
            stories[key] = {
                "id": "rss-" + key,
                "title": title,
                "summary": summary[:500],
                "image_url": None,
                "url": link,
                "source": publisher,
                "country": country_name,
                "category": category(title, summary),
                "published_at": published,
            }
        print(f"{source_name}: collected")
    except Exception as exc:
        print(f"{source_name}: feed unavailable - {exc}")

ordered = sorted(
    stories.values(),
    key=lambda item: item.get("published_at") or "",
    reverse=True
)[:150]

# Find Commons thumbnails for the 35 newest stories. Requests are sequential
# and rate-limited; stories without a suitable openly licensed image stay text-only.
for story in ordered[:35]:
    image = commons_image(story["title"])
    if image:
        story.update(image)
    time.sleep(0.35)

Path("news.json").write_text(
    json.dumps(ordered, ensure_ascii=False, indent=2),
    encoding="utf-8"
)
print(f"Saved {len(ordered)} headlines to news.json")
