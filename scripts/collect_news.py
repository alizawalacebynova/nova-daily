import hashlib
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = [
    ("Associated Press (AP)", "https://flipboard.com/@associatedpress/top-stories-u7govdf1z.rss"),
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
for source_name, feed_url in FEEDS:
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
            key = hashlib.sha256(link.encode("utf-8")).hexdigest()[:16]
            published = parse_date(text(item, "pubDate"))
            stories[key] = {
                "id": "rss-" + key,
                "title": title,
                "summary": summary[:500],
                "url": link,
                "source": source_name,
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

Path("news.json").write_text(
    json.dumps(ordered, ensure_ascii=False, indent=2),
    encoding="utf-8"
)
print(f"Saved {len(ordered)} headlines to news.json")
