"""Verificacao publica somente leitura; sem autenticacao ou envio de formularios."""
import json, re, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from datetime import datetime, timezone
BASE = "https://unitedidiomas.com/blog/"
AUX = ["sample-page/", "teste/", "8-2/", "pesquisa-blog/"]
def read(path):
    request = urllib.request.Request(BASE + path, headers={"User-Agent": "United-publication-check/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        content = response.read().decode()
        return {"url": BASE + path, "status": response.status,
                "robots": re.findall(r"<meta[^>]+name=['\"]robots['\"][^>]*>", content),
                "locations": re.findall(r"<loc>(.*?)</loc>", content)}
results = list(ThreadPoolExecutor(4).map(read, AUX + ["", "page-sitemap.xml", "post-sitemap.xml"]))
assert all(r["status"] == 200 for r in results)
assert all(any("noindex, follow" in meta for meta in r["robots"]) for r in results[:4])
assert any("content='index, follow" in meta for meta in results[4]["robots"])
assert not any(BASE + slug in results[5]["locations"] for slug in AUX)
assert BASE in results[5]["locations"]
assert len(results[6]["locations"]) == 188, "Revisar contagem se artigos forem publicados depois desta verificacao"
report = {"checkedAt": datetime.now(timezone.utc).isoformat(), "passed": True,
          "leadsSubmitted": 0, "requests": "GET publicos somente", "pages": results[:6],
          "publishedArticleUrls": len(results[6]["locations"])}
Path(__file__).with_name("resultado-wordpress.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"passed": True, "auxiliaryNoindex": 4, "pageSitemapUrls": len(results[5]["locations"]), "articleSitemapUrls": len(results[6]["locations"])}))
