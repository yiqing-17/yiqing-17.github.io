#!/usr/bin/env python3
"""把 src/ 裡的範本組裝成可直接部署的靜態網頁（只用 Python 標準函式庫）。

用法：
    python build.py

要新增或調整頁面，只需要改下面的 AIRPORTS、NAV、PAGES 三個設定。
產生出來的 .html 檔要一起 commit，GitHub Pages 才有東西可以顯示。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_URL = "https://yiqing-17.github.io/"

# ---------------------------------------------------------------- 設定 ----

# 機場：id 要和 data/prices.json 裡的機場 id 相同，也是頁面的檔名（tpe -> tpe.html）
AIRPORTS = [
    dict(id="tpe", code="TPE", name="桃園機場",
         title="桃園機場接送價目表｜台北到桃園機場 900 元起｜寰宇機場接送",
         description="桃園機場送機、接機價目表：國產轎車、休旅車、九人座商務車與賓士，台北、新北、桃園、新竹、苗栗、台中、宜蘭、南部各地區單趟報價。24 小時接受預約。",
         h1="桃園機場接送價目表",
         intro="送機與接機單趟報價，涵蓋台北、新北、桃園、新竹、苗栗、中部、宜蘭與南部。"),
    dict(id="tsa", code="TSA", name="松山機場",
         title="松山機場接送價目表｜台北 900 元起｜寰宇機場接送",
         description="松山機場送機、接機價目表：國產轎車、休旅車、九人座商務車與賓士，台北、新北、桃竹苗、中部、南部與東部各地區單趟報價。24 小時接受預約。",
         h1="松山機場接送價目表",
         intro="松山機場送機與接機單趟報價，接機價為送機價加 100 元。"),
    dict(id="rmq", code="RMQ", name="台中清泉崗機場",
         title="台中清泉崗機場接送價目表｜台中市區 900 元起｜寰宇機場接送",
         description="台中清泉崗機場送機、接機價目表：國產轎車、休旅車、九人座商務車與賓士，台中、彰化、南投、雲林、嘉義與全台各地區單趟報價。24 小時接受預約。",
         h1="台中清泉崗機場接送價目表",
         intro="台中清泉崗機場送機與接機單趟報價，接機價為送機價加 100 元。"),
]

# 導覽列：(文字, 連結, 對應的頁面檔名)
# 還沒拆成獨立頁面的項目，暫時連到 all.html 的對應區塊；之後拆好只要改這裡。
NAV = [
    ("首頁", "index.html"),
    ("桃園機場", "tpe.html"),
    ("松山機場", "tsa.html"),
    ("清泉崗機場", "rmq.html"),
    ("車隊", "all.html#fleet"),
    ("服務須知", "all.html#terms"),
    ("預約", "all.html#booking"),
    ("司機招募", "all.html#recruit"),
]

# ---------------------------------------------------------------- 工具 ----


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def render(template, variables):
    """先展開 {{> partial}}，再取代 {{變數}}。"""
    def include(m):
        return render(read(SRC / "partials" / f"{m.group(1)}.html"), variables).rstrip("\n")
    text = re.sub(r"\{\{>\s*(\w+)\s*\}\}", include, template)

    def var(m):
        key = m.group(1)
        if key not in variables:
            raise KeyError(f"範本用到沒有定義的變數：{key}")
        return str(variables[key])
    return re.sub(r"\{\{(\w+)\}\}", var, text)


def min_price(airport):
    return min(p for g in airport["groups"] for a in g["areas"]
               for pair in a["prices"].values() for p in pair)


def nav_html(current):
    items = []
    for label, href in NAV:
        attr = ' aria-current="page"' if href == current else ""
        items.append(f'      <a href="{href}"{attr}>{label}</a>')
    return "\n".join(items)


def gate_html(a, prices):
    price = min_price(prices[a["id"]])
    return (
        f'        <a class="gate" href="{a["id"]}.html">\n'
        f'          <span class="gate-code" aria-hidden="true">{a["code"]}</span>\n'
        f'          <span class="gate-name">{a["name"]}</span>\n'
        f'          <span class="gate-price">最低 NT$ <b data-min-airport="{a["id"]}">{price:,}</b> 起</span>\n'
        f'          <span class="gate-go">查看價目表</span>\n'
        f'        </a>'
    )


# ---------------------------------------------------------------- 主程式 ----


def main():
    data = json.loads(read(ROOT / "data" / "prices.json"))
    prices = {a["id"]: a for a in data["airports"]}
    missing = [a["id"] for a in AIRPORTS if a["id"] not in prices]
    if missing:
        raise SystemExit(f"prices.json 裡找不到這些機場：{missing}")

    base = dict(
        site_url=SITE_URL,
        href_fleet=dict(NAV)["車隊"],
        min_price=f"{min_price(prices[AIRPORTS[0]['id']]):,}",
        gates="\n".join(gate_html(a, prices) for a in AIRPORTS),
    )

    outputs = []

    # 首頁
    out = "index.html"
    write(ROOT / out, render(read(SRC / "pages" / "index.html"), dict(
        base, nav=nav_html(out),
        title="寰宇機場接送｜桃園機場接送價格最低 900 元起｜台北到桃園機場｜機場包車旅遊",
        description="提供 24 小時專業接送、商務出差包車與全台九人座旅遊用車。台北至桃園機場最低 900 元起，選好地區與車型馬上看到價格。預約專線：0900-043-688。",
        url=SITE_URL,
    )))
    outputs.append(out)

    # 機場頁：同一份範本，依機場設定產生
    for a in AIRPORTS:
        out = f'{a["id"]}.html'
        others = [o for o in AIRPORTS if o["id"] != a["id"]]
        write(ROOT / out, render(read(SRC / "pages" / "airport.html"), dict(
            base, nav=nav_html(out),
            title=a["title"], description=a["description"], url=SITE_URL + out,
            airport_id=a["id"], code=a["code"], h1=a["h1"], intro=a["intro"],
            other_gates="\n".join(gate_html(o, prices) for o in others),
        )))
        outputs.append(out)

    # sitemap.xml
    urls = [SITE_URL if o == "index.html" else SITE_URL + o for o in outputs]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url>\n    <loc>{u}</loc>\n  </url>" for u in urls]
    sitemap.append("</urlset>")
    write(ROOT / "sitemap.xml", "\n".join(sitemap) + "\n")

    print("built:", ", ".join(outputs + ["sitemap.xml"]))


if __name__ == "__main__":
    main()
