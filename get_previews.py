import urllib.request, json
data = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/scrib/previews/').read())
for item in data:
    slug = item.get("slug") or item.get("title").lower().replace(" ", "-")
    print(f'  <url>\n    <loc>https://scrib.easylearnova.com/topic/{slug}</loc>\n    <priority>0.8</priority>\n  </url>')
