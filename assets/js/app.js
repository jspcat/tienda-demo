/* =============================================
 Utilidades
============================================= */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const money = v => v.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const normalize = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');

function setYear(){ const y = $('#year'); if(y) y.textContent = new Date().getFullYear(); }
function pushDL(obj){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(obj); }

function setupMenu(){
  const nav = $('.main-nav');
  const container = $('.site-header .container');
  if(!nav || !container) return;
  const btn = document.createElement('button');
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-label','Abrir menú');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = '☰';
  container.insertBefore(btn, nav);
  btn.addEventListener('click', () => {
    const active = nav.classList.toggle('mobile-active');
    btn.setAttribute('aria-expanded', active);
  });
}

/* =============================================
 Datos de demo
============================================= */
const PRODUCTS = [
  { id: 'cafe-andino',    name: 'Café Andino',             price: 12.90, description: 'Grano arábica tostado medio. Notas a cacao y panela.',            image: 'assets/img/cafe.jpg' },
  { id: 'te-matcha',      name: 'Té Matcha Premium',       price: 19.50, description: 'Matcha ceremonial para lattes verdes y postres.',                 image: 'assets/img/matcha.jpg' },
  { id: 'moka-3',         name: 'Cafetera Moka (3 tazas)', price: 24.00, description: 'Aluminio. Compatible con gas y vitrocerámica.',                   image: 'assets/img/moka.jpg' },
  { id: 'pack-degustacion', name: 'Pack Degustación',      price: 29.00, description: '3 orígenes + guía de cata descargable.',                          image: 'assets/img/pack.jpg' }
];

const POSTS = [
  { id: 'ga4-errores', title: '5 errores típicos en GA4 y cómo evitarlos', date: '2024-10-15', excerpt: 'Configuraciones duplicadas, exclusiones de referidos y más cosillas a vigilar.' },
  { id: 'gtm-trucos',  title: 'Trucos de Google Tag Manager que quizá no uses', date: '2024-10-20', excerpt: 'Ideas prácticas para contenedores más limpios.' },
  { id: 'bigquery',    title: 'BigQuery para analistas: lo mínimo imprescindible', date: '2024-11-01', excerpt: 'Consultas útiles para empezar rápido.' }
];

/* =============================================
 Carrito
============================================= */
function loadCart(){ return JSON.parse(localStorage.getItem('cart')||'[]'); }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); updateCartCount(); }
function clearCart(){ localStorage.removeItem('cart'); updateCartCount(); }
function updateCartCount(){ const c = $('#cartCount'); if(c) c.textContent = loadCart().reduce((a,b)=>a+b.qty,0); }

function addToCart(prod, qty=1){
  const cart = loadCart();
  const existing = cart.find(x=>x.id===prod.id);
  if(existing){ existing.qty += qty; }
  else{ cart.push({ id: prod.id, name: prod.name, price: prod.price, qty }); }
  saveCart(cart);
  showToast(`${prod.name} añadido al carrito`);
}

function showToast(msg){
  let t = $('#toast');
  if(!t){
    t = document.createElement('div'); t.id='toast'; t.className='toast';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1800);
}

function getCartTotals(){
  const cart = loadCart();
  let value = 0;
  const items = cart.map(x=>({ item_id:x.id, item_name:x.name, price:x.price, quantity:x.qty }));
  items.forEach(i=> value += i.price * i.quantity);
  return { cart, value, items };
}

/* =============================================
 Buscador (sugerencias + Enter → buscar.html)
============================================= */
function setupSearch(){
  const input = $('#searchInput');
  const panel = $('#searchResults');
  if(!input || !panel) return;

  const index = [
    ...PRODUCTS.map(p=>({type:'Producto', id:p.id, title:p.name, desc:p.description, href:'producto-'+p.id+'.html'})),
    ...POSTS.map(p=>({type:'Post',     id:p.id, title:p.title, desc:p.excerpt,      href:'blog.html#'+p.id}))
  ];

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(()=> {
      const q = normalize(input.value.trim());
      if(!q){ panel.classList.remove('active'); panel.innerHTML=''; return; }
      const results = index.filter(it => normalize(it.title+' '+it.desc).includes(q)).slice(0,8);
      if(!results.length){ panel.classList.add('active'); panel.innerHTML = `<div class="item"><div>No hay resultados</div></div>`; return; }
      panel.innerHTML = results.map(r=>`
        <a class="item" href="${r.href}">
          <div style="flex:1">
            <div class="title">${r.title}</div>
            <div class="type">${r.type}</div>
          </div>
        </a>
      `).join('');
      panel.classList.add('active');
    }, 120);
  });

  // Enter → página de resultados
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      const q = input.value.trim();
      if(q){ location.href = 'buscar.html?q=' + encodeURIComponent(q); }
    }
  });

  input.addEventListener('focus', ()=>{ if(panel.innerHTML) panel.classList.add('active'); });
  input.addEventListener('blur', ()=> setTimeout(()=>panel.classList.remove('active'), 150));
}

