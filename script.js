// ======================== SISTEMA MULTI-TENANT ========================
const getTenantId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('b') || 'default';
};

const tenantId = getTenantId();
const storageKey = (key) => `${tenantId}_${key}`;

// ======================== INICIALIZACIÓN DE DATOS ========================
let products = JSON.parse(localStorage.getItem(storageKey('su_products'))) || [
  { id: 1, name: "Urbana Clasica", category: "hamburguesas", price: 12.90, description: "Carne 150g, lechuga, tomate", available: true, image: "" },
  { id: 2, name: "Urbana Doble", category: "hamburguesas", price: 18.50, description: "Doble carne 300g, doble queso", available: true, image: "" },
  { id: 3, name: "Costillitas BBQ", category: "alitas", price: 28.90, description: "Costillas de cerdo con salsa BBQ", available: true, image: "" },
  { id: 4, name: "Alitas Picantes", category: "alitas", price: 24.90, description: "Alitas con salsa picante especial", available: true, image: "" },
  { id: 5, name: "Salchipapa Clasica", category: "salchipapas", price: 9.90, description: "Papas fritas, salchicha, salsas", available: true, image: "" },
  { id: 6, name: "Salchipapa Loca", category: "salchipapas", price: 15.90, description: "Papas, salchicha, queso, tocino, huevo", available: true, image: "" },
  { id: 7, name: "Pizza Personal", category: "pizzas", price: 14.90, description: "8 porciones, mozzarella", available: true, image: "" },
  { id: 8, name: "Pizza Familiar", category: "pizzas", price: 32.90, description: "12 porciones, pepperoni", available: true, image: "" },
  { id: 9, name: "Coca Cola 500ml", category: "bebidas", price: 4.50, description: "Bebida gaseosa", available: true, image: "" },
  { id: 10, name: "Chicha Morada", category: "bebidas", price: 5.00, description: "Bebida tradicional", available: true, image: "" }
];

let orders = JSON.parse(localStorage.getItem(storageKey('su_orders'))) || [];

let cart = [];
let currentCategory = 'todos';
let currentAdminTab = 'pedidos';
let currentView = 'cliente';
let currentCustomProductId = null;
let currentDispatchOrderId = null;

let isAdminAuthenticated = sessionStorage.getItem(storageKey('su_admin_auth')) === 'true';

