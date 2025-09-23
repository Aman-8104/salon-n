// Populate featured services on home and services list page
fetch('/appointments/data').then(r=>r.json()).then(({services})=>{
  const featured = document.getElementById('featured-services');
  if(featured){
    services.slice(0,4).forEach(s=>{
      const d=document.createElement('div');d.className='card';
      const price = (s.price/100).toLocaleString('en-IN',{minimumFractionDigits:2});
      d.innerHTML = `<strong>${s.name}</strong><br>${s.description}<br><span class="inr"></span>${price} · ${s.duration}m`;
      featured.appendChild(d);
    });
  }
  const list = document.getElementById('services-list');
  if(list){
    services.forEach(s=>{
      const d=document.createElement('div');d.className='card';
      const price = (s.price/100).toLocaleString('en-IN',{minimumFractionDigits:2});
      d.innerHTML = `<strong>${s.name}</strong><br><em>${s.category}</em><br>${s.description}<br><span class="inr"></span>${price} · ${s.duration}m`;
      list.appendChild(d);
    });
  }
}).catch(()=>{});

// Login dropdowns: click to open, click outside/Escape to close
(() => {
  const dropdowns = Array.from(document.querySelectorAll('.login-menu'));
  if (!dropdowns.length) return;
  const closeAll = () => dropdowns.forEach(d => {
    const btn = d.querySelector('button');
    const menu = d.querySelector('.dropdown-menu');
    if (menu && btn) { menu.hidden = true; btn.setAttribute('aria-expanded','false'); }
  });
  // Ensure menus are closed on initial load
  closeAll();
  dropdowns.forEach(d => {
    const btn = d.querySelector('button');
    const menu = d.querySelector('.dropdown-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = menu.hidden === false;
      closeAll();
      if (!isOpen) { menu.hidden = false; btn.setAttribute('aria-expanded','true'); }
    });
  });
  document.addEventListener('click', (e) => {
    if (!dropdowns.length) return;
    if (!e.target.closest('.login-menu')) closeAll();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
})();

// Theme toggle: persist in localStorage and set data-theme on <html>
(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
})();

// Mobile nav toggle
(() => {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  // Close on link click
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
    }
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
    }
  });
})();