/* =============================================
 Página de resultados (buscar.html)
============================================= */
function renderSearchPage(){
  const box = $('#searchResultsPage'); if(!box) return;
  const params = new URLSearchParams(location.search);
  const qRaw = params.get('q') || '';
  const q = normalize(qRaw);

  const topInput = $('#searchInput'); if(topInput) topInput.value = qRaw;

  const prod = PRODUCTS.filter(p => normalize(p.name+' '+p.description).includes(q));
  const posts = POSTS.filter(p => normalize(p.title+' '+p.excerpt).includes(q));

  const prodHTML = prod.length ? prod.map(p=>`
    <article class="card pad product" id="${p.id}">
      <a href="producto-${p.id}.html" class="img-ph">
        <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:12px">
      </a>
      <h3 class="title"><a href="producto-${p.id}.html">${p.name}</a></h3>
      <p>${p.description}</p>
      <p class="price">${money(p.price)}</p>
      <div class="actions">
        <button class="btn cta" onclick="addToCart(PRODUCTS.find(x=>x.id==='${p.id}'))">Añadir</button>
      </div>
    </article>
  `).join('') : `<p class="muted">Sin productos para “${qRaw}”.</p>`;

  const postsHTML = posts.length ? posts.map(p=>`
    <article class="post card pad" id="${p.id}">
      <h3 class="title">${p.title}</h3>
      <p class="meta">${new Date(p.date).toLocaleDateString('es-ES')}</p>
      <p>${p.excerpt}</p>
      <a class="btn" href="blog.html#${p.id}">Leer más</a>
    </article>
  `).join('') : `<p class="muted">Sin artículos para “${qRaw}”.</p>`;

  box.innerHTML = `
    <h1 class="page-title">Resultados para “${qRaw}”</h1>
    <section class="pad-y">
      <h2 class="section-title">Productos (${prod.length})</h2>
      <div class="grid cards">${prodHTML}</div>
    </section>
    <section class="pad-y">
      <h2 class="section-title">Artículos (${posts.length})</h2>
      <div class="grid cards">${postsHTML}</div>
    </section>
  `;
}

