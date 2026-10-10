// 機場頁：航班資訊看板風格的價目表，選了地區後底部出現預約列
(async () => {
  'use strict';
  const { $, $$, fmt, money, DIR, areasOf, lineMessageUrl, ready } = window.Huanyu;
  const data = await ready;
  if (!data) return;

  const airport = data.airports.find(a => a.id === document.body.dataset.airport);
  if (!airport) return;

  const state = { vehicleId: data.vehicles[0].id, dir: 'send', areaName: null };

  const vehicle = () => data.vehicles.find(v => v.id === state.vehicleId);
  const selectedArea = () => areasOf(airport).find(a => a.name === state.areaName);
  const priceOf = (area, dir) => area.prices[state.vehicleId][DIR[dir].index];

  function renderTabs() {
    $('#vehicle-tabs').innerHTML = data.vehicles.map(v => `
      <button type="button" data-vehicle="${v.id}" aria-pressed="${v.id === state.vehicleId}">
        ${v.name}<small>${v.seats}</small>
      </button>`).join('');
  }

  function renderBoard() {
    $('#board-caption').textContent = `${airport.name} ${vehicle().name} 接送價目表`;
    $('#board-body').innerHTML = airport.groups.map(g => `
      <tr class="group"><th scope="colgroup" colspan="3">${g.name}</th></tr>
      ${g.areas.map(a => `
        <tr class="${a.name === state.areaName ? 'is-selected' : ''}">
          <td><button type="button" class="row-pick" data-area="${a.name}" aria-pressed="${a.name === state.areaName}">${a.name}</button></td>
          <td class="num" data-label="送機">${fmt(priceOf(a, 'send'))}</td>
          <td class="num" data-label="接機">${fmt(priceOf(a, 'pickup'))}</td>
        </tr>`).join('')}
    `).join('');
  }

  function renderPremium() {
    const box = $('#premium');
    const p = airport.premium;
    box.hidden = !p;
    if (!p) return;
    $('#premium-title').textContent = p.name;
    $('#premium-caption').textContent = p.caption;
    $('#premium-body').innerHTML = p.rows.map(([name, price]) =>
      `<tr><td>${name}</td><td class="num">${fmt(price)}</td></tr>`).join('');
  }

  function renderNotes() {
    const notes = [...(data.notes || []), ...(airport.notes || [])];
    $('#notes').innerHTML = notes.map(n => `<li>${n}</li>`).join('');
  }

  function renderBar() {
    const area = selectedArea();
    $('#quote-bar').hidden = !area;
    document.body.classList.toggle('has-quote-bar', Boolean(area));
    if (!area) return;
    const price = priceOf(area, state.dir);
    $('#qb-area').textContent = area.name;
    $('#qb-vehicle').textContent = `${airport.name}，${vehicle().name}`;
    $('#qb-price').textContent = fmt(price);
    $$('input[name="qbdir"]').forEach(r => { r.checked = r.value === state.dir; });
    $('#qb-line').href = lineMessageUrl([
      '您好，我想預約：',
      `服務：${DIR[state.dir].label}`,
      `機場：${airport.name}`,
      `地區：${area.name}`,
      `車型：${vehicle().name}`,
      `報價：${money(price)}`,
    ].join('\n'));
  }

  $('#vehicle-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-vehicle]');
    if (!b) return;
    state.vehicleId = b.dataset.vehicle;
    renderTabs();
    renderBoard();
    renderBar();
  });

  $('#board-body').addEventListener('click', e => {
    const b = e.target.closest('[data-area]');
    if (!b) return;
    state.areaName = state.areaName === b.dataset.area ? null : b.dataset.area;
    renderBoard();
    renderBar();
  });

  $('#quote-bar').addEventListener('change', e => {
    if (e.target.name === 'qbdir') { state.dir = e.target.value; renderBar(); }
  });

  renderTabs();
  renderBoard();
  renderPremium();
  renderNotes();
  renderBar();
})();
