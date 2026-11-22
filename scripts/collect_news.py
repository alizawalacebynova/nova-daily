import hashlib
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

COUNTRIES = [
    ("United States", "US", "en-US"),
    ("United Kingdom", "GB", "en-GB"),
    ("Canada", "CA", "en-CA"),
    ("Australia", "AU", "en-AU"),
    ("India", "IN", "en-IN"),
    ("Sri Lanka", "LK", "en-LK"),
    ("Japan", "JP", "en-US"),
    ("Germany", "DE", "en-US"),
    ("France", "FR", "en-US"),
    ("Brazil", "BR", "en-US"),
    ("Mexico", "MX", "en-US"),
    ("United Arab Emirates", "AE", "en-US"),
    ("South Africa", "ZA", "en-US"),
    ("New Zealand", "NZ", "en-US"),
]
PUBLISHERS = "(site:apnews.com OR site:reuters.com OR site:cnn.com)"

def clean(value):
    value = re.sub(r"<!\\[CDATA\\[(.*?)\\]\\]>", r"\\1", value or "", flags=re.S)
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\\s+", " ", value).strip()

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
        ("Technology", r"technology|artificial intelligence|\\bai\\b|software|cyber"),
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

stories = {}
for country_name, country_code, language in COUNTRIES:
    query = f'when:7d "{country_name}" {PUBLISHERS}'
    params = urllib.parse.urlencode({
        "q": query,
        "hl": language,
        "gl": country_code,
        "ceid": f"{country_code}:{language.split("-")[-1]}",
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
            noise = (title + " " + summary).lower()
            if any(term in noise for term in ("sitemap", "rss feed", "podcast feed", "newsletter sign up")):
                continue
            key = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
            published = parse_date(node_text(item, "pubDate"))
            story = {
                "id": "rss-" + key,
                "title": title,
                "summary": summary[:500] or "Open the original report for details.",
                "image_url": None,
                "url": link,
                "source": publisher(title),
                "country": country_name,
                "category": category(title, summary),
                "published_at": published,
            }
            # Keep the first country edition for a duplicate article.
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