/* =============================================
 Producto: página producto-<id>.html
============================================= */
function renderProductPage(){
  const mount = $('#productPage'); if(!mount) return;

  const params = new URLSearchParams(location.search);
  let id = params.get('id');
  if(!id){
    const match = location.pathname.match(/producto-([^\.]+)\.html$/);
    if(match) id = match[1];
  }
  const p = PRODUCTS.find(x=>x.id === id);

  const crumbs = $('#crumbs');
  if(crumbs){
    crumbs.innerHTML = `<a href="index.html">Inicio</a> / <a href="tienda.html">Tienda</a> / <span>${p ? p.name : 'Producto'}</span>`;
  }

  if(!p){
    mount.innerHTML = `<p class="muted">Producto no encontrado.</p>`;
    return;
  }

  pushDL({
    event: 'view_item',
    ecommerce: { currency: 'EUR', value: +p.price.toFixed(2),
      items: [{ item_id: p.id, item_name: p.name, price: p.price, quantity: 1 }] }
  });

  mount.innerHTML = `
    <section class="product-page">
      <div class="product-hero">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <div class="product-info">
        <h1 class="title">${p.name}</h1>
        <div class="badge">En stock</div>
        <p class="muted" style="margin-top:10px">${p.description}</p>
        <div class="product-price">${money(p.price)}</div>
        <div class="product-actions">
          <button class="btn cta" id="btnAdd">Añadir al carrito</button>
          <a class="btn" href="tienda.html">Volver a la tienda</a>
        </div>
      </div>
    </section>
  `;

  $('#btnAdd').addEventListener('click', ()=>{
    addToCart(p, 1);
    pushDL({
      event: 'add_to_cart',
      ecommerce: { currency:'EUR', value:+p.price.toFixed(2),
        items:[{ item_id:p.id, item_name:p.name, price:p.price, quantity:1 }] }
    });
  });

  const related = PRODUCTS.filter(x=>x.id!==p.id).slice(0,3);
  const rg = $('#relatedGrid');
  if(rg){
    rg.innerHTML = related.map(r=>`
      <article class="card pad product">
        <a href="producto-${r.id}.html" class="img-ph">
          <img src="${r.image}" alt="${r.name}" style="width:100%;border-radius:12px">
        </a>
        <h3 class="title"><a href="producto-${r.id}.html">${r.name}</a></h3>
        <p class="price">${money(r.price)}</p>
        <div class="actions">
          <button class="btn cta" onclick="addToCart(PRODUCTS.find(x=>x.id==='${r.id}'))">Añadir</button>
        </div>
      </article>
    `).join('');
  }

  // JSON-LD
  const ld = {
    "@context":"https://schema.org",
    "@type":"Product",
    "name": p.name,
    "image": location.origin + '/' + p.image.replace(/^\.?\/*/,''),
    "description": p.description,
    "offers": { "@type":"Offer","priceCurrency":"EUR","price": p.price.toFixed(2),"availability":"https://schema.org/InStock" }
  };
  const s = document.createElement('script'); s.type='application/ld+json'; s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}

/* =============================================
 Home
============================================= */
function renderHome(){
  const boxP = $('#featuredProducts');
  if(boxP){
    boxP.innerHTML = PRODUCTS.map(p=>`
      <article class="card pad product" id="${p.id}">
        <a href="producto-${p.id}.html" class="img-ph">
          <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:12px">
        </a>
        <h3 class="title"><a href="producto-${p.id}.html">${p.name}</a></h3>
        <p>${p.description}</p>
        <p class="price">${money(p.price)}</p>
        <div class="actions">
          <button class="btn cta" onclick="addToCart(PRODUCTS.find(x=>x.id==='${p.id}'))">Añadir</button>
        </div>
      </article>
    `).join('');
  }

  const boxB = $('#latestPosts');
  if(boxB){
    boxB.innerHTML = POSTS.map(b=>`
      <article class="post card pad" id="${b.id}">
        <h3 class="title">${b.title}</h3>
        <p class="meta">${new Date(b.date).toLocaleDateString('es-ES')}</p>
        <p>${b.excerpt}</p>
        <a class="btn" href="blog.html#${b.id}">Leer más</a>
      </article>
    `).join('');
  }
}

/* =============================================
 Tienda
============================================= */
function renderShop(){
  const box = $('#productGrid') || $('#shopList');
  if(!box) return;
  box.innerHTML = PRODUCTS.map(p=>`
    <article class="card pad product" id="${p.id}">
      <a href="producto-${p.id}.html" class="img-ph">
        <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:12px">
      </a>
      <h3 class="title"><a href="producto-${p.id}.html">${p.name}</a></h3>
      <p>${p.description}</p>
      <p class="price">${money(p.price)}</p>
      <div class="actions">
        <button class="btn cta" onclick="addToCart(PRODUCTS.find(x=>x.id==='${p.id}'))">Añadir</button>
      </div>
    </article>
  `).join('');
}

/* =============================================
 Blog
============================================= */
function renderBlog(){
  const box = $('#blogList');
  if(!box) return;
  box.innerHTML = POSTS.map(p=>`
    <article class="post card pad" id="${p.id}">
      <h3 class="title">${p.title}</h3>
      <p class="meta">${new Date(p.date).toLocaleDateString('es-ES')}</p>
      <p>${p.excerpt}</p>
    </article>
  `).join('');
}

/* =============================================
 Carrito
============================================= */
function renderCartPage(){
  const listEl = $('#cartList') || $('#cartBox');
  const totalEl = $('#cartTotal');
  if(!listEl) return;

  const { cart, value } = getCartTotals();
  if(cart.length===0){
    listEl.innerHTML = '<p class="muted">Carrito vacío.</p>';
    if(totalEl) totalEl.textContent = money(0);
    return;
  }

  listEl.innerHTML = cart.map(c=>`
    <article class="card pad row between center-v">
      <div><div class="title">${c.name}</div><div class="muted">${money(c.price)}</div></div>
      <div class="row center-v">
        <button class="btn" data-dec="${c.id}">−</button>
        <span style="min-width:32px; text-align:center">${c.qty}</span>
        <button class="btn" data-inc="${c.id}">+</button>
        <button class="btn" data-del="${c.id}">Eliminar</button>
      </div>
    </article>
  `).join('');

  if(totalEl) totalEl.textContent = money(value);

  listEl.addEventListener('click', e => {
    const idDec = e.target?.getAttribute?.('data-dec');
    const idInc = e.target?.getAttribute?.('data-inc');
    const idDel = e.target?.getAttribute?.('data-del');
    const cart = loadCart();
    if(idDec){ const it = cart.find(x=>x.id===idDec); if(it){ it.qty=Math.max(1,it.qty-1);} saveCart(cart); renderCartPage(); }
    if(idInc){ const it = cart.find(x=>x.id===idInc); if(it){ it.qty+=1;} saveCart(cart); renderCartPage(); }
    if(idDel){ const idx = cart.findIndex(x=>x.id===idDel); if(idx>-1){ cart.splice(idx,1);} saveCart(cart); renderCartPage(); }
  });
}

/* =============================================
 Datos de envío
============================================= */
function setupShipping(){
  const form = $('#shippingForm'); const sumEl = $('#shippingSummary'); if(!form) return;
  const { cart, value } = getCartTotals();
  sumEl.textContent = `${cart.length} artículos · Total ${money(value)}`;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if(!data.nombre || !data.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)){
      alert('Revisa nombre y email válido.'); return;
    }
    sessionStorage.setItem('shipping', JSON.stringify(data));
    location.href = 'pago.html';
  });
}