// UI de Planes y Suscripciones (Fase 2)
function updatePlanUI() {
  const sub = window.SaaS.getTenantSubscription();
  const plan = window.SaaS.getPlanLimits();
  const badge = document.getElementById('planBadge');
  if (badge) {
    badge.textContent = plan.name;
    badge.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${sub.planId === 'pro' ? 'bg-primary text-white border-primary' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`;
  }

  // Si no es PRO, ocultamos opciones premium y mostramos CTA de mejora
  const isPro = sub.planId === 'pro';
  const brandingSection = document.getElementById('brandingConfig'); 
  if (brandingSection) brandingSection.classList.toggle('hidden', !isPro);
  
  const upgradeCTA = document.getElementById('upgradeCTA');
  if (upgradeCTA) upgradeCTA.classList.toggle('hidden', isPro);

  // Footer Branding (Solo pro puede removerlo, pero la lógica hasFeature lo controla)
  const footerBadge = document.getElementById('pideClickFooterBadge');
  if (footerBadge) {
    footerBadge.classList.toggle('hidden', isPro && !window.SaaS.hasFeature('whatsappFollowup')); 
    // En realidad, si es PRO y el usuario elige quitarlo (fase posterior), se ocultaría. 
    // Por ahora, solo los PRO tienen la sección de configuración de marca visible.
  }
  
  // Mostrar mensaje si alcanzó límite de productos
  const btnNewProduct = document.querySelector('button[onclick="openProductModal()"]');
  if (btnNewProduct) {
    const atLimit = products.length >= plan.maxProducts;
    btnNewProduct.disabled = atLimit && !isPro;
    if (atLimit && !isPro) {
      btnNewProduct.title = "Límite de productos alcanzado (Plan Esencial)";
      btnNewProduct.classList.add('opacity-50', 'grayscale');
    } else {
      btnNewProduct.title = "";
      btnNewProduct.classList.remove('opacity-50', 'grayscale');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const params = new URLSearchParams(window.location.search);
  const b = params.get('b');

  if (!b) {
    showLandingPage();
  } else {
    // Aquí podríamos validar si el negocio existe o está bloqueado
    // Por ahora, permitimos el acceso si hay un parámetro 'b'
    window.SaaS.registerTenant(b); // Registro global para Super Admin
    document.getElementById('mainNav').classList.remove('hidden');
    const footerAdm = document.getElementById('footerAdminContainer');
    if (footerAdm) footerAdm.classList.remove('hidden');
    loadGlobalImages(); 
    loadCustomSettings(); 
    renderProducts();
    renderOrders();
    updateOrderCounts();
    renderAdminProducts();
    updatePlanUI(); // Actualizar UI de planes
    switchView('cliente');
  }
}

function showLandingPage() {
  document.getElementById('landingView').classList.remove('hidden');
  document.getElementById('mainNav').classList.add('hidden');
  document.getElementById('clienteView').classList.add('hidden');
  document.getElementById('adminView').classList.add('hidden');
  document.getElementById('cartIndicator').classList.add('hidden');
  const footerAdm = document.getElementById('footerAdminContainer');
  if (footerAdm) footerAdm.classList.add('hidden');
}

function saveData() {
  try {
    localStorage.setItem(storageKey('su_products'), JSON.stringify(products));
    localStorage.setItem(storageKey('su_orders'), JSON.stringify(orders));
  } catch (e) {
    console.error("Error guardando en localStorage:", e);
    showNotification("Error", "No se pudo guardar. Es posible que las imágenes sean demasiado pesadas.", "error");
  }
}

// ======================== SISTEMA DE NOTIFICACIONES (TOAST) ========================
function showNotification(title, message, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = {
    success: `<svg class="toast-icon text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    error: `<svg class="toast-icon text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    warning: `<svg class="toast-icon text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
  }[type];

  toast.innerHTML = `
    ${icon}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ======================== GESTIÓN DE IMÁGENES GLOBALES ========================
function loadGlobalImages() {
  // LOGO ELIMINADO DE AQUI - Ahora es estático en HTML
  const banner = localStorage.getItem(storageKey('su_banner'));
  if (banner) document.getElementById('mainBanner').src = banner;
}

function uploadGlobalImage(type, input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (type === 'banner') {
        try {
          localStorage.setItem(storageKey('su_banner'), e.target.result);
          const bannerImg = document.getElementById('mainBanner');
          if (bannerImg) bannerImg.src = e.target.result;
          showNotification("Éxito", "Banner actualizado correctamente");
        } catch (err) {
          showNotification("Error", "La imagen es demasiado pesada", "error");
        }
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ======================== GESTIÓN DE PERSONALIZACIÓN ========================
function loadCustomSettings() {
  const slogan = localStorage.getItem(storageKey('su_custom_slogan')) || "Tu frase favorita aquí";
  const tiktok = localStorage.getItem(storageKey('su_custom_tiktok')) || "#";
  const instagram = localStorage.getItem(storageKey('su_custom_instagram')) || "#";
  const whatsappNum = localStorage.getItem(storageKey('su_custom_whatsapp')) || "";
  const deliveryWhatsappNum = localStorage.getItem(storageKey('su_custom_delivery_whatsapp')) || "";
  const facebook = localStorage.getItem(storageKey('su_custom_facebook')) || "#";
  const location = localStorage.getItem(storageKey('su_custom_location')) || "#";
  const openTime = localStorage.getItem(storageKey('su_custom_open_time')) || "08:00";
  const closeTime = localStorage.getItem(storageKey('su_custom_close_time')) || "23:00";

  const whatsappUrl = whatsappNum ? `https://wa.me/51${whatsappNum}` : "#";

  // Actualizar Vista Cliente
  const sloganEl = document.getElementById('customSlogan');
  const tiktokEl = document.getElementById('linkTiktok');
  const instagramEl = document.getElementById('linkInstagram');
  const whatsappEl = document.getElementById('linkWhatsapp');
  const facebookEl = document.getElementById('linkFacebook');
  const locationEl = document.getElementById('linkLocation');

  if (sloganEl) sloganEl.textContent = slogan;
  if (tiktokEl) tiktokEl.href = tiktok;
  if (instagramEl) instagramEl.href = instagram;
  if (whatsappEl) whatsappEl.href = whatsappUrl;
  if (facebookEl) facebookEl.href = facebook;
  if (locationEl) locationEl.href = location;

  updateStoreStatusUI(openTime, closeTime);

  // Actualizar Inputs Admin
  const adminSlogan = document.getElementById('adminSlogan');
  const adminTiktok = document.getElementById('adminTiktok');
  const adminInstagram = document.getElementById('adminInstagram');
  const adminWhatsapp = document.getElementById('adminWhatsapp');
  const adminDeliveryWhatsapp = document.getElementById('adminDeliveryWhatsapp');
  const adminFacebook = document.getElementById('adminFacebook');
  const adminLocation = document.getElementById('adminLocation');
  const adminOpenTime = document.getElementById('adminOpenTime');
  const adminCloseTime = document.getElementById('adminCloseTime');

  if (adminSlogan) adminSlogan.value = slogan;
  if (adminTiktok) adminTiktok.value = tiktok;
  if (adminInstagram) adminInstagram.value = instagram;
  if (adminWhatsapp) adminWhatsapp.value = whatsappNum;
  if (adminDeliveryWhatsapp) adminDeliveryWhatsapp.value = deliveryWhatsappNum;
  if (adminFacebook) adminFacebook.value = facebook;
  if (adminLocation) adminLocation.value = location;
  if (adminOpenTime) adminOpenTime.value = openTime;
  if (adminCloseTime) adminCloseTime.value = closeTime;
}

function saveCustomSettings() {
  const slogan = document.getElementById('adminSlogan').value;
  const tiktok = document.getElementById('adminTiktok').value;
  const instagram = document.getElementById('adminInstagram').value;
  let whatsapp = document.getElementById('adminWhatsapp').value;
  let deliveryWhatsapp = document.getElementById('adminDeliveryWhatsapp').value;
  const facebook = document.getElementById('adminFacebook').value;
  const location = document.getElementById('adminLocation').value;
  const openTime = document.getElementById('adminOpenTime').value;
  const closeTime = document.getElementById('adminCloseTime').value;

  // Limpiar los números de WhatsApp
  whatsapp = whatsapp.replace(/\D/g, '');
  deliveryWhatsapp = deliveryWhatsapp.replace(/\D/g, '');

  localStorage.setItem(storageKey('su_custom_slogan'), slogan);
  localStorage.setItem(storageKey('su_custom_tiktok'), tiktok);
  localStorage.setItem(storageKey('su_custom_instagram'), instagram);
  localStorage.setItem(storageKey('su_custom_whatsapp'), whatsapp);
  localStorage.setItem(storageKey('su_custom_delivery_whatsapp'), deliveryWhatsapp);
  localStorage.setItem(storageKey('su_custom_facebook'), facebook);
  localStorage.setItem(storageKey('su_custom_location'), location);
  localStorage.setItem(storageKey('su_custom_open_time'), openTime);
  localStorage.setItem(storageKey('su_custom_close_time'), closeTime);

  loadCustomSettings(); // Recargar visualmente
  showNotification("Éxito", "Personalización guardada correctamente");
}

// ======================== CAMBIO DE VISTAS ========================
function switchView(view) {
  if (view === 'admin' && !isAdminAuthenticated) {
    openLoginModal();
    return;
  }

  currentView = view;
  document.getElementById('clienteView').classList.toggle('hidden', view !== 'cliente');
  document.getElementById('adminView').classList.toggle('hidden', view !== 'admin');
  document.getElementById('cartIndicator').classList.toggle('hidden', view !== 'cliente');
  
  // Mostrar u ocultar acciones de admin en la cabecera
  const adminNav = document.getElementById('adminNavActions');
  if (adminNav) {
    adminNav.classList.toggle('hidden', view !== 'admin');
    adminNav.classList.toggle('flex', view === 'admin');
  }

  // Ocultar landing si entramos a un negocio
  const b = new URLSearchParams(window.location.search).get('b');
  if (b) {
    document.getElementById('landingView').classList.add('hidden');
    document.getElementById('mainNav').classList.remove('hidden');
    const footerAdm = document.getElementById('footerAdminContainer');
    if (footerAdm) footerAdm.classList.remove('hidden');
  }

  // Actualizar estados visuales de los botones de navegación (si existen)
  const btnCliente = document.getElementById('btnCliente');
  if (btnCliente) {
    btnCliente.classList.toggle('active', view === 'cliente');
    btnCliente.classList.toggle('text-white', view === 'cliente');
    btnCliente.classList.toggle('text-zinc-300', view !== 'cliente');
  }
  
  const btnAdmin = document.getElementById('btnAdmin');
  if (btnAdmin) {
    btnAdmin.classList.toggle('active', view === 'admin');
    btnAdmin.classList.toggle('text-white', view === 'admin');
    btnAdmin.classList.toggle('text-zinc-300', view !== 'admin');
  }
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  const tabPedidos = document.getElementById('tabPedidos');
  const tabProductos = document.getElementById('tabProductos');
  const ordersPanel = document.getElementById('ordersPanel');
  const productsPanel = document.getElementById('productsPanel');

  if (tab === 'pedidos') {
    tabPedidos.classList.add('text-primary', 'border-b-2', 'border-primary');
    tabPedidos.classList.remove('text-zinc-300');
    tabProductos.classList.remove('text-primary', 'border-b-2', 'border-primary');
    tabProductos.classList.add('text-zinc-300');
    ordersPanel.classList.remove('hidden');
    productsPanel.classList.add('hidden');
  } else {
    tabProductos.classList.add('text-primary', 'border-b-2', 'border-primary');
    tabProductos.classList.remove('text-zinc-300');
    tabPedidos.classList.remove('text-primary', 'border-b-2', 'border-primary');
    tabPedidos.classList.add('text-zinc-300');
    productsPanel.classList.remove('hidden');
    ordersPanel.classList.add('hidden');
  }
}

// ======================== LÓGICA DE PRODUCTOS ========================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const filtered = currentCategory === 'todos' ? products.filter(p => p.available) : products.filter(p => p.category === currentCategory && p.available);

  grid.innerHTML = filtered.map((p, i) => `
    <div class="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-md shadow-black/20 card-hover slide-in flex flex-col h-full" style="animation-delay: ${i * 50}ms">
      <div class="h-32 bg-gradient-to-br from-primary/5 to-zinc-900 flex items-center justify-center relative overflow-hidden flex-shrink-0">
        ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : getCategoryIcon(p.category)}
      </div>
      <div class="p-3 sm:p-4 flex flex-col flex-1">
        <span class="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">${p.category}</span>
        <h4 class="text-sm sm:text-lg font-bold text-white mt-1 font-display leading-tight line-clamp-1">${p.name}</h4>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">${p.description}</p>
        <div class="flex items-center justify-between mt-3 sm:mt-5">
          <span class="text-sm sm:text-xl font-bold text-primary">S/. ${p.price.toFixed(2)}</span>
          <button onclick="handleAddToCart(${p.id})" class="w-10 h-10 sm:w-12 sm:h-12 bg-primary hover:bg-primary-dark text-white rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-primary/20">
            <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function getCategoryIcon(category) {
  const icons = {
    hamburguesas: `<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7h16M4 12h16M4 17h16M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M6 17v2a2 2 0 002 2h8a2 2 0 002-2v-2"/></svg>`,
    alitas: `<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3c-1.5 0-3 .5-4 1.5C6 6 5 9 5 12s1 6 3 7.5c1 1 2.5 1.5 4 1.5s3-.5 4-1.5c2-1.5 3-4.5 3-7.5s-1-6-3-7.5c-1-1-2.5-1.5-4-1.5z"/></svg>`,
    salchipapas: `<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>`,
    pizzas: `<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2L2 19h20L12 2z"/><circle cx="12" cy="12" r="2"/></svg>`,
    bebidas: `<svg class="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3h6l1 18H8L9 3zM12 7v4"/></svg>`
  };
  return icons[category] || icons.hamburguesas;
}

function filterCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
    btn.classList.toggle('text-zinc-300', btn.dataset.category !== category);
  });
  const titles = { todos: 'Nuestro Menu', hamburguesas: 'Hamburguesas', alitas: 'Alitas', salchipapas: 'Salchipapas', pizzas: 'Pizzas', bebidas: 'Bebidas' };
  document.getElementById('sectionTitle').textContent = titles[category];
  renderProducts();
}

// ======================== LÓGICA DE PERSONALIZACIÓN ========================
function handleAddToCart(id) {
  const p = products.find(x => x.id === id);
  currentCustomProductId = id;
  openCustomizeModal(id);
}

function openCustomizeModal(id) {
  const p = products.find(x => x.id === id);
  document.getElementById('customizeTitle').textContent = `Personalizar ${p.name}`;
  document.getElementById('saucesSection').classList.toggle('hidden', p.category === 'bebidas');
  document.getElementById('papaSection').classList.toggle('hidden', !['hamburguesas', 'salchipapas'].includes(p.category));
  document.getElementById('saladSection').classList.toggle('hidden', !['hamburguesas', 'salchipapas'].includes(p.category));
  document.getElementById('tempSection').classList.toggle('hidden', p.category !== 'bebidas');
  document.getElementById('customizeForm').reset();
  document.getElementById('customizeModal').classList.remove('hidden');
  document.getElementById('customizeModal').classList.add('flex');
}

function closeCustomizeModal() {
  document.getElementById('customizeModal').classList.add('hidden');
  document.getElementById('customizeModal').classList.remove('flex');
}

function addToCartWithCustomization(e) {
  e.preventDefault();
  const p = products.find(x => x.id === currentCustomProductId);
  const fd = new FormData(e.target);
  const extras = {};
  if (p.category !== 'bebidas') {
    extras.sauces = fd.getAll('sauce').length > 0 ? fd.getAll('sauce') : ['Sin Salsa'];
    if (['hamburguesas', 'salchipapas'].includes(p.category)) {
      extras.potato = fd.get('potato');
      extras.salad = fd.get('salad');
    }
  } else {
    extras.temp = fd.get('temp');
  }
  cart.push({ ...p, quantity: 1, extras, cartId: Date.now() });
  updateCartUI();
  closeCustomizeModal();
  openCart(); // Abrir el carrito automáticamente para retroalimentación instantánea
}

// ======================== LÓGICA DEL CARRITO ========================
function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const countEl = document.getElementById('cartCount');
  const emptyEl = document.getElementById('emptyCart');
  const listEl = document.getElementById('cartItemsList');
  const footerEl = document.getElementById('cartFooter');

  if (count > 0) {
    countEl.classList.remove('hidden');
    countEl.textContent = count;
    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    footerEl.classList.remove('hidden');
    listEl.innerHTML = cart.map((item, idx) => `
      <div class="flex items-center gap-4 bg-zinc-800/50 border border-zinc-800 rounded-2xl p-4 slide-in" style="animation-delay: ${idx * 100}ms">
        <div class="flex-1">
          <h4 class="font-bold text-white text-base">${item.name}</h4>
          <p class="text-xs text-zinc-300 mt-1">${formatExtras(item.extras)}</p>
          <p class="text-lg text-primary font-bold mt-1">S/. ${item.price.toFixed(2)}</p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center gap-3 bg-zinc-950 rounded-xl border border-zinc-800 p-1">
            <button onclick="updateCartItemQuantity(${item.cartId}, -1)" class="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-primary hover:bg-white/5 rounded-lg transition-all">-</button>
            <span class="text-sm font-bold w-4 text-center text-white">${item.quantity}</span>
            <button onclick="updateCartItemQuantity(${item.cartId}, 1)" class="w-8 h-8 flex items-center justify-center text-zinc-300 hover:text-primary hover:bg-white/5 rounded-lg transition-all">+</button>
          </div>
          <button onclick="removeCartItem(${item.cartId})" class="text-xs text-red-500 hover:text-red-400 font-medium mt-1">Quitar</button>
        </div>
      </div>
    `).join('');
  } else {
    countEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    listEl.classList.add('hidden');
    footerEl.classList.add('hidden');
  }
  document.getElementById('cartSubtotal').textContent = `S/. ${total.toFixed(2)}`;
  document.getElementById('minOrderMsg').classList.toggle('hidden', total >= 10);
  document.getElementById('checkoutBtn').disabled = total < 10;
}

