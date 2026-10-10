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
    send:   { label: '送機', index: 0, timeLabel: '上車時間',     addressLabel: '上車地址', flightLabel: '起飛航班（選填）' },
    pickup: { label: '接機', index: 1, timeLabel: '航班抵達時間', addressLabel: '下車地址', flightLabel: '抵達航班（選填）' },
  };

  let data = null;
  const state = { dir: 'send', airportId: null, vehicleId: null, areaName: null };
  let lastPrice = null;

  /* ---------- 店家資料（來自 js/config.js） ---------- */
  function applySiteInfo() {
    const digits = (SITE.phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('0') ? '886' + digits.slice(1) : digits;
    const links = {
      phone: `tel:+${intl}`,
      line: `https://line.me/R/ti/p/${encodeURIComponent(SITE.lineId || '')}`,
      whatsapp: `https://wa.me/${intl}`,
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address || '')}`,
    };
    $$('[data-text]').forEach(el => {
      const value = SITE[el.dataset.text];
      if (value) el.textContent = value;
    });
    $$('[data-link]').forEach(el => { el.href = links[el.dataset.link] || '#'; });
    if (SITE.showWhatsapp === false) $$('[data-whatsapp]').forEach(el => { el.hidden = true; });
  }

  /* ---------- 資料存取 ---------- */
  const airport = () => data.airports.find(a => a.id === state.airportId);
  const vehicle = () => data.vehicles.find(v => v.id === state.vehicleId);
  const areasOf = a => a.groups.flatMap(g => g.areas);
  const currentArea = () => {
    const list = areasOf(airport());
    return list.find(x => x.name === state.areaName) || list[0];
  };
  const priceFor = (area, vehicleId = state.vehicleId, dir = state.dir) =>
    area.prices[vehicleId][DIR[dir].index];

  /* ---------- 組出預約訊息 ---------- */
  function quoteLines() {
    const area = currentArea();
    return [
      `服務：${DIR[state.dir].label}`,
      `機場：${airport().name}`,
      `地區：${area.name}`,
      `車型：${vehicle().name}`,
      `報價：${money(priceFor(area))}`,
    ];
  }

  function buildMessage(withForm) {
    const lines = [`【${SITE.brand || ''} 預約】`, ...quoteLines()];
    if (withForm) {
      const d = DIR[state.dir];
      const v = id => ($(id).value || '').trim();
      const date = v('#f-date'), time = v('#f-time');
      const rows = [
        ['姓名', v('#f-name')],
        ['電話', v('#f-phone')],
        ['日期', date],
        [d.timeLabel, time],
        [d.addressLabel, v('#f-address')],
        [d.flightLabel.replace('（選填）', ''), v('#f-flight')],
        ['人數', v('#f-pax')],
        ['行李數', v('#f-bags')],
        ['備註', v('#f-note')],
      ];
      rows.forEach(([name, value]) => { if (value) lines.push(`${name}：${value}`); });
    }
    return lines.join('\n');
  }

  const lineMessageUrl = text =>
    `https://line.me/R/oaMessage/${encodeURIComponent(SITE.lineId || '')}/?${encodeURIComponent(text)}`;

  /* ---------- 畫面：試算表單 ---------- */
  function renderEstimatorControls() {
    // 機場
    const airportSel = $('#airport');
    airportSel.innerHTML = data.airports
      .map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    airportSel.value = state.airportId;

    // 地區（依區域分組）
    const areaSel = $('#area');
    areaSel.innerHTML = airport().groups.map(g =>
      `<optgroup label="${g.name}">${g.areas.map(a =>
        `<option value="${a.name}">${a.name}</option>`).join('')}</optgroup>`).join('');
    areaSel.value = currentArea().name;
    state.areaName = areaSel.value;

    // 送機 / 接機、車型
    $$('input[name="dir"]').forEach(r => { r.checked = r.value === state.dir; });
    $$('input[name="vehicle"]').forEach(r => { r.checked = r.value === state.vehicleId; });
  }

  function renderVehicleChips() {
    $('#vehicle-chips').innerHTML = data.vehicles.map(v => `
      <label>
        <input type="radio" name="vehicle" value="${v.id}">
        <span>${v.name}<small>${v.seats}</small></span>
      </label>`).join('');
  }

  function renderPrice() {
    const area = currentArea();
    const price = priceFor(area);
    const el = $('#price');
    el.textContent = fmt(price);
    if (lastPrice !== null && lastPrice !== price && !reduceMotion) {
      el.animate(
        [{ transform: 'translateY(35%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 220, easing: 'ease-out' }
      );
    }
    lastPrice = price;
    $('#price-desc').textContent = `${DIR[state.dir].label}，${airport().name}，${vehicle().name}，${area.name}`;
    $('#quote-line').href = lineMessageUrl(['您好，我想預約：', ...quoteLines()].join('\n'));
  }

  /* ---------- 畫面：價目表 ---------- */
  function renderTableControls() {
    const airportTabs = $('#airport-tabs');
    airportTabs.innerHTML = data.airports.map(a =>
      `<button type="button" data-airport="${a.id}" aria-pressed="${a.id === state.airportId}">${a.name}</button>`).join('');
    const vehicleTabs = $('#vehicle-tabs');
    vehicleTabs.innerHTML = data.vehicles.map(v =>
      `<button type="button" data-vehicle="${v.id}" aria-pressed="${v.id === state.vehicleId}">${v.name}</button>`).join('');
  }

  function renderTable() {
    const a = airport();
    const selected = currentArea().name;
    $('#table-caption').textContent = `${a.name} ${vehicle().name} 接送價目表`;
    $('#price-body').innerHTML = a.groups.map(g => `
      <tr class="group"><th scope="colgroup" colspan="3">${g.name}</th></tr>
      ${g.areas.map(area => `
        <tr class="${area.name === selected ? 'is-selected' : ''}">
          <td><button type="button" class="row-pick" data-area="${area.name}">${area.name}</button></td>
          <td class="num">${fmt(priceFor(area, state.vehicleId, 'send'))}</td>
          <td class="num">${fmt(priceFor(area, state.vehicleId, 'pickup'))}</td>
        </tr>`).join('')}
    `).join('');
  }

  /* ---------- 畫面：預約表單 ---------- */
  function renderBooking() {
    const d = DIR[state.dir];
    $('#l-time').textContent = d.timeLabel;
    $('#l-address').textContent = d.addressLabel;
    $('#l-flight').textContent = d.flightLabel;
    const area = currentArea();
    $('#booking-summary').textContent =
      `${d.label}，${airport().name}，${vehicle().name}，${area.name}，${money(priceFor(area))}`;
    $('#preview').value = buildMessage(true);
  }

  function renderAll() {
    renderEstimatorControls();
    renderPrice();
    renderTableControls();
    renderTable();
    renderBooking();
  }

  /* ---------- 事件 ---------- */
  function bindEvents() {
    // 試算表單
    $('#estimator').addEventListener('change', e => {
      const t = e.target;
      if (t.name === 'dir') state.dir = t.value;
      if (t.id === 'airport') { state.airportId = t.value; state.areaName = null; }
      if (t.id === 'area') state.areaName = t.value;
      if (t.name === 'vehicle') state.vehicleId = t.value;
      renderAll();
    });
    $('#estimator').addEventListener('submit', e => e.preventDefault());

    // 價目表：機場、車型、點地區帶入試算
    $('#airport-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-airport]');
      if (!b) return;
      state.airportId = b.dataset.airport;
      state.areaName = null;
      renderAll();
    });
    $('#vehicle-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-vehicle]');
      if (!b) return;
      state.vehicleId = b.dataset.vehicle;
      renderAll();
    });
    $('#price-body').addEventListener('click', e => {
      const b = e.target.closest('[data-area]');
      if (!b) return;
      state.areaName = b.dataset.area;
      renderAll();
      $('#estimator').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });

    // 預約表單
    const form = $('#booking-form');
    form.addEventListener('input', () => { $('#preview').value = buildMessage(true); });
    form.addEventListener('submit', e => {
      e.preventDefault(); // 只有通過必填檢查才會進到這裡
      window.open(lineMessageUrl(buildMessage(true)), '_blank', 'noopener');
    });
    $('#copy-btn').addEventListener('click', async () => {
      const text = $('#preview').value;
      const status = $('#copy-status');
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = '已複製預約內容';
      } catch {
        $('#preview').select();
        status.textContent = document.execCommand('copy') ? '已複製預約內容' : '複製失敗，請手動選取文字';
      }
      setTimeout(() => { status.textContent = ''; }, 3000);
    });

    // 日期不能選過去
    $('#f-date').min = new Date().toLocaleDateString('sv-SE');
  }

  /* ---------- 啟動 ---------- */
  async function init() {
    applySiteInfo();
    try {
      const res = await fetch('data/prices.json');
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      console.error('無法載入 data/prices.json', err);
      $('#estimator-error').hidden = false;
      return;
    }

    state.airportId = data.airports[0].id;
    state.vehicleId = data.vehicles[0].id;

    // 首頁標題的「起」價：取第一個機場的最低價
    const min = Math.min(...areasOf(data.airports[0]).flatMap(a => Object.values(a.prices).flat()));
    $$('[data-min-price]').forEach(el => { el.textContent = fmt(min); });

    if (data.updated) {
      const [y, m] = data.updated.split('-');
      $('#price-updated').textContent = ` 價格更新：${y} 年 ${Number(m)} 月。`;
    }
    $('#notes').innerHTML = (data.notes || []).map(n => `<li>${n}</li>`).join('');

    renderVehicleChips();
    bindEvents();
    renderAll();
  }

  init();
})();