/* =============================================
 Pago
============================================= */
function setupPayment(){
  const form = $('#paymentForm'); const sumEl = $('#paymentSummary'); if(!form) return;
  const { cart, value, items } = getCartTotals();
  sumEl.textContent = `${cart.length} artículos · Total ${money(value)}`;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const shipping = JSON.parse(sessionStorage.getItem('shipping')||'{}');
    const orderId = 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase();
    pushDL({ event: 'purchase', ecommerce: { transaction_id: orderId, value: +value.toFixed(2), currency: 'EUR', items } });
    sessionStorage.setItem('last_order', JSON.stringify({ orderId, value, items, ...shipping }));
    sessionStorage.removeItem('shipping');
    clearCart();
    location.href = 'compra.html';
  });
}

/* =============================================
 Compra
============================================= */
function renderPurchase(){
  const box = $('#purchaseBox'); if(!box) return;
  const raw = sessionStorage.getItem('last_order');
  if(!raw){ box.innerHTML = '<p class="muted">No hay pedido reciente.</p>'; return; }
  const { orderId, value, items, nombre } = JSON.parse(raw);
  box.innerHTML = `
    <div class="card pad">
      <h2>¡Gracias, ${nombre || 'cliente'}!</h2>
      <p>Tu pedido <strong>${orderId}</strong> se ha registrado (simulado).</p>
      <ul>${items.map(i=>`<li>${i.quantity} × ${i.item_name} — ${money(i.price)}</li>`).join('')}</ul>
      <p>Total pagado: <strong>${money(value)}</strong></p>
      <a class="btn" href="tienda.html">Volver a la tienda</a>
    </div>`;
}

/* =============================================
 Init
============================================= */
window.addEventListener('DOMContentLoaded', () => {
  setYear(); updateCartCount(); setupSearch(); setupMenu();
  const page = document.body.dataset.page;
  if(page==='home') renderHome();
  if(page==='shop') renderShop();
  if(page==='blog') renderBlog();
  if(page==='cart') renderCartPage();
  if(page==='shipping') setupShipping();
  if(page==='payment') setupPayment();
  if(page==='purchase') renderPurchase();
  if(page==='search') renderSearchPage();
  if(page==='product') renderProductPage(); // ← ficha de producto
});