function formatExtras(extras) {
  if (!extras) return '';
  let str = '';
  if (extras.sauces) str += extras.sauces.join(', ');
  if (extras.potato) str += ` | ${extras.potato}`;
  if (extras.salad) str += ` | ${extras.salad}`;
  if (extras.temp) str += extras.temp;
  return str;
}

function removeCartItem(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  updateCartUI();
}

function updateCartItemQuantity(cartId, delta) {
  const item = cart.find(i => i.cartId === cartId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeCartItem(cartId);
    } else {
      updateCartUI();
    }
  }
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = !sidebar.classList.contains('translate-x-full');
  
  if (isOpen) {
    sidebar.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
  } else {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
    }, 10);
  }
}

function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.remove('translate-x-full');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
  }, 10);
}

function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.add('translate-x-full');
  overlay.classList.remove('opacity-100');
  overlay.classList.add('opacity-0');
  setTimeout(() => {
    overlay.classList.add('hidden');
  }, 300);
}

// ======================== CHECKOUT ========================
function openCheckoutModal() {
  if (cart.length === 0) return;
  
  if (!isStoreOpen()) {
    showNotification("Cerrado", "El local está cerrado actualmente. Vuelva mañana.", "warning");
    return;
  }

  toggleCart();
  updateCheckoutTotals();
  togglePaymentFields(); 
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.getElementById('checkoutModal').classList.add('flex');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.add('hidden');
  document.getElementById('checkoutModal').classList.remove('flex');
  document.getElementById('checkoutForm').reset();
  document.getElementById('addressSection').classList.add('hidden');
  document.getElementById('paymentFieldsContainer').innerHTML = '';
}

