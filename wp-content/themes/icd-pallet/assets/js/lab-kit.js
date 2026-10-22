/* ICD Pallet - bộ vẽ "thật" cho phòng mô phỏng (v7): khối 3D xiên, đổ bóng, vật liệu, xe nâng chi tiết.
   Mọi hàm trả về chuỗi SVG. Toạ độ: (x,y) = góc trước-dưới-trái của vật, trục xiên đi lên-phải. */
window.LabKit = (function () {
  var NS = 'http://www.w3.org/2000/svg', reg = {}, defsEl = null;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function shade(h, p) { var c = hex2rgb(h).map(function (v) { return Math.round(clamp(p >= 0 ? v + (255 - v) * p : v * (1 + p), 0, 255)); }); return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function ensureDefs() {
    if (defsEl) return defsEl;
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = '<defs>' +
      '<filter id="kBlur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '<filter id="kBlur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<filter id="kBlur9" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="kNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="kGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035 .6" numOctaves="3" seed="9" result="n"/><feColorMatrix in="n" values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .5 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1EEE6"/><stop offset="1" stop-color="#D9D4C6"/></linearGradient>' +
      '<linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5B0A3"/><stop offset=".5" stop-color="#A29D91"/><stop offset="1" stop-color="#8C877B"/></linearGradient>' +
      '<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A515D"/><stop offset=".35" stop-color="#C5CBD3"/><stop offset=".55" stop-color="#8D95A1"/><stop offset="1" stop-color="#3D434D"/></linearGradient>' +
      '<linearGradient id="gSteelV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9CED6"/><stop offset=".5" stop-color="#8A929E"/><stop offset="1" stop-color="#4C535E"/></linearGradient>' +
      '<linearGradient id="gOrange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA23D"/><stop offset=".45" stop-color="#F57C0B"/><stop offset="1" stop-color="#B94F00"/></linearGradient>' +
      '<linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A404B"/><stop offset="1" stop-color="#171A20"/></linearGradient>' +
      '<linearGradient id="gCardF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDB77F"/><stop offset="1" stop-color="#C39A60"/></linearGradient>' +
      '<linearGradient id="gCardT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBCB98"/><stop offset="1" stop-color="#DDB77F"/></linearGradient>' +
      '<linearGradient id="gCardS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B58C55"/><stop offset="1" stop-color="#9C7440"/></linearGradient>' +
      '<linearGradient id="gWrap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset=".6" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/></linearGradient>' +
      '<radialGradient id="gTire" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#2A2D33"/><stop offset=".8" stop-color="#14161A"/><stop offset="1" stop-color="#0A0B0D"/></radialGradient>' +
      '<radialGradient id="gHub" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#E0E4EA"/><stop offset="1" stop-color="#6A727E"/></radialGradient>' +
      '<radialGradient id="gLight" cx=".5" cy=".0" r="1"><stop offset="0" stop-color="#FFF8DC" stop-opacity=".9"/><stop offset="1" stop-color="#FFF8DC" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CFE6F7" stop-opacity=".55"/><stop offset="1" stop-color="#8FB7D3" stop-opacity=".25"/></linearGradient>' +
      '</defs>';
    document.body.appendChild(s); defsEl = s.querySelector('defs'); return defsEl;
  }
  function add(id, markup) { ensureDefs(); if (reg[id]) return; reg[id] = 1; defsEl.insertAdjacentHTML('beforeend', markup); }
  /* gradient nhựa theo màu sản phẩm: 3 mặt (trước/trên/phải) */
  function plastic(col) {
    var k = col.replace('#', '');
    add('pF' + k, '<linearGradient id="pF' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + shade(col, .16) + '"/><stop offset=".5" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.22) + '"/></linearGradient>');
    add('pT' + k, '<linearGradient id="pT' + k + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="' + shade(col, .1) + '"/><stop offset="1" stop-color="' + shade(col, .32) + '"/></linearGradient>');
    add('pS' + k, '<linearGradient id="pS' + k + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + shade(col, -.2) + '"/><stop offset="1" stop-color="' + shade(col, -.42) + '"/></linearGradient>');
    add('pG' + k, '<pattern id="pG' + k + '" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="' + shade(col, .2) + '"/><rect x="1.6" y="1.6" width="5.8" height="5.8" rx="1" fill="' + shade(col, -.72) + '"/><rect x="1.6" y="1.6" width="5.8" height="1.2" fill="' + shade(col, -.45) + '"/></pattern>');
    return { F: 'url(#pF' + k + ')', T: 'url(#pT' + k + ')', S: 'url(#pS' + k + ')', G: 'url(#pG' + k + ')', base: col, hi: shade(col, .35), dk: shade(col, -.4) };
  }
  /* khung cảnh: tường, sàn bê tông, kệ mờ phía sau */
  function stage(W, H, o) {
    o = o || {}; var fy = o.floorY || H * .8, out = '';
    out += '<rect width="' + W + '" height="' + fy + '" fill="url(#gWall)"/>';
    if (o.racks !== false) {
      var n = Math.ceil(W / 150);
      for (var i = 0; i < n; i++) {
        var rx = i * 150 - 20, tone = i % 2 ? '#B9B4A6' : '#C4BFB1';
        out += '<g opacity=".55" filter="url(#kBlur2)"><rect x="' + rx + '" y="' + (fy - 190) + '" width="6" height="190" fill="#7C8594"/><rect x="' + (rx + 140) + '" y="' + (fy - 190) + '" width="6" height="190" fill="#7C8594"/>' +
          [0, 1, 2].map(function (k) { var yy = fy - 60 - k * 62; return '<rect x="' + rx + '" y="' + yy + '" width="146" height="6" fill="#E8730C" opacity=".85"/><rect x="' + (rx + 12) + '" y="' + (yy - 44) + '" width="' + (46 + (i * 13 + k * 9) % 30) + '" height="44" fill="' + tone + '"/><rect x="' + (rx + 74) + '" y="' + (yy - 38) + '" width="' + (40 + (i * 7 + k * 5) % 24) + '" height="38" fill="#C9A878"/>'; }).join('') + '</g>';
      }
    }
    out += '<rect x="0" y="0" width="' + W + '" height="' + fy + '" fill="url(#gWall)" opacity=".35"/>';
    out += '<ellipse cx="' + W * .5 + '" cy="0" rx="' + W * .5 + '" ry="' + H * .55 + '" fill="url(#gLight)" opacity=".5"/>';
    out += '<rect x="0" y="' + fy + '" width="' + W + '" height="' + (H - fy) + '" fill="url(#gFloor)"/>';
    out += '<rect x="0" y="' + fy + '" width="' + W + '" height="' + (H - fy) + '" fill="#000" filter="url(#kNoise)" opacity=".12"/>';
    out += '<rect x="0" y="' + fy + '" width="' + W + '" height="3" fill="#6F6A5E" opacity=".6"/>';
    for (var j = 1; j < 5; j++) out += '<line x1="0" y1="' + (fy + j * (H - fy) / 5) + '" x2="' + W + '" y2="' + (fy + j * (H - fy) / 5) + '" stroke="#fff" stroke-opacity=".06"/>';
    if (o.wet) out += '<rect x="0" y="' + (fy + 4) + '" width="' + W + '" height="' + (H - fy - 4) + '" fill="#6FA5C8" opacity=".35"/><path d="M0 ' + (fy + 10) + ' Q ' + W * .25 + ' ' + (fy + 4) + ' ' + W * .5 + ' ' + (fy + 10) + ' T ' + W + ' ' + (fy + 10) + '" stroke="#fff" stroke-opacity=".5" fill="none"/>';
    return out;
  }
  function shadow(cx, cy, rx, ry, op) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1B1A16" opacity="' + (op == null ? .38 : op) + '" filter="url(#kBlur)"/>'; }
  function para(a, b, c, d, fill, extra) { return '<path d="M' + a + ' L' + b + ' L' + c + ' L' + d + ' Z" fill="' + fill + '" ' + (extra || '') + '/>'; }

  /* pallet nhựa 3D xiên. o: h (cao), d (sâu), col, face 'ho'|'kin', feet (3|4), steel */
  function pallet(x, y, w, o) {
    o = o || {}; var h = o.h || w * .13, d = o.d || w * .8, col = o.col || '#1E56C8', P = plastic(col);
    var ox = d * .62, oy = d * .3, th = Math.max(h * .3, 7), fw = w * .17, feet = o.feet || 3, out = '';
    var ty = y - h; // mặt trên mép trước
    out += shadow(x + w / 2 + ox * .4, y + 2, w * .62 + ox * .3, h * .5 + 3, .4);
    // vùng tối giữa các chân
    out += '<rect x="' + x + '" y="' + (ty + th) + '" width="' + w + '" height="' + (h - th) + '" fill="#0B0E14"/>';
    var fx = []; for (var i = 0; i < feet; i++) fx.push(x + i * (w - fw) / (feet - 1));
    // mặt hông các chân
    fx.forEach(function (px, i) { out += '<path d="M' + (px + fw) + ' ' + (ty + th) + ' L' + (px + fw + ox * .36) + ' ' + (ty + th - oy * .36) + ' L' + (px + fw + ox * .36) + ' ' + (y - oy * .36) + ' L' + (px + fw) + ' ' + y + ' Z" fill="' + P.S + '" opacity=".9"/>'; });
    fx.forEach(function (px) { out += '<rect x="' + px + '" y="' + (ty + th) + '" width="' + fw + '" height="' + (h - th) + '" fill="' + P.F + '"/><rect x="' + px + '" y="' + (ty + th) + '" width="2" height="' + (h - th) + '" fill="#fff" opacity=".18"/><rect x="' + (px + 3) + '" y="' + (y - 3) + '" width="' + (fw - 6) + '" height="3" fill="#000" opacity=".25"/>'; });
    // mặt phải sàn
    out += para((x + w) + ' ' + ty, (x + w + ox) + ' ' + (ty - oy), (x + w + ox) + ' ' + (ty - oy + th), (x + w) + ' ' + (ty + th), P.S);
    // mặt trên: biến đổi xiên
    out += '<g transform="matrix(1 0 ' + (ox / d) + ' ' + (-oy / d) + ' ' + x + ' ' + ty + ')">';
    out += '<rect x="0" y="0" width="' + w + '" height="' + d + '" fill="' + P.T + '"/>';
    if ((o.face || 'ho') === 'ho') out += '<rect x="7" y="7" width="' + (w - 14) + '" height="' + (d - 14) + '" fill="' + P.G + '"/>' + '<rect x="0" y="0" width="' + w + '" height="' + d + '" fill="none" stroke="' + P.hi + '" stroke-width="2" opacity=".6"/>';
    else out += [.2, .4, .6, .8].map(function (k) { return '<rect x="' + (w * k) + '" y="6" width="3" height="' + (d - 12) + '" fill="#000" opacity=".1"/>'; }).join('') + '<rect x="0" y="0" width="' + w + '" height="' + d + '" fill="none" stroke="' + P.hi + '" stroke-width="2" opacity=".55"/>';
    out += '</g>';
    // mặt trước sàn
    out += '<rect x="' + x + '" y="' + ty + '" width="' + w + '" height="' + th + '" fill="' + P.F + '"/><rect x="' + x + '" y="' + ty + '" width="' + w + '" height="2" fill="#fff" opacity=".4"/><rect x="' + x + '" y="' + (ty + th - 2) + '" width="' + w + '" height="2" fill="#000" opacity=".22"/>';
    // gân nhỏ trên mặt trước
    for (var g = 1; g < 12; g++) out += '<rect x="' + (x + g * w / 12) + '" y="' + (ty + 2) + '" width="1.5" height="' + (th - 4) + '" fill="#000" opacity=".12"/>';
    if (o.steel) out += '<rect x="' + (x + 6) + '" y="' + (ty + th * .35) + '" width="' + (w - 12) + '" height="' + (th * .3) + '" fill="url(#gSteel)" opacity=".95"/>';
    return out;
  }
  /* khối hàng carton xếp trên pallet (3 mặt) + màng quấn */
  function load(x, y, w, hgt, o) {
    o = o || {}; var d = o.d, ox = d * .62 * .92, oy = d * .3 * .92, cols = o.cols || 4, layers = o.layers || 3, tint = o.tint, out = '';
    var Fc = tint ? '#D9786B' : 'url(#gCardF)', Tc = tint ? '#E89C91' : 'url(#gCardT)', Sc = tint ? '#A9473B' : 'url(#gCardS)';
    if (o.paper) { Fc = tint ? '#E5B3AC' : '#ECE8DE'; Tc = tint ? '#F3CFCA' : '#FAF8F2'; Sc = tint ? '#C98E86' : '#CBC5B6'; }
    var sx = x + d * .62 * .04, sy = y - d * .3 * .04, ww = w - 6;
    out += para((sx + ww) + ' ' + sy, (sx + ww + ox) + ' ' + (sy - oy), (sx + ww + ox) + ' ' + (sy - oy - hgt), (sx + ww) + ' ' + (sy - hgt), Sc);
    out += para(sx + ' ' + (sy - hgt), (sx + ox) + ' ' + (sy - hgt - oy), (sx + ww + ox) + ' ' + (sy - hgt - oy), (sx + ww) + ' ' + (sy - hgt), Tc);
    out += '<rect x="' + sx + '" y="' + (sy - hgt) + '" width="' + ww + '" height="' + hgt + '" fill="' + Fc + '"/>';
    if (!o.paper) out += '<rect x="' + sx + '" y="' + (sy - hgt) + '" width="' + ww + '" height="' + hgt + '" fill="#000" filter="url(#kGrain)" opacity=".3"/>';
    if (o.paper) { for (var pl = 1; pl < layers * 3; pl++) out += '<line x1="' + sx + '" y1="' + (sy - hgt + pl * hgt / (layers * 3)) + '" x2="' + (sx + ww) + '" y2="' + (sy - hgt + pl * hgt / (layers * 3)) + '" stroke="#8C8676" stroke-opacity=".45"/>'; return out; }
    for (var l = 1; l < layers; l++) out += '<line x1="' + sx + '" y1="' + (sy - hgt + l * hgt / layers) + '" x2="' + (sx + ww) + '" y2="' + (sy - hgt + l * hgt / layers) + '" stroke="#7A5B2E" stroke-opacity=".55" stroke-width="1.3"/>';
    for (var c = 1; c < cols; c++) out += '<line x1="' + (sx + c * ww / cols) + '" y1="' + (sy - hgt) + '" x2="' + (sx + c * ww / cols) + '" y2="' + sy + '" stroke="#7A5B2E" stroke-opacity=".5" stroke-width="1.2"/>';
    for (var t = 0; t < cols; t++) out += '<rect x="' + (sx + (t + .5) * ww / cols - 3) + '" y="' + (sy - hgt) + '" width="6" height="' + hgt + '" fill="#F1E2BE" opacity=".75"/>';
    if (o.wrap) out += '<rect x="' + sx + '" y="' + (sy - hgt) + '" width="' + ww + '" height="' + hgt + '" fill="url(#gWrap)"/>' + [.25, .5, .75].map(function (k) { return '<line x1="' + sx + '" y1="' + (sy - hgt * k) + '" x2="' + (sx + ww) + '" y2="' + (sy - hgt * k - 3) + '" stroke="#fff" stroke-opacity=".5"/>'; }).join('');
    return out;
  }
  /* tấm đặc / khay phẳng (không chân): lót sàn, khung ràng */
  function slab(x, y, w, o) {
    o = o || {}; var h = o.h || 14, d = o.d || w * .7, col = o.col || '#1E56C8', P = plastic(col), ox = d * .62, oy = d * .3, ty = y - h, out = '';
    out += shadow(x + w / 2 + ox * .4, y + 2, w * .62 + ox * .3, 5, .4);
    out += para((x + w) + ' ' + ty, (x + w + ox) + ' ' + (ty - oy), (x + w + ox) + ' ' + (ty - oy + h), (x + w) + ' ' + y, P.S);
    out += '<g transform="matrix(1 0 ' + (ox / d) + ' ' + (-oy / d) + ' ' + x + ' ' + ty + ')"><rect width="' + w + '" height="' + d + '" fill="' + P.T + '"/>';
    if (o.grid !== false) out += '<rect x="6" y="6" width="' + (w - 12) + '" height="' + (d - 12) + '" fill="' + P.G + '" opacity=".55"/>';
    out += '<rect width="' + w + '" height="' + d + '" fill="none" stroke="' + P.hi + '" stroke-width="2" opacity=".6"/></g>';
    out += '<rect x="' + x + '" y="' + ty + '" width="' + w + '" height="' + h + '" fill="' + P.F + '"/><rect x="' + x + '" y="' + ty + '" width="' + w + '" height="2" fill="#fff" opacity=".4"/>';
    return out;
  }
  /* phuy 200L */
  function drum(cx, y, r, hgt, col) {
    col = col || '#1F5FA8'; var k = col.replace('#', '');
    add('dr' + k, '<linearGradient id="dr' + k + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + shade(col, -.35) + '"/><stop offset=".3" stop-color="' + shade(col, .3) + '"/><stop offset=".6" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.45) + '"/></linearGradient>');
    return shadow(cx, y + 2, r * 1.05, 5, .3) +
      '<rect x="' + (cx - r) + '" y="' + (y - hgt) + '" width="' + (2 * r) + '" height="' + hgt + '" rx="4" fill="url(#dr' + k + ')"/>' +
      [.15, .5, .85].map(function (f) { return '<rect x="' + (cx - r) + '" y="' + (y - hgt + hgt * f) + '" width="' + (2 * r) + '" height="3" fill="#000" opacity=".28"/>'; }).join('') +
      '<ellipse cx="' + cx + '" cy="' + (y - hgt) + '" rx="' + r + '" ry="' + (r * .26) + '" fill="' + shade(col, .25) + '"/><ellipse cx="' + cx + '" cy="' + (y - hgt) + '" rx="' + (r * .62) + '" ry="' + (r * .16) + '" fill="' + shade(col, -.15) + '"/>';
  }
  /* bánh xe */
  function wheel(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#gTire)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * .46 + '" fill="url(#gHub)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * .12 + '" fill="#2A2D33"/>' + [0, 60, 120, 180, 240, 300].map(function (a) { var rad = a * Math.PI / 180; return '<circle cx="' + (cx + Math.cos(rad) * r * .3) + '" cy="' + (cy + Math.sin(rad) * r * .3) + '" r="' + r * .05 + '" fill="#2A2D33"/>'; }).join('') + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 1.5) + '" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>'; }
  /* xe nâng đối trọng nhìn nghiêng. Trả về {svg, tipX} - fh = độ nâng càng, mastH chiều cao cột */
  function forklift(x, y, fh, o) {
    o = o || {}; var mastH = o.mastH || 235, fl = o.forkLen || 190, out = '';
    out += shadow(x + 90, y + 3, 120, 7, .42);
    // cột nâng
    out += '<rect x="' + (x + 168) + '" y="' + (y - mastH) + '" width="9" height="' + (mastH - 14) + '" fill="url(#gSteel)"/><rect x="' + (x + 181) + '" y="' + (y - mastH) + '" width="7" height="' + (mastH - 14) + '" fill="url(#gSteel)"/>';
    for (var m = 0; m < 6; m++) out += '<rect x="' + (x + 168) + '" y="' + (y - mastH + 18 + m * (mastH - 50) / 5) + '" width="20" height="3" fill="#2B3039" opacity=".5"/>';
    // thân xe
    out += '<path d="M' + x + ' ' + (y - 30) + ' L' + (x + 4) + ' ' + (y - 100) + ' Q' + (x + 6) + ' ' + (y - 112) + ' ' + (x + 22) + ' ' + (y - 112) + ' L' + (x + 120) + ' ' + (y - 112) + ' L' + (x + 150) + ' ' + (y - 84) + ' L' + (x + 166) + ' ' + (y - 74) + ' L' + (x + 166) + ' ' + (y - 30) + ' Z" fill="url(#gOrange)"/>';
    out += '<path d="M' + (x + 4) + ' ' + (y - 100) + ' Q' + (x + 6) + ' ' + (y - 112) + ' ' + (x + 22) + ' ' + (y - 112) + ' L' + (x + 120) + ' ' + (y - 112) + '" fill="none" stroke="#FFD08A" stroke-width="2" opacity=".8"/>';
    out += '<rect x="' + x + '" y="' + (y - 38) + '" width="166" height="10" fill="url(#gDark)"/><rect x="' + (x + 70) + '" y="' + (y - 96) + '" width="48" height="5" fill="#8A3F00" opacity=".6"/>';
    out += '<rect x="' + (x + 6) + '" y="' + (y - 86) + '" width="22" height="30" rx="3" fill="url(#gDark)"/><rect x="' + (x + 9) + '" y="' + (y - 83) + '" width="16" height="6" fill="#FFE29A"/>';
    // ghế + người lái
    out += '<rect x="' + (x + 40) + '" y="' + (y - 128) + '" width="34" height="18" rx="4" fill="#23262C"/><rect x="' + (x + 36) + '" y="' + (y - 150) + '" width="12" height="26" rx="4" fill="#23262C"/>';
    out += '<circle cx="' + (x + 66) + '" cy="' + (y - 176) + '" r="9" fill="#E0B38A"/><path d="M' + (x + 56) + ' ' + (y - 178) + ' q10 -14 20 0 z" fill="#F4C20D"/><path d="M' + (x + 52) + ' ' + (y - 158) + ' l24 -4 l6 30 l-34 0 z" fill="#1C4E9C"/><path d="M' + (x + 78) + ' ' + (y - 150) + ' l30 12 l-2 6 l-32 -8 z" fill="#1C4E9C"/>';
    // vô lăng
    out += '<path d="M' + (x + 112) + ' ' + (y - 112) + ' L' + (x + 102) + ' ' + (y - 138) + '" stroke="#23262C" stroke-width="5"/><ellipse cx="' + (x + 100) + '" cy="' + (y - 140) + '" rx="12" ry="4" fill="#23262C" transform="rotate(-20 ' + (x + 100) + ' ' + (y - 140) + ')"/>';
    // khung bảo vệ đầu
    out += '<path d="M' + (x + 28) + ' ' + (y - 112) + ' L' + (x + 28) + ' ' + (y - 222) + ' L' + (x + 124) + ' ' + (y - 222) + ' L' + (x + 124) + ' ' + (y - 112) + '" fill="none" stroke="url(#gDark)" stroke-width="5"/><rect x="' + (x + 22) + '" y="' + (y - 230) + '" width="108" height="9" rx="2" fill="url(#gDark)"/>';
    for (var b = 0; b < 5; b++) out += '<line x1="' + (x + 38 + b * 20) + '" y1="' + (y - 221) + '" x2="' + (x + 38 + b * 20) + '" y2="' + (y - 224) + '" stroke="#555" />';
    out += '<path d="M' + (x + 124) + ' ' + (y - 222) + ' L' + (x + 124) + ' ' + (y - 112)+ '" stroke="url(#gDark)" stroke-width="5"/>';
    out += '<path d="M' + (x + 30) + ' ' + (y - 220) + ' L' + (x + 122) + ' ' + (y - 220) + ' L' + (x + 122) + ' ' + (y - 114) + ' L' + (x + 30) + ' ' + (y - 114) + ' Z" fill="url(#gGlass)" opacity=".18"/>';
    // đèn pha
    out += '<rect x="' + (x + 150) + '" y="' + (y - 96) + '" width="14" height="10" rx="2" fill="#FFE9A8"/><ellipse cx="' + (x + 166) + '" cy="' + (y - 90) + '" rx="22" ry="10" fill="url(#gLight)" opacity=".5"/>';
    // đèn cảnh báo
    out += '<rect x="' + (x + 70) + '" y="' + (y - 241) + '" width="14" height="10" rx="3" fill="#FFB400"/>';
    // bánh
    out += wheel(x + 136, y - 22, 22) + wheel(x + 32, y - 17, 17);
    out += '<rect x="' + (x + 118) + '" y="' + (y - 52) + '" width="40" height="12" rx="6" fill="#F57C0B" opacity=".9"/>';
    // càng + xe cầu nâng
    var cy = y - 16 - fh; // mép dưới càng
    out += '<line x1="' + (x + 172) + '" y1="' + (y - mastH + 6) + '" x2="' + (x + 172) + '" y2="' + (cy - 36) + '" stroke="#222" stroke-width="2" opacity=".7"/>';
    out += '<rect x="' + (x + 164) + '" y="' + (cy - 54) + '" width="30" height="58" rx="2" fill="url(#gSteelV)"/><rect x="' + (x + 164) + '" y="' + (cy - 54) + '" width="30" height="5" fill="#2B3039"/>';
    out += '<path d="M' + (x + 194) + ' ' + (cy + 4) + ' L' + (x + 194) + ' ' + (cy - 40) + ' L' + (x + 202) + ' ' + (cy - 40) + ' L' + (x + 202) + ' ' + (cy - 3) + ' L' + (x + 194 + fl) + ' ' + (cy - 3) + ' L' + (x + 194 + fl + 18) + ' ' + (cy + 1) + ' L' + (x + 194 + fl) + ' ' + (cy + 4) + ' Z" fill="url(#gSteelV)"/>';
    out += '<rect x="' + (x + 202) + '" y="' + (cy - 3) + '" width="' + (fl - 8) + '" height="1.5" fill="#fff" opacity=".5"/>';
    return { svg: out, tip: x + 194 + fl + 18 };
  }
  /* xe nâng tay thuỷ lực */
  function handTruck(x, y, fh, o) {
    o = o || {}; var fl = o.forkLen || 210, out = '', cy = y - 9 - fh;
    out += shadow(x + 100, y + 2, 120, 5, .4);
    // càng 2 thanh (nhìn bên: một)
    out += '<path d="M' + (x + 40) + ' ' + (cy + 4) + ' L' + (x + 40) + ' ' + (cy - 12) + ' L' + (x + 60) + ' ' + (cy - 12) + ' L' + (x + 62) + ' ' + (cy - 2) + ' L' + (x + 40 + fl) + ' ' + (cy - 2) + ' L' + (x + 40 + fl + 20) + ' ' + (cy + 2) + ' L' + (x + 40 + fl) + ' ' + (cy + 5) + ' Z" fill="url(#gSteelV)"/>';
    out += '<rect x="' + (x + 62) + '" y="' + (cy - 2) + '" width="' + (fl - 22) + '" height="1.4" fill="#fff" opacity=".5"/>';
    // thân bơm
    out += '<rect x="' + (x + 6) + '" y="' + (cy - 70) + '" width="46" height="72" rx="6" fill="url(#gOrange)"/><rect x="' + (x + 10) + '" y="' + (cy - 64) + '" width="6" height="58" fill="#fff" opacity=".28"/><rect x="' + (x + 6) + '" y="' + (cy - 20) + '" width="46" height="6" fill="#8A3F00" opacity=".5"/>';
    out += '<rect x="' + (x + 14) + '" y="' + (cy - 100) + '" width="16" height="32" rx="3" fill="url(#gSteelV)"/>';
    // tay kéo
    out += '<path d="M' + (x + 22) + ' ' + (cy - 98) + ' L' + (x - 22) + ' ' + (cy - 186) + '" stroke="url(#gDark)" stroke-width="9" stroke-linecap="round"/>';
    out += '<rect x="' + (x - 44) + '" y="' + (cy - 198) + '" width="46" height="13" rx="6" fill="url(#gDark)" transform="rotate(-8 ' + (x - 22) + ' ' + (cy - 190) + ')"/>';
    out += '<circle cx="' + (x - 10) + '" cy="' + (cy - 190) + '" r="4" fill="#E53935"/>';
    // bánh
    out += wheel(x + 24, y - 8, 8) + wheel(x + 40 + fl - 6, y - 7, 6.5) + wheel(x + 40 + fl - 28, y - 7, 6.5);
    return { svg: out, tip: x + 40 + fl + 20 };
  }
  /* kệ pallet chọn lọc */
  function rack(x, y, w, hgt, levels, o) {
    o = o || {}; var out = '', up = 8;
    out += shadow(x + w / 2, y + 2, w * .6, 6, .3);
    [x, x + w].forEach(function (px) { out += '<rect x="' + (px - 5) + '" y="' + (y - hgt) + '" width="10" height="' + hgt + '" fill="#2F6FD6"/><rect x="' + (px - 5) + '" y="' + (y - hgt) + '" width="3" height="' + hgt + '" fill="#fff" opacity=".3"/>';
      for (var k = 0; k < hgt / 22; k++) out += '<rect x="' + (px - 2.5) + '" y="' + (y - hgt + 6 + k * 22) + '" width="5" height="9" rx="2" fill="#0F2D5E"/>'; });
    for (var i = 1; i <= levels; i++) { var by = y - i * (hgt / (levels + .15)); out += '<rect x="' + (x - 8) + '" y="' + by + '" width="' + (w + 16) + '" height="' + up + '" fill="url(#gOrange)"/><rect x="' + (x - 8) + '" y="' + by + '" width="' + (w + 16) + '" height="2" fill="#fff" opacity=".4"/>'; }
    return out;
  }
  function label(x, y, t, a, col, sz) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (a || 'start') + '" font-family="Noto Sans, Arial, sans-serif" font-size="' + (sz || 14) + '" font-weight="600" fill="' + (col || '#1E2433') + '">' + t + '</text>'; }
  function tag(x, y, t, col, sz) { sz = sz || 14; var w = t.length * sz * .62 + 18; return '<g><rect x="' + (x - w / 2) + '" y="' + (y - sz - 6) + '" width="' + w + '" height="' + (sz + 12) + '" rx="3" fill="#fff" stroke="' + (col || '#1E2433') + '" stroke-width="1.5" opacity=".96"/>' + label(x, y, t, 'middle', col || '#1E2433', sz) + '</g>'; }
  return { slab: slab, NS: NS, plastic: plastic, shade: shade, stage: stage, shadow: shadow, pallet: pallet, load: load, drum: drum, wheel: wheel, forklift: forklift, handTruck: handTruck, rack: rack, label: label, tag: tag, para: para, clamp: clamp, add: add };
})();
