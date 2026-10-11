// 所有頁面共用：店家資料、價目資料載入、小工具。
// 各頁面的程式（home.js、airport.js）從 window.Huanyu 取用。
(() => {
  'use strict';

  const SITE = window.SITE || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => n.toLocaleString('en-US');
  const money = n => `NT$ ${fmt(n)}`;

  // 送機 / 接機：價格在 prices.json 裡是 [送機, 接機]
  const DIR = {
    send:   { label: '送機', index: 0 },
    pickup: { label: '接機', index: 1 },
  };

  const areasOf = airport => airport.groups.flatMap(g => g.areas);
  const minPrice = airport =>
    Math.min(...areasOf(airport).flatMap(a => Object.values(a.prices).flat()));
  const toIntl = n => {
    const d = (n || '').replace(/\D/g, '');
    return d.startsWith('0') ? '886' + d.slice(1) : d;
  };

  /* 店家資料（來自 js/config.js）填進頁面 */
  function applySiteInfo() {
    const links = {
      phone: `tel:+${toIntl(SITE.phone)}`,
      ownerPhone: `tel:+${toIntl(SITE.ownerPhone)}`,
      line: `https://line.me/R/ti/p/${encodeURIComponent(SITE.lineId || '')}`,
      whatsapp: `https://wa.me/${toIntl(SITE.phone)}`,
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address || '')}`,
    };
    $$('[data-text]').forEach(el => {
      const value = SITE[el.dataset.text];
      if (value) el.textContent = value;
    });
    $$('[data-link]').forEach(el => { el.href = links[el.dataset.link] || '#'; });
    if (SITE.showWhatsapp === false) $$('[data-whatsapp]').forEach(el => { el.hidden = true; });
  }

  // 官方 LINE 的「帶入預約內容」連結
  const lineMessageUrl = text =>
    `https://line.me/R/oaMessage/${encodeURIComponent(SITE.lineId || '')}/?${encodeURIComponent(text)}`;

  // 載入價目資料；失敗時顯示頁面上的錯誤提示
  const ready = fetch('data/prices.json')
    .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then(data => {
      $$('[data-min-airport]').forEach(el => {
        const a = data.airports.find(x => x.id === el.dataset.minAirport);
        if (a) el.textContent = fmt(minPrice(a));
      });
      return data;
    })
    .catch(err => {
      console.error('無法載入 data/prices.json', err);
      $$('.js-error').forEach(el => { el.hidden = false; });
      return null;
    });

  applySiteInfo();
  window.Huanyu = { SITE, $, $$, fmt, money, DIR, areasOf, minPrice, lineMessageUrl, reduceMotion, ready };
})();