function toggleDeliveryOptions() {
  const isDelivery = document.querySelector('input[name="deliveryType"]:checked').value === 'delivery';
  document.getElementById('addressSection').classList.toggle('hidden', !isDelivery);
  document.getElementById('deliveryFeeRow').classList.toggle('hidden', !isDelivery);
  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const isDelivery = document.querySelector('input[name="deliveryType"]:checked')?.value === 'delivery';
  const deliveryFee = isDelivery ? 2 : 0;
  const total = subtotal + deliveryFee;
  document.getElementById('checkoutSubtotal').textContent = `S/. ${subtotal.toFixed(2)}`;
  document.getElementById('checkoutTotal').textContent = `S/. ${total.toFixed(2)}`;
}

function togglePaymentFields() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const container = document.getElementById('paymentFieldsContainer');
  if (method === 'efectivo') {
    const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('S/. ', ''));
    container.innerHTML = `
      <div class="bg-zinc-800 p-4 rounded-xl mt-4">
        <label class="block text-sm font-medium text-white mb-1">Con cuanto pagas?</label>
        <input type="number" step="0.01" name="cashAmount" required class="w-full px-4 py-2 rounded-lg border border-zinc-800" placeholder="0.00" onchange="calculateChange(this.value)">
        <div id="changeResult" class="mt-2 text-sm font-medium text-success hidden"></div>
      </div>`;
  } else if (method === 'yape' || method === 'plin') {
    container.innerHTML = `
      <div class="bg-zinc-800 p-4 rounded-xl mt-4">
        <p class="text-sm text-white mb-2">Realiza el pago y sube la captura:</p>
        <p class="text-lg font-bold text-purple-600 mb-2">Numero: 987 654 321</p>
        <input type="file" accept="image/*" name="paymentProof" required class="w-full text-sm">
      </div>`;
  } else {
    container.innerHTML = `<div class="bg-zinc-800 p-4 rounded-xl mt-4 text-sm text-white">El POS se pasara al momento de la entrega.</div>`;
  }
}

