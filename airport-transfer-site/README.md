# 機場接送網站（純 HTML / CSS / JavaScript）

機場接送與包車服務的單頁式網站範本。沒有框架、沒有建置步驟，價格放在 JSON 檔裡，改價格不用動版面。

## 功能

- **價格試算**：選接機或送機、機場、地區、車型，即時顯示價格
- **價目表**：依機場與車型切換，點地區名稱可帶入試算
- **預約表單**：填完後自動組成預約訊息，一鍵傳到 LINE 或複製
- **手機優先**：手機版有固定在畫面下方的電話、LINE、WhatsApp 按鈕
- **SEO**：獨立的 title / description、JSON-LD 結構化資料、`sitemap.xml`、`robots.txt`
- **無障礙**：鍵盤可操作、有焦點外框、支援「減少動態效果」設定

## 在本機執行

網站會用 `fetch` 讀取 `data/prices.json`，所以不能直接點兩下開啟 `index.html`，請用本機伺服器：

```bash
python3 -m http.server 8000
# 瀏覽器開啟 http://localhost:8000
```

## 專案結構

```
.
├── index.html
├── css/style.css
├── js/
│   ├── config.js      # 店名、電話、LINE、地址
│   └── app.js         # 試算、價目表、預約訊息
├── data/prices.json   # 所有價格（機場、車型、地區、備註、Alphard）
├── data/fleet.json    # 車隊照片與規格
├── images/            # 車型照片（webp）與 Logo
├── favicon.svg
├── robots.txt
└── sitemap.xml
```

## 目前的資料狀態

資料來自寰宇機場接送原站（桃園機場以網頁文字表為準，松山、清泉崗、Alphard 為價目圖轉錄）：

- 桃園機場：4 種車型 × 29 個地區，已與原站文字表逐筆核對
- 松山機場：4 種車型 × 30 個地區（接機價為送機價加 100 元）
- 台中清泉崗機場：4 種車型 × 20 個地區（接機價為送機價加 100 元）
- Alphard 尊爵：桃園與松山各 8 個地區（送機、接機統一價）
- 車隊：11 款車型照片與規格，在 `data/fleet.json`
- 服務特色、費用與搭乘須知、店家聯絡資料

## 上線前請店家確認

- [ ] **桃園機場有兩套價格**：網頁文字表（接機加 100 元）與價目圖（接機加 200 元，地區分得比較粗，例如桃園市區以內 800 元）不一致，目前採用網頁文字表
- [ ] **基隆市**：網頁文字表的北部與東部各列一次，休旅車、九人座、賓士兩處價格不同，目前採用北部價格
- [ ] **車型載客與行李數**不一致：官網車型說明為轎車 4 人 2 件、休旅 4 人 4 件、九人座 8 人 8 件；價目圖為 3 人 2 件、4 人 3 件、7 人 7 件。目前採用官網車型說明
- [ ] 預約專線（0900-043-688）與老闆電話（0956-602-888）哪一支為主要號碼
- [ ] 價格選項上的車型照片對應：轎車 Camry、休旅 bZ4X、九人座商務車 Staria、賓士 V-Class，可在 `data/prices.json` 的 `image` 修改
- [ ] 網址目前設為 `https://yiqing-17.github.io/`，若更換網址，需修改 `index.html` 的 canonical、og:url、JSON-LD，以及 `robots.txt`、`sitemap.xml`

### 修改價格

`data/prices.json` 的結構：

```json
{
  "vehicles": [{ "id": "sedan", "name": "國產五人座轎車", "seats": "5 人" }],
  "airports": [{
    "id": "tpe",
    "name": "桃園機場",
    "groups": [{
      "name": "北部",
      "areas": [{
        "name": "桃園市（桃園、中壢）",
        "prices": { "sedan": [900, 1000] }
      }]
    }]
  }]
}
```

`prices` 裡每個陣列是 `[送機價, 接機價]`，每個地區都要填滿所有 `vehicles` 的 `id`。要新增機場，就在 `airports` 加一筆。

## 部署

### GitHub Pages（免費）

1. 把專案推到 GitHub
2. Repo 的 Settings → Pages → Source 選 `main` 分支、根目錄
3. 幾分鐘後會得到 `https://<帳號>.github.io/<repo>/`
4. 要綁自己的網域，在同頁填入 Custom domain，並到網域商設定 DNS

### Cloudflare Pages / Netlify

連結 GitHub repo，建置指令留空，輸出目錄填 `/`。

## 授權

MIT，見 `LICENSE`。
