import urllib.request, json
data = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/scrib/previews/').read())

urls = []
for item in data:
    slug = item.get("slug") or item.get("title").lower().replace(" ", "-")
    urls.append(f'  <url>\n    <loc>https://scrib.easylearnova.com/topic/{slug}</loc>\n    <priority>0.8</priority>\n  </url>')

urls_xml = '\n'.join(urls)

base_sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://scrib.easylearnova.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://scrib.easylearnova.com/previews</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://scrib.easylearnova.com/pricing</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://scrib.easylearnova.com/generate</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://scrib.easylearnova.com/terms</loc>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://scrib.easylearnova.com/privacy</loc>
    <priority>0.5</priority>
  </url>
{urls_xml}
</urlset>
"""

with open('scrib-frontend/public/sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(base_sitemap)