function calculateChange(cash) {
  const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('S/. ', ''));
  const res = document.getElementById('changeResult');
  const diff = parseFloat(cash) - total;
  if (diff >= 0) {
    res.textContent = `Vuelto: S/. ${diff.toFixed(2)}`;
    res.classList.remove('hidden');
    res.classList.remove('text-primary');
    res.classList.add('text-success');
  } else {
    res.textContent = `Falta: S/. ${Math.abs(diff).toFixed(2)}`;
    res.classList.remove('hidden');
    res.classList.remove('text-success');
    res.classList.add('text-primary');
  }
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      document.getElementById('gpsLat').value = pos.coords.latitude;
      document.getElementById('gpsLng').value = pos.coords.longitude;
      document.getElementById('gpsStatus').textContent = "Ubicacion capturada";
      document.getElementById('gpsStatus').classList.remove('hidden');
    });
  }
}

function submitOrder(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const isDelivery = fd.get('deliveryType') === 'delivery';
  const total = isDelivery ? subtotal + 2 : subtotal;

  const order = {
    id: 1000 + orders.length + 1,
    customer: { name: fd.get('customerName'), phone: fd.get('customerPhone'), address: fd.get('customerAddress') || 'Recojo en local', lat: fd.get('lat'), lng: fd.get('lng') },
    items: [...cart],
    subtotal: subtotal,
    deliveryFee: isDelivery ? 2 : 0,
    total: total,
    paymentMethod: fd.get('paymentMethod'),
    paymentDetails: fd.get('cashAmount') || fd.get('paymentProof')?.name || '',
    type: fd.get('deliveryType'),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  saveData();
  
  // WhatsApp Message
  const msg = encodeURIComponent(`Hola *${order.customer.name}*, gracias por tu pedido en *PideClick*!\n\nPedido #${order.id}\nTotal: S/. ${order.total.toFixed(2)}\n\nEstamos preparando tu orden.\n\nTe notificaremos cuando este listo.`);
  window.open(`https://wa.me/51${order.customer.phone}?text=${msg}`, '_blank');

  cart = [];
  updateCartUI();
  renderOrders();
  updateOrderCounts();
  closeCheckoutModal();
  
  document.getElementById('successModal').classList.remove('hidden');
  document.getElementById('successModal').classList.add('flex');
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.add('hidden');
  document.getElementById('successModal').classList.remove('flex');
}

// ======================== PEDIDOS ADMIN ========================
function renderOrders() {
  const list = document.getElementById('ordersList');
  if (orders.length === 0) { list.innerHTML = `<div class="text-center py-10 text-zinc-300">No hay pedidos</div>`; return; }
  list.innerHTML = orders.map(o => `
    <div class="bg-zinc-800 rounded-2xl border border-zinc-800 shadow-md shadow-black/20 overflow-hidden">
      <div class="p-4">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-white px-2 py-0.5 rounded-full ${o.type === 'delivery' ? 'bg-primary-dark' : 'bg-success'}">${o.type === 'delivery' ? 'Delivery' : 'Recojo'}</span>
              <span class="text-[10px] text-zinc-400 font-medium">${formatDate(o.createdAt)}</span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-bold text-lg text-primary">#${o.id}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium status-${o.status}">${getStatusText(o.status)}</span>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg">S/. ${o.total.toFixed(2)}</p>
            <p class="text-xs text-zinc-300">${o.paymentMethod}</p>
          </div>
        </div>
        <div class="text-sm mb-2"><p class="font-medium">${o.customer.name}</p><p class="text-zinc-300">${o.customer.address}</p></div>
        <div class="flex flex-wrap gap-1 mb-3">${o.items.map(i => `<span class="bg-zinc-950 text-xs px-2 py-1 rounded">${i.quantity}x ${i.name}</span>`).join('')}</div>
        <div class="flex gap-2 border-t pt-3 mt-2">
          ${o.status === 'pending' ? `<button onclick="updateOrderStatus(${o.id}, 'preparing')" class="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold">Preparar</button>` : ''}
          ${o.status === 'preparing' ? `<button onclick="updateOrderStatus(${o.id}, 'ready')" class="flex-1 bg-success text-white py-2 rounded-lg text-sm">Listo</button>` : ''}
          ${o.status === 'ready' ? `<button onclick="openDispatchModal(${o.id})" class="flex-1 bg-primary text-white py-2 rounded-lg text-sm">Despachar</button>` : ''}
          ${o.status === 'ready' ? `<a href="https://wa.me/51${o.customer.phone}?text=${encodeURIComponent('Tu pedido #'+o.id+' esta listo!')}" target="_blank" class="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm text-center">Avisar WA</a>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function getStatusText(s) { return { pending: 'Pendiente', preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado' }[s] || s; }

function updateOrderStatus(id, status) {
  const o = orders.find(x => x.id === id);
  if (o) { o.status = status; saveData(); renderOrders(); updateOrderCounts(); }
  if (status === 'delivered') closeDispatchModal();
}

function updateOrderCounts() {
  document.getElementById('pendingCount').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('preparingCount').textContent = orders.filter(o => o.status === 'preparing').length;
  document.getElementById('readyCount').textContent = orders.filter(o => o.status === 'ready').length;
}

function openDispatchModal(id) {
  currentDispatchOrderId = id;
  const o = orders.find(x => x.id === id);
  const mapsLink = o.customer.lat ? `https://www.google.com/maps?q=${o.customer.lat},${o.customer.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer.address)}`;
  const itemsText = o.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
  
  document.getElementById('dispatchContent').innerHTML = `
    <div class="bg-zinc-950 rounded-xl p-4 space-y-2 text-sm">
      <div class="flex justify-between items-start">
        <p><strong>Cliente:</strong> ${o.customer.name}</p>
        <span class="text-[10px] text-zinc-500">${formatDate(o.createdAt)}</span>
      </div>
      <p><strong>Telf:</strong> ${o.customer.phone}</p><p><strong>Dir:</strong> ${o.customer.address}</p>
      <a href="${mapsLink}" target="_blank" class="text-primary underline block">Ver en Maps</a><hr class="my-2">
      <p><strong>Pedido:</strong> ${itemsText}</p><p class="text-lg font-bold text-right">Total: S/. ${o.total.toFixed(2)}</p>
    </div>`;
  const waMsg = encodeURIComponent(`*Pedido #${o.id}*\nCliente: ${o.customer.name}\nDir: ${o.customer.address}\nMaps: ${mapsLink}\nTotal: S/. ${o.total.toFixed(2)}`);
  const deliveryNum = localStorage.getItem(storageKey('su_custom_delivery_whatsapp')) || "999999999";
  document.getElementById('whatsappDeliveryLink').href = `https://wa.me/51${deliveryNum}?text=${waMsg}`;
  document.getElementById('printArea').innerHTML = `<div style="font-family: monospace; width: 100%;"><h2 style="text-align:center;">PIDECLICK</h2><p style="text-align:center; font-size:10px;">${formatDate(o.createdAt)}</p><hr><p>Pedido: #${o.id}</p><p>Cliente: ${o.customer.name}</p><p>Dir: ${o.customer.address}</p><p>Telf: ${o.customer.phone}</p><hr>${o.items.map(i => `<p>${i.quantity}x ${i.name} - S/.${(i.price*i.quantity).toFixed(2)}</p>`).join('')}<hr><p><strong>TOTAL: S/. ${o.total.toFixed(2)}</strong></p></div>`;
  document.getElementById('dispatchModal').classList.remove('hidden');
  document.getElementById('dispatchModal').classList.add('flex');
}

function closeDispatchModal() { document.getElementById('dispatchModal').classList.add('hidden'); document.getElementById('dispatchModal').classList.remove('flex'); }

// ======================== PRODUCTOS ADMIN ========================

function renderAdminProducts() {
  const grid = document.getElementById('adminProductsGrid');
  grid.innerHTML = products.map(p => `
    <div class="bg-zinc-800 rounded-2xl border overflow-hidden ${!p.available ? 'opacity-50' : ''}">
      <div class="h-32 bg-zinc-950 flex items-center justify-center relative">${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : getCategoryIcon(p.category)}${!p.available ? `<span class="absolute top-2 right-2 bg-primary-dark text-white text-xs px-2 py-0.5 rounded">No disponible</span>` : ''}</div>
      <div class="p-3">
        <h4 class="font-bold text-white">${p.name}</h4>
        <p class="text-primary font-bold">S/. ${p.price.toFixed(2)}</p>
        <div class="flex gap-2 mt-2">
          <button onclick="editProduct(${p.id})" class="flex-1 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors">Editar</button>
          <button onclick="deleteProduct(${p.id})" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');
}

function openProductModal(id = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const preview = document.getElementById('productPreviewImg');
  form.reset(); preview.classList.add('hidden'); document.getElementById('productId').value = '';
  if (id) {
    const p = products.find(x => x.id === id);
    if (p) {
      document.getElementById('productId').value = p.id; document.getElementById('productName').value = p.name; document.getElementById('productCategory').value = p.category; document.getElementById('productPrice').value = p.price; document.getElementById('productDescription').value = p.description; document.getElementById('productAvailable').checked = p.available;
      if (p.image) { preview.src = p.image; preview.classList.remove('hidden'); }
    }
  }
  modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeProductModal() { document.getElementById('productModal').classList.add('hidden'); document.getElementById('productModal').classList.remove('flex'); }

function previewProductImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { const preview = document.getElementById('productPreviewImg'); preview.src = e.target.result; preview.classList.remove('hidden'); };
    reader.readAsDataURL(input.files[0]);
  }
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value;
  const category = document.getElementById('productCategory').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const description = document.getElementById('productDescription').value;
  if (!name || isNaN(price)) { showNotification("Atención", "Por favor completa los campos correctamente", "warning"); return; }
  const available = document.getElementById('productAvailable').checked;
  const imageInput = document.getElementById('productImageInput');
  if (imageInput.files && imageInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(event) { finishSave(id, name, category, price, description, available, event.target.result); };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    const existing = products.find(p => p.id == id);
    finishSave(id, name, category, price, description, available, existing ? existing.image : '');
  }
}

function finishSave(id, name, category, price, description, available, image) {
  const plan = window.SaaS.getPlanLimits();
  
  if (!id) { // Solo verificamos el límite al crear productos nuevos
    if (products.length >= plan.maxProducts) {
      showNotification("Límite Alcanzado", `Tu plan actual solo permite ${plan.maxProducts} productos.`, "warning");
      return;
    }
  }

  if (id) {
    const idx = products.findIndex(p => p.id == id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, category, price, description, available, image };
    }
  } else {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({ id: newId, name, category, price, description, available, image });
  }
  saveData(); 
  renderProducts(); 
  renderAdminProducts();
  updatePlanUI(); // Actualizar botón de nuevo producto
  closeProductModal(); 
  showNotification("Éxito", "Producto guardado correctamente");
}

function editProduct(id) { openProductModal(id); }
function deleteProduct(id) { if(confirm('Eliminar?')) { products = products.filter(p => p.id !== id); saveData(); renderProducts(); renderAdminProducts(); } }

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  const timeStr = date.toLocaleTimeString('es-PE', options);
  
  // Si es hoy, solo mostrar la hora
  if (date.toDateString() === now.toDateString()) {
    return `Hoy, ${timeStr}`;
  }
  
  // Si es ayer
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Ayer, ${timeStr}`;
  }

  const dateOptions = { day: '2-digit', month: 'short' };
  return `${date.toLocaleDateString('es-PE', dateOptions)}, ${timeStr}`;
}

function isStoreOpen() {
  const openTime = localStorage.getItem('su_custom_open_time') || "08:00";
  const closeTime = localStorage.getItem('su_custom_close_time') || "23:00";
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [openHours, openMins] = openTime.split(':').map(Number);
  const [closeHours, closeMins] = closeTime.split(':').map(Number);
  
  const openTotalMins = openHours * 60 + openMins;
  const closeTotalMins = closeHours * 60 + closeMins;
  
  // Manejo básico: asume que el cierre es después de la apertura en el mismo día
  // Si quisiéramos cierre de madrugada (ej: 02:00) necesitaríamos lógica extra
  return currentMinutes >= openTotalMins && currentMinutes < closeTotalMins;
}

function updateStoreStatusUI(open, close) {
  const badge = document.getElementById('storeStatusBadge');
  const text = document.getElementById('storeHoursDisplay');
  if (!badge || !text) return;

  const isOpen = isStoreOpen();
  
  if (isOpen) {
    badge.textContent = "Abierto Ahora";
    badge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1 bg-green-500/20 text-green-500 border border-green-500/30";
  } else {
    badge.textContent = "Cerrado";
    badge.className = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1 bg-red-500/20 text-red-500 border border-red-500/30";
  }
  
  text.textContent = `Horario: ${open} a ${close}`;
}

function getBusinessLocation() {
  if (navigator.geolocation) {
    showNotification("GPS", "Capturando ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        document.getElementById('adminLocation').value = mapsUrl;
        showNotification("Éxito", "Ubicación capturada correctamente");
      },
      err => {
        showNotification("Error", "No se pudo obtener la ubicación. Asegúrate de dar permisos.", "error");
      }
    );
  } else {
    showNotification("Error", "Tu navegador no soporta geolocalización", "error");
  }
}

// ======================== SISTEMA DE LOGIN ADMIN ========================
function openLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginModal').classList.add('flex');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('flex');
}

function loginAdmin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;

  // Credenciales por defecto: admin / admin123
  if (user === 'admin' && pass === 'admin123') {
    isAdminAuthenticated = true;
    sessionStorage.setItem(storageKey('su_admin_auth'), 'true');
    closeLoginModal();
    switchView('admin');
    showNotification("Bienvenido", "Sesión iniciada correctamente");
  } else {
    showNotification("Error", "Usuario o contraseña incorrectos", "error");
  }
}

function logoutAdmin() {
  isAdminAuthenticated = false;
  sessionStorage.removeItem(storageKey('su_admin_auth'));
  switchView('cliente');
  showNotification("Sesión Cerrada", "Has salido del panel de administración");
}
