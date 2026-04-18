export function renderHistory() {
  const content = document.getElementById('hub-main-content');
  if (!content) return;

  const history = window.TRANSFER_HISTORY || [];
  const formatMoney = window.formatMoney || ((v) => v + ' €');

  if (history.length === 0) {
    content.innerHTML = `
      <h2>Histórico de Transferências</h2>
      <div class="hub-box" style="padding: 30px; text-align: center; color: #aaa;">
        Nenhuma transferência registada até ao momento.<br>
        <span style="font-size:0.85em; color: #777;">As movimentações do mercado (compras, vendas e dispensas) aparecerão aqui à medida que a época avança.</span>
      </div>`;
    return;
  }

  // Copiar e inverter para mostrar as movimentações mais recentes primeiro
  const sorted = history.slice().reverse();

  let html = `<h2>Histórico de Transferências</h2>
    <div class="hub-box" style="padding: 0; overflow: hidden;">
      <table style="width:100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888; width: 60px;">Jor.</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">Jogador</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">De</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888;">Para</th>
            <th style="padding:14px 16px; background:rgba(0,0,0,0.4); border-bottom:2px solid #444; color:#888; text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>`;

  sorted.forEach((t, i) => {
    const isPurchase = t.type === 'purchase';
    const feeColor = isPurchase && t.fee > 0 ? '#4CAF50' : '#aaa';
    const feeStr = t.fee > 0 ? formatMoney(t.fee) : 'Custo Zero';
    const rowBg = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
    
    html += `<tr style="background: ${rowBg}; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
        <td style="padding:12px 16px; color:#ccc;">${t.jornada || '-'}</td>
        <td style="padding:12px 16px; font-weight:bold; color:#fff;">${t.player}</td>
        <td style="padding:12px 16px; color:#bbb;">${t.from || 'Livre'}</td>
        <td style="padding:12px 16px; color:#bbb;">${t.to || 'Livre'}</td>
        <td style="padding:12px 16px; text-align:right; font-weight:bold; color:${feeColor};">${feeStr}</td>
      </tr>`;
  });

  html += `</tbody></table></div>`;
  content.innerHTML = html;
}