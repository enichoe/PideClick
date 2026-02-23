// ======================== INICIALIZACIÓN DE DATOS ========================
let products = JSON.parse(localStorage.getItem('su_products')) || [
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

let orders = JSON.parse(localStorage.getItem('su_orders')) || [
   { id: 1001, customer: { name: "Maria Garcia", phone: "987654321", address: "Av. Los Olivos 123" }, items: [{id: 2, name: "Urbana Doble", quantity: 2, price: 18.50, extras: {sauces: ["Mayonesa"], potato: "Normales", salad: "Sin Ensalada"}}], subtotal: 37.00, deliveryFee: 2.00, total: 39.00, paymentMethod: "yape", type: "delivery", status: "pending", createdAt: new Date().toISOString() },
   { id: 1002, customer: { name: "Carlos Mendoza", phone: "912345678", address: "Recojo en local" }, items: [{id: 8, name: "Pizza Familiar", quantity: 1, price: 32.90, extras: {}}], subtotal: 32.90, deliveryFee: 0, total: 32.90, paymentMethod: "efectivo", type: "recojo", status: "preparing", createdAt: new Date().toISOString() }
];

let cart = [];
let currentCategory = 'todos';
let currentAdminTab = 'pedidos';
let currentView = 'cliente';
let currentCustomProductId = null;
let currentDispatchOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadGlobalImages(); // Solo carga el banner ahora
  renderProducts();
  renderOrders();
  updateOrderCounts();
  renderAdminProducts();
});

function saveData() {
  try {
    localStorage.setItem('su_products', JSON.stringify(products));
    localStorage.setItem('su_orders', JSON.stringify(orders));
  } catch (e) {
    console.error("Error guardando en localStorage:", e);
    alert("Error: No se pudo guardar. Es posible que las imágenes sean demasiado pesadas. Intenta con una imagen más pequeña.");
  }
}

// ======================== GESTIÓN DE IMÁGENES GLOBALES ========================
function loadGlobalImages() {
  // LOGO ELIMINADO DE AQUI - Ahora es estático en HTML
  const banner = localStorage.getItem('su_banner');
  if (banner) document.getElementById('mainBanner').src = banner;
}

function uploadGlobalImage(type, input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (type === 'banner') {
        try {
          localStorage.setItem('su_banner', e.target.result);
          const bannerImg = document.getElementById('mainBanner');
          if (bannerImg) bannerImg.src = e.target.result;
          alert('Banner actualizado y guardado con éxito');
        } catch (err) {
          alert('Error: La imagen del banner es demasiado pesada para el navegador.');
        }
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ======================== CAMBIO DE VISTAS ========================
function switchView(view) {
  currentView = view;
  document.getElementById('clienteView').classList.toggle('hidden', view !== 'cliente');
  document.getElementById('adminView').classList.toggle('hidden', view !== 'admin');
  document.getElementById('cartIndicator').classList.toggle('hidden', view !== 'cliente');
  document.getElementById('btnCliente').classList.toggle('active', view === 'cliente');
  document.getElementById('btnCliente').classList.toggle('text-white', view === 'cliente');
  document.getElementById('btnCliente').classList.toggle('text-zinc-300', view !== 'cliente');
  document.getElementById('btnAdmin').classList.toggle('active', view === 'admin');
  document.getElementById('btnAdmin').classList.toggle('text-white', view === 'admin');
  document.getElementById('btnAdmin').classList.toggle('text-zinc-300', view !== 'admin');
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
    <div class="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-800 shadow-md shadow-black/20 card-hover slide-in" style="animation-delay: ${i * 50}ms">
      <div class="h-40 bg-gradient-to-br from-primary/5 to-zinc-900 flex items-center justify-center relative overflow-hidden">
        ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover">` : getCategoryIcon(p.category)}
      </div>
      <div class="p-4">
        <span class="text-xs font-bold text-primary uppercase tracking-wider">${p.category}</span>
        <h4 class="text-lg font-bold text-white mt-1 font-display leading-tight">${p.name}</h4>
        <p class="text-sm text-zinc-300 mt-2 line-clamp-2 leading-relaxed">${p.description}</p>
        <div class="flex items-center justify-between mt-5">
          <span class="text-xl font-bold text-primary">S/. ${p.price.toFixed(2)}</span>
          <button onclick="handleAddToCart(${p.id})" class="w-12 h-12 bg-primary hover:bg-primary-dark text-white rounded-2xl flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-primary/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
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
            <span class="text-xs text-white px-2 py-0.5 rounded-full ${o.type === 'delivery' ? 'bg-primary-dark' : 'bg-success'}">${o.type === 'delivery' ? 'Delivery' : 'Recojo'}</span>
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
      <p><strong>Cliente:</strong> ${o.customer.name}</p><p><strong>Telf:</strong> ${o.customer.phone}</p><p><strong>Dir:</strong> ${o.customer.address}</p>
      <a href="${mapsLink}" target="_blank" class="text-primary underline block">Ver en Maps</a><hr class="my-2">
      <p><strong>Pedido:</strong> ${itemsText}</p><p class="text-lg font-bold text-right">Total: S/. ${o.total.toFixed(2)}</p>
    </div>`;
  const waMsg = encodeURIComponent(`*Pedido #${o.id}*\nCliente: ${o.customer.name}\nDir: ${o.customer.address}\nMaps: ${mapsLink}\nTotal: S/. ${o.total.toFixed(2)}`);
  document.getElementById('whatsappDeliveryLink').href = `https://wa.me/51999999999?text=${waMsg}`;
  document.getElementById('printArea').innerHTML = `<div style="font-family: monospace; width: 100%;"><h2 style="text-align:center;">PIDECLICK</h2><hr><p>Pedido: #${o.id}</p><p>Cliente: ${o.customer.name}</p><p>Dir: ${o.customer.address}</p><p>Telf: ${o.customer.phone}</p><hr>${o.items.map(i => `<p>${i.quantity}x ${i.name} - S/.${(i.price*i.quantity).toFixed(2)}</p>`).join('')}<hr><p><strong>TOTAL: S/. ${o.total.toFixed(2)}</strong></p></div>`;
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
  if (!name || isNaN(price)) { alert('Por favor completa los campos correctamente'); return; }
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
  closeProductModal(); 
  setTimeout(() => alert('Producto guardado correctamente'), 100);
}

function editProduct(id) { openProductModal(id); }
function deleteProduct(id) { if(confirm('Eliminar?')) { products = products.filter(p => p.id !== id); saveData(); renderProducts(); renderAdminProducts(); } }