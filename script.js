// ======================== SISTEMA MULTI-TENANT ========================
const getTenantId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('b') || 'default';
};

const tenantId = getTenantId();
const storageKey = (key) => `${tenantId}_${key}`;

// ======================== INITIAL DATA (FALLBACK) ========================
let defaultProducts = [
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

let products = [];
let restaurantData = null;

let orders = JSON.parse(localStorage.getItem(storageKey('su_orders'))) || [];

let cart = [];
let currentCategory = 'todos';
let currentAdminTab = 'pedidos';
let currentView = 'cliente';
let currentCustomProductId = null;
let currentProduct = null;
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

  // Si no es PRO, mostramos CTA de mejora, PERO dejamos el branding visible para que pruebe el banner
  const isPro = sub.planId === 'pro';
  const brandingSection = document.getElementById('brandingConfig'); 
  if (brandingSection) brandingSection.classList.remove('hidden'); // Siempre visible
  
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

// ======================== SUPABASE CORE LOGIC ========================
async function fetchRestaurantFromSupabase(slug) {
  try {
    const { data, error } = await window.supabaseClient
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();
    
    // Si da error porque no encontró la fila (PGRST116), la creamos
    if (error && error.code === 'PGRST116') {
       console.log("No se encontró el restaurante en Supabase, inicializándolo...");
       const { data: newRest, error: insertError } = await window.supabaseClient
         .from('restaurants')
         .insert([{ slug: slug, name: 'Mi Nuevo Negocio' }])
         .select()
         .single();
         
       if (!insertError) return newRest;
       console.warn("No se pudo crear el negocio de forma automática", insertError);
       return null;
    }

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase: No se pudo cargar el restaurante, revisa conexión o permisos.", err);
    return null;
  }
}

async function fetchProductsFromSupabase(restaurantId) {
  try {
    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    if (error) throw error;
    // Forzar que siempre devuelva un arreglo, incluso si está vacío
    return data || [];
  } catch (err) {
    console.warn("Supabase: No se pudieron cargar los productos, usando datos locales.");
    return null; // El fallback decidirá qué poner
  }
}

async function initApp() {
  try {
    const params = new URLSearchParams(window.location.search);
    const b = params.get('b');

    if (!b) {
      showLandingPage();
    } else {
      window.SaaS.registerTenant(b);
      document.getElementById('mainNav').classList.remove('hidden');
      const footerAdm = document.getElementById('footerAdminContainer');
      if (footerAdm) footerAdm.classList.remove('hidden');

      const { data: { session } } = await window.supabaseClient.auth.getSession();
      isAdminAuthenticated = !!session;

      restaurantData = await fetchRestaurantFromSupabase(b);
      
      let dbProducts = null;
      if (restaurantData && restaurantData.id) {
          dbProducts = await fetchProductsFromSupabase(restaurantData.id);
      }

      if (dbProducts !== null) {
        products = dbProducts;
      } else {
        products = JSON.parse(localStorage.getItem(storageKey('su_products'))) || defaultProducts;
      }
      
      if (!products || !Array.isArray(products)) products = [];

      if (isAdminAuthenticated && restaurantData) {
        const { data: dbOrders } = await window.supabaseClient
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .order('created_at', { ascending: false });
        
        if (dbOrders) orders = dbOrders;
        setupRealtimeOrders(restaurantData.id);
        updateDashboardStats(); 
      } else {
        orders = JSON.parse(localStorage.getItem(storageKey('su_orders'))) || [];
      }

      // Safe renders
      try { loadGlobalImages(); } catch(e){ console.error(e) }
      try { loadCustomSettings(); } catch(e){ console.error(e) }
      try { renderProducts(); } catch(e){ console.error(e) }
      try { renderOrders(); } catch(e){ console.error(e) }
      try { updateOrderCounts(); } catch(e){ console.error(e) }
      try { renderAdminProducts(); } catch(e){ console.error(e) }
      try { updatePlanUI(); } catch(e){ console.error(e) }
      
      if (isAdminAuthenticated) {
        switchView('admin');
        switchAdminTab('pedidos'); 
      } else {
        switchView('cliente');
      }
    }
  } catch (error) {
    console.error("DEBUG CRITICAL INIT ERROR:", error);
    alert("Error crítico al cargar la aplicación: " + error.message);
  }
}


async function updateDashboardStats() {
  if (!restaurantData || !isAdminAuthenticated) return;

  const today = new Date().toISOString().split('T')[0];
  
  // Filtrar pedidos de hoy
  const todayOrders = orders.filter(o => o.created_at && o.created_at.startsWith(today));
  
  // Sumar ventas de hoy (solo listos o entregados)
  const todaySales = todayOrders
    .filter(o => o.status === 'ready' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Totales generales para ticket promedio
  const closedOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivered');
  const totalSalesValue = closedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgTicketValue = closedOrders.length > 0 ? totalSalesValue / closedOrders.length : 0;

  // Actualizar UI del Dashboard
  const elSales = document.getElementById('statsTodaySales');
  const elOrders = document.getElementById('statsTodayOrders');
  const elAvg = document.getElementById('statsAvgTicket');
  
  if (elSales) elSales.textContent = `S/. ${todaySales.toFixed(2)}`;
  if (elOrders) elOrders.textContent = todayOrders.length;
  if (elAvg) elAvg.textContent = `S/. ${avgTicketValue.toFixed(2)}`;

  // Estado del local en Dashboard
  const dbStatusEl = document.getElementById('dashboardStoreStatus');
  if (dbStatusEl) {
    const isOpen = isStoreOpen();
    dbStatusEl.innerHTML = `
      <div class="w-3 h-3 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}"></div>
      <span class="text-lg font-bold text-white italic">${isOpen ? 'Abierto' : 'Cerrado'}</span>
    `;
  }

  // Mejor Vendido
  const topProductEl = document.getElementById('statsTopProduct');
  if (topProductEl) {
    const counts = {};
    closedOrders.forEach(o => {
      if (o.items) o.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length > 0) {
      topProductEl.innerHTML = sorted.map(([name, count], i) => `
        <div class="flex items-center justify-between p-3 bg-zinc-800 border border-zinc-700/50 rounded-xl">
          <div class="flex items-center gap-3">
            <span class="text-primary font-bold">#${i+1}</span>
            <span class="text-white text-sm">${name}</span>
          </div>
          <span class="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">${count} uds</span>
        </div>
      `).join('');
    } else {
      topProductEl.innerHTML = `<p class="text-zinc-500 text-sm italic">Sin ventas registradas</p>`;
    }
  }
}

function setupRealtimeOrders(restaurantId) {
  window.supabaseClient
    .channel('orders-changes')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'orders',
      filter: `restaurant_id=eq.${restaurantId}`
    }, payload => {
      // Evitar duplicados si el admin fue el mismo que lo creó probando
      if (!orders.find(o => o.id === payload.new.id)) {
        orders.unshift(payload.new);
        showIncomingOrderModal(payload.new);
        renderOrders();
        updateOrderCounts();
        updateDashboardStats();
        if (currentAdminTab !== 'pedidos') {
          switchAdminTab('pedidos');
        }
      }
    })
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'orders',
      filter: `restaurant_id=eq.${restaurantId}`
    }, payload => {
      const index = orders.findIndex(o => o.id === payload.new.id);
      if (index !== -1) {
        orders[index] = payload.new;
        renderOrders();
        updateOrderCounts();
      }
    })
    .subscribe();
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

// ======================== SUPABASE STORAGE HELPER ========================
async function uploadImageToSupabase(file, folder = 'products', bucket = 'pideclick') {
  if (!file) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  try {
    const { data, error } = await window.supabaseClient.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    // Obtener URL pública
    const { data: { publicUrl } } = window.supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("DEBUG STORAGE ERROR:", err);
    alert(`Error de Storage (Subida de Imagen):\nCausa probable: El bucket '${bucket}' no existe, o no tiene políticas de RLS (INSERT) habilitadas.\n\nDetalle técnico: ${err.message}`);
    showNotification("Error", "No se pudo subir la imagen al servidor.", "error");
    return null;
  }
}

function saveData() {
  // Los pedidos ahora se gestionan vía Supabase Realtime/DB.
  // Limpiando código legacy de localStorage de la Fase 1.
  console.log("Sistema sincronizado con Supabase Cloud.");
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
  const banner = restaurantData?.banner_url || localStorage.getItem(storageKey('su_banner'));
  if (banner) document.getElementById('mainBanner').src = banner;
}

async function uploadGlobalImage(type, input) {
  const bSlug = new URLSearchParams(window.location.search).get('b') || 'default';
  
  if (input.files && input.files[0]) {
    const file = input.files[0];
    showNotification("Cargando", "Subiendo imagen...", "warning");
    
    const publicUrl = await uploadImageToSupabase(file, 'restaurants');
    
    if (publicUrl && type === 'banner') {
      let errorData = null;
      let newRest = null;

      // Si el restaurante ya existe, actualizamos. Si no, lo insertamos.
      if (restaurantData && restaurantData.id) {
        const { error } = await window.supabaseClient
          .from('restaurants')
          .update({ banner_url: publicUrl })
          .eq('id', restaurantData.id);
        errorData = error;
      } else {
        const { data, error } = await window.supabaseClient
          .from('restaurants')
          .insert([{ banner_url: publicUrl, slug: bSlug, name: 'Mi Nuevo Negocio' }])
          .select()
          .single();
        errorData = error;
        newRest = data;
      }
        
      if (!errorData) {
        if (newRest) restaurantData = newRest;
        if (restaurantData) restaurantData.banner_url = publicUrl;
        document.getElementById('mainBanner').src = publicUrl;
        showNotification("Éxito", "Banner guardado en la base de datos");
      } else {
        console.error("DEBUG UPLOAD IMAGE DB ERROR:", errorData);
        alert("ERROR SUBIENDO BANNER A DB:\nVerifica que la tabla 'restaurants' existe y tenga políticas correctas.\nDetalle: " + (errorData.message || JSON.stringify(errorData)));
        showNotification("Error", "No se pudo guardar la URL en la BD", "error");
      }
    }
  } else {
    showNotification("Error", "No se seleccionó ninguna imagen", "error");
  }
}

// ======================== GESTIÓN DE PERSONALIZACIÓN ========================
function loadCustomSettings() {
  // Si hay datos del backend, forzamos que sea el punto de verdad, ignorando vacíos que puedan traer default
  const slogan = restaurantData?.slogan || localStorage.getItem(storageKey('su_custom_slogan')) || "Tu frase favorita aquí";
  const tiktok = restaurantData?.tiktok_url || localStorage.getItem(storageKey('su_custom_tiktok')) || "#";
  const instagram = restaurantData?.instagram_url || localStorage.getItem(storageKey('su_custom_instagram')) || "#";
  const whatsappNum = restaurantData?.whatsapp_num || localStorage.getItem(storageKey('su_custom_whatsapp')) || "";
  const deliveryWhatsappNum = restaurantData?.delivery_whatsapp_num || localStorage.getItem(storageKey('su_custom_delivery_whatsapp')) || "";
  const facebook = restaurantData?.facebook_url || localStorage.getItem(storageKey('su_custom_facebook')) || "#";
  const location = restaurantData?.location_url || localStorage.getItem(storageKey('su_custom_location')) || "#";
  const openTime = restaurantData?.open_time || localStorage.getItem(storageKey('su_custom_open_time')) || "08:00";
  const closeTime = restaurantData?.close_time || localStorage.getItem(storageKey('su_custom_close_time')) || "23:00";

  // Sicronizamos de vuelta al local storage x si aca falla Supabase después
  if (restaurantData) {
    localStorage.setItem(storageKey('su_custom_slogan'), slogan);
    localStorage.setItem(storageKey('su_custom_tiktok'), tiktok);
    localStorage.setItem(storageKey('su_custom_instagram'), instagram);
    localStorage.setItem(storageKey('su_custom_whatsapp'), whatsappNum);
    localStorage.setItem(storageKey('su_custom_delivery_whatsapp'), deliveryWhatsappNum);
    localStorage.setItem(storageKey('su_custom_facebook'), facebook);
    localStorage.setItem(storageKey('su_custom_location'), location);
    localStorage.setItem(storageKey('su_custom_open_time'), openTime);
    localStorage.setItem(storageKey('su_custom_close_time'), closeTime);
    if(restaurantData.banner_url) localStorage.setItem(storageKey('su_banner'), restaurantData.banner_url);
  }

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
  updateDashboardStats(); // Forzamos recálculo del estado Abierto/Cerrado en vivo

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

async function saveCustomSettings() {
  const sloganEl = document.getElementById('adminSlogan');
  const tiktokEl = document.getElementById('adminTiktok');
  const instagramEl = document.getElementById('adminInstagram');
  const whatsappEl = document.getElementById('adminWhatsapp');
  const deliveryWhatsappEl = document.getElementById('adminDeliveryWhatsapp');
  const facebookEl = document.getElementById('adminFacebook');
  const locationEl = document.getElementById('adminLocation');
  const openTimeEl = document.getElementById('adminOpenTime');
  const closeTimeEl = document.getElementById('adminCloseTime');

  const slogan = sloganEl.value.trim() || restaurantData?.slogan || "Tu frase favorita aquí";
  const tiktok = tiktokEl.value.trim() || restaurantData?.tiktok_url || "#";
  const instagram = instagramEl.value.trim() || restaurantData?.instagram_url || "#";
  let whatsapp = whatsappEl.value.trim() || restaurantData?.whatsapp_num || "";
  let deliveryWhatsapp = deliveryWhatsappEl.value.trim() || restaurantData?.delivery_whatsapp_num || "";
  const facebook = facebookEl.value.trim() || restaurantData?.facebook_url || "#";
  const location = locationEl.value.trim() || restaurantData?.location_url || "#";
  const openTime = openTimeEl.value.trim() || restaurantData?.open_time || "08:00";
  const closeTime = closeTimeEl.value.trim() || restaurantData?.close_time || "23:00";

  // Limpiar los números de WhatsApp
  whatsapp = whatsapp.replace(/\D/g, '');
  deliveryWhatsapp = deliveryWhatsapp.replace(/\D/g, '');
  
  const bSlug = new URLSearchParams(window.location.search).get('b') || 'default';

  // Usar UPSERT para insertar o actualizar en base al slug (requiere que slug sea UNIQUE en BD)
  // O en nuestro caso, actualizamos usando el ID si lo tenemos, si no, intentamos con el slug
  const updatePayload = {
        slogan,
        tiktok_url: tiktok,
        instagram_url: instagram,
        whatsapp_num: whatsapp,
        delivery_whatsapp_num: deliveryWhatsapp,
        facebook_url: facebook,
        location_url: location,
        open_time: openTime,
        close_time: closeTime
  };

  let errorData = null;

  if (restaurantData && restaurantData.id) {
    const { data: updatedData, error } = await window.supabaseClient
      .from('restaurants')
      .update(updatePayload)
      .eq('id', restaurantData.id)
      .select()
      .single();
      
    // Si error es PGRST116 (0 filas actualizadas), significa que RLS bloqueó el UPDATE silenciosamente
    errorData = error;
    if (error && error.code === 'PGRST116') {
      errorData = { message: "Violación RLS: Permiso denegado para actualizar (0 filas afectadas)" };
    } else if (updatedData) {
      restaurantData = updatedData;
    }
  } else {
    // Intenta insertarlo asignando el slug correspondiente
    const { data, error } = await window.supabaseClient
      .from('restaurants')
      .insert([{ ...updatePayload, slug: bSlug, name: 'Mi Nuevo Negocio' }])
      .select()
      .single();
      
    errorData = error;
    if (data) restaurantData = data;
  }

  if (errorData) {
    console.error("DEBUG SAVE SETTINGS ERROR:", errorData);
    alert("ERROR GUARDANDO AJUSTES EN BD:\nVerifica que la tabla 'restaurants' exista y tenga políticas de INSERT/UPDATE correctas en Supabase.\nDetalle: " + (errorData.message || JSON.stringify(errorData)));
    showNotification("Error", "No se pudo guardar en la nube", "error");
    return;
  }
  
  // Actualizar cache local
  if (restaurantData) {
     restaurantData = { ...restaurantData, ...updatePayload };
  }

  loadCustomSettings(); 
  showNotification("Éxito", "Configuración guardada en Supabase correctamente");
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

// switchAdminTab — función canónica está más abajo en el archivo (línea de TABS Y NAVEGACIÓN)


// ======================== LÓGICA DE PRODUCTOS ========================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const filtered = currentCategory === 'todos' ? products.filter(p => p.available) : products.filter(p => p.category === currentCategory && p.available);

  grid.innerHTML = filtered.map((p, i) => `
    <div class="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-md shadow-black/20 card-hover slide-in flex flex-col h-full" style="animation-delay: ${i * 50}ms">
      <div class="h-32 bg-gradient-to-br from-primary/5 to-zinc-900 flex items-center justify-center relative overflow-hidden flex-shrink-0">
        ${(p.image_url || p.image) ? `<img src="${p.image_url || p.image}" class="w-full h-full object-cover">` : getCategoryIcon(p.category)}
      </div>
      <div class="p-3 sm:p-4 flex flex-col flex-1">
        <span class="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">${p.category}</span>
        <h4 class="text-sm sm:text-lg font-bold text-white mt-1 font-display leading-tight line-clamp-1">${p.name}</h4>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed flex-1">${p.description}</p>
        <div class="flex items-center justify-between mt-3 sm:mt-5">
          <span class="text-sm sm:text-xl font-bold text-primary">S/. ${p.price.toFixed(2)}</span>
          <button onclick="handleAddToCart('${p.id}')" class="w-10 h-10 sm:w-12 sm:h-12 bg-primary hover:bg-primary-dark text-white rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-primary/20">
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
  const p = products.find(x => x.id == id);
  if (!p) return;
  currentProduct = p;

  const modal = document.getElementById('customizeModal');
  const customOptionsDiv = document.getElementById('customOptions');
  const co = p.customization_options || {};

  // Reset form and title
  document.getElementById('customizeForm').reset();
  document.getElementById('customizeTitle').textContent = `Personalizar ${p.name}`;

  // Render Salsas Dinámicas
  let saucesHtml = '';
  const sauces = co.sauces || [];
  if (sauces.length > 0) {
    saucesHtml = `
      <div id="saucesSection">
        <label class="block text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          Elige tus cremas
        </label>
        <div class="grid grid-cols-2 gap-2">
          ${sauces.map(s => `
            <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
              <input type="checkbox" name="sauce" value="${s}" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
              <span class="text-sm font-medium text-white">${s}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
  } else if (p.category !== 'bebidas') { 
    saucesHtml = `
      <div id="saucesSection">
        <label class="block text-sm font-bold text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          Elige tus cremas
        </label>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input type="checkbox" name="sauce" value="Ketchup" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
            <span class="text-sm font-medium text-white">Ketchup</span>
          </label>
          <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input type="checkbox" name="sauce" value="Mayonesa" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
            <span class="text-sm font-medium text-white">Mayonesa</span>
          </label>
          <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input type="checkbox" name="sauce" value="Mostaza" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
            <span class="text-sm font-medium text-white">Mostaza</span>
          </label>
          <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input type="checkbox" name="sauce" value="Aji" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
            <span class="text-sm font-medium text-white">Ají</span>
          </label>
        </div>
      </div>`;
  }

  // Render Extras Dinámicos
  let extrasHtml = '';
  const extras = co.extras || [];
  if (extras.length > 0) {
    extrasHtml = `
      <div id="extrasSection">
        <label class="block text-sm font-bold text-white mb-3">Acompañamientos / Extras</label>
        <div class="grid grid-cols-2 gap-2">
          ${extras.map(e => `
            <label class="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
              <input type="checkbox" name="extra" value="${e}" class="w-5 h-5 text-primary rounded bg-zinc-950 border-zinc-700 focus:ring-primary">
              <span class="text-sm font-medium text-white">${e}</span>
            </label>
          `).join('')}
        </div>
      </div>`;
  } else if (['hamburguesas', 'salchipapas'].includes(p.category)) { // Fallback for specific categories
    extrasHtml = `
      <div id="papaSection">
        <label class="block text-sm font-bold text-white mb-3">Papas</label>
        <div class="grid grid-cols-3 gap-2">
          <label class="cursor-pointer">
            <input type="radio" name="potato" value="Normales" checked class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-xs font-medium text-white">Normales</div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="potato" value="Al Hilo" class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-xs font-medium text-white">Al Hilo</div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="potato" value="Sin papas" class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-xs font-medium text-white">Sin papas</div>
          </label>
        </div>
      </div>
      <div id="saladSection">
        <label class="block text-sm font-bold text-white mb-3">Ensalada</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="cursor-pointer">
            <input type="radio" name="salad" value="Con ensalada" checked class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-sm font-medium text-white">Con ensalada</div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="salad" value="Sin ensalada" class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-sm font-medium text-white">Sin ensalada</div>
          </label>
        </div>
      </div>`;
  }

  // Notas
  let notesHtml = '';
  if (co.allowNotes !== false) {
    notesHtml = `
      <div>
        <label class="block text-sm font-bold text-white mb-3">Instrucciones Especiales</label>
        <textarea name="notes" rows="2" class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:border-primary outline-none transition-all resize-none" placeholder="Ej: Sin cebolla, carne bien cocida, etc."></textarea>
      </div>`;
  }

  // Caso Bebidas (Legacy fallback or specific)
  let tempHtml = '';
  if (p.category === 'bebidas') {
    tempHtml = `
      <div id="tempSection">
        <label class="block text-sm font-bold text-white mb-3">Temperatura</label>
        <div class="grid grid-cols-2 gap-2">
          <label class="cursor-pointer">
            <input type="radio" name="temp" value="Helada" checked class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-sm font-medium text-white">Helada</div>
          </label>
          <label class="cursor-pointer">
            <input type="radio" name="temp" value="Al Tiempo" class="peer sr-only">
            <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/10 text-center text-sm font-medium text-white">Al Tiempo</div>
          </label>
        </div>
      </div>`;
  }

  customOptionsDiv.innerHTML = `
    <div class="space-y-6">
      ${saucesHtml}
      ${extrasHtml}
      ${notesHtml}
      ${tempHtml}
    </div>
  `;

  document.getElementById('customizeModal').classList.remove('hidden');
  document.getElementById('customizeModal').classList.add('flex');
}

function closeCustomizeModal() {
  document.getElementById('customizeModal').classList.add('hidden');
  document.getElementById('customizeModal').classList.remove('flex');
}

function limitCheckboxes(checkbox, max) {
  const checkboxes = document.querySelectorAll(`input[name="${checkbox.name}"]:checked`);
  if (checkboxes.length > max) {
    checkbox.checked = false;
    showNotification("Límite", `Solo puedes elegir hasta ${max} opciones.`, "warning");
  }
}

function addToCartWithCustomization(e) {
  e.preventDefault();
  const p = currentProduct;
  if (!p) {
    showNotification("Error", "Producto no encontrado.", "error");
    return;
  }

  const fd = new FormData(e.target);
  const extras = {};

  // Recopilar salsas (checkboxes name="sauce")
  const selectedSauces = Array.from(fd.getAll('sauce'));
  if (selectedSauces.length > 0) extras.sauces = selectedSauces;

  // Recopilar extras (checkboxes name="extra")
  const selectedExtras = Array.from(fd.getAll('extra'));
  if (selectedExtras.length > 0) extras.extrasList = selectedExtras;

  // Recopilar otros campos
  if (fd.get('potato')) extras.potato = fd.get('potato');
  if (fd.get('salad')) extras.salad = fd.get('salad');
  if (fd.get('temp')) extras.temp = fd.get('temp');
  if (fd.get('notes')) extras.notes = fd.get('notes');

  cart.push({ ...p, quantity: 1, extras, cartId: Date.now() });
  updateCartUI();
  closeCustomizeModal();
  toggleCart(); 
  showNotification("Añadido", `${p.name} agregado al carrito`);
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
  const parts = [];
  if (extras.sauces && extras.sauces.length > 0) parts.push(extras.sauces.join(', '));
  if (extras.extrasList && extras.extrasList.length > 0) parts.push(extras.extrasList.join(', '));
  if (extras.potato) parts.push(`Papas: ${extras.potato}`);
  if (extras.salad) parts.push(extras.salad);
  if (extras.temp) parts.push(`Temp: ${extras.temp}`);
  if (extras.notes) parts.push(`*Nota:* ${extras.notes}`);
  return parts.join(' | ');
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

async function submitOrder(e) {
  e.preventDefault();
  
  if (cart.length === 0) {
    showNotification("Error", "El carrito está vacío.", "error");
    return;
  }

  showNotification("Procesando", "Enviando pedido...", "warning");

  const fd = new FormData(e.target);
  const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const isDelivery = fd.get('deliveryType') === 'delivery';
  const total = isDelivery ? subtotal + 2 : subtotal;

  let paymentImageUrl = null;
  const paymentProofFile = fd.get('paymentProof');
  if (paymentProofFile && paymentProofFile.name) {
    paymentImageUrl = await uploadImageToSupabase(paymentProofFile, 'orders', 'order_proofs');
  }

  const orderData = {
    restaurant_id: restaurantData ? restaurantData.id : null,
    customer_name: fd.get('customerName') || 'Cliente Local',
    customer_phone: fd.get('customerPhone') || '000000000',
    customer_address: fd.get('customerAddress') || 'Recojo en local',
    gps_coords: { lat: fd.get('lat') || null, lng: fd.get('lng') || null },
    items: [...cart],
    subtotal: subtotal,
    delivery_fee: isDelivery ? 2 : 0,
    total: total,
    payment_method: fd.get('paymentMethod'),
    payment_details: fd.get('cashAmount') || fd.get('paymentProof')?.name || 'N/A',
    payment_image_url: paymentImageUrl,
    order_type: fd.get('deliveryType') || 'pickup',
    status: 'pending'
  };

  // Guardar en Supabase si el restaurante existe en la DB
  if (restaurantData && restaurantData.id) {
    try {
      const { data, error } = await window.supabaseClient
        .from('orders')
        .insert([orderData])
        .select();
      
      if (error) throw error;
      
      const newOrder = data[0];
      
      // WhatsApp Message Automático (Cliente -> Negocio)
      const businessPhone = restaurantData?.whatsapp_num || localStorage.getItem(storageKey('su_custom_whatsapp')) || "999999999";
      const itemList = cart.map(i => `${i.quantity}x ${i.name}${i.extras ? ' (' + formatExtras(i.extras) + ')' : ''}`).join('\\n');
      const msg = encodeURIComponent(`¡Hola! Deseo realizar un pedido:\\n\\n*Pedido #${String(newOrder.id).substring(0,8)}*\\n${itemList}\\n\\n*Subtotal:* S/. ${subtotal.toFixed(2)}\\n*Delivery:* S/. ${orderData.delivery_fee.toFixed(2)}\\n*Total a pagar:* S/. ${newOrder.total.toFixed(2)}\\n\\n*Mis Datos:*\\nNombre: ${newOrder.customer_name}\\nTeléfono: ${newOrder.customer_phone}\\nDirección: ${newOrder.customer_address}\\nMétodo de pago: ${newOrder.payment_method}\\n\\nPor favor, confírmenme el pedido y avísenme cuando esté listo.`);
      window.open(`https://wa.me/51${businessPhone}?text=${msg}`, '_blank');
      
      showNotification("¡Éxito!", "Pedido creado y enviado a cocina.");
    } catch (err) {
      console.error("DEBUG ORDER ERROR DETAILED:", err);
      // Extraemos absolutamente todo lo que Supabase devuelva de error para leerlo claro.
      const errorMsg = `MSG: ${err.message}\nHINT: ${err.hint || 'N/A'}\nDETAILS: ${err.details || 'N/A'}\nCODE: ${err.code || 'N/A'}`;
      alert("ERROR DETALLADO DE SUPABASE AL CREAR PEDIDO:\n\n" + errorMsg);
      showNotification("Error", "No se pudo crear el pedido. Revisa el alert.", "error");
      return; 
    }
  } else {
    // Fallback local (si no hay restaurante de Supabase)
    const order = { ...orderData, id: 1000 + orders.length + 1, createdAt: new Date().toISOString() };
    orders.unshift(order);
    saveData();
    const businessPhone = localStorage.getItem(storageKey('su_custom_whatsapp')) || "999999999";
    const itemList = cart.map(i => `${i.quantity}x ${i.name}${i.extras ? ' (' + formatExtras(i.extras) + ')' : ''}`).join('\\n');
    const msg = encodeURIComponent(`¡Hola! Deseo realizar un pedido:\\n\\n*Pedido #${order.id}*\\n${itemList}\\n\\n*Total a pagar:* S/. ${order.total.toFixed(2)}\\n\\n*Mis Datos:*\\nNombre: ${order.customer_name}\\nTeléfono: ${order.customer_phone}\\nDirección: ${order.customer_address}\\nMétodo de pago: ${order.payment_method}\\n\\nPor favor, confírmenme el pedido y avísenme cuando esté listo.`);
    window.open(`https://wa.me/51${businessPhone}?text=${msg}`, '_blank');
  }

  // Limpieza y reinicio visual
  cart = [];
  updateCartUI();
  
  if (!restaurantData) {
    renderOrders();
    updateOrderCounts();
  }
  
  closeCheckoutModal();
  document.getElementById('successModal').classList.remove('hidden');
  document.getElementById('successModal').classList.add('flex');
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.add('hidden');
  document.getElementById('successModal').classList.remove('flex');
}

function showIncomingOrderModal(order) {
  const modal = document.getElementById('incomingOrderModal');
  const details = document.getElementById('incomingOrderDetails');
  const ringtone = document.getElementById('orderRingtone');
  
  if (modal && details) {
    const cName = order.customer_name || (order.customer && order.customer.name) || 'Cliente';
    details.innerHTML = `El cliente <strong>${cName}</strong> acaba de realizar el pedido <strong>#${String(order.id).substring(0,6)}</strong> por un total de <strong>S/. ${(order.total || 0).toFixed(2)}</strong>.`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    if (ringtone) {
      ringtone.currentTime = 0;
      ringtone.play().catch(e => console.warn("Auto-play blocked", e));
    }
  }
}

function closeIncomingOrderModal() {
  const modal = document.getElementById('incomingOrderModal');
  const ringtone = document.getElementById('orderRingtone');
  
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  
  if (ringtone) {
    ringtone.pause();
    ringtone.currentTime = 0;
  }
}

// ======================== PEDIDOS ADMIN ========================
function renderOrders() {
  const list = document.getElementById('ordersList');
  if (orders.length === 0) { list.innerHTML = `<div class="text-center py-10 text-zinc-300">No hay pedidos</div>`; return; }
  
  try {
    list.innerHTML = orders.map(o => {
      // Compatibilidad con Supabase y local
      const cName = o.customer_name || (o.customer && o.customer.name) || 'Cliente';
      const cPhone = o.customer_phone || (o.customer && o.customer.phone) || '';
      const cAddress = o.customer_address || (o.customer && o.customer.address) || '';
      const orderType = o.order_type || o.type || 'pickup';
      const payMethod = o.payment_method || o.paymentMethod || 'Efectivo';
      const orderItems = (typeof o.items === 'string') ? JSON.parse(o.items) : (o.items || []);
      
      return `
      <div class="bg-zinc-800 rounded-2xl border border-zinc-800 shadow-md shadow-black/20 overflow-hidden">
        <div class="p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-white px-2 py-0.5 rounded-full ${orderType === 'delivery' ? 'bg-primary-dark' : 'bg-success'}">${orderType === 'delivery' ? 'Delivery' : 'Recojo'}</span>
                <span class="text-[10px] text-zinc-400 font-medium">${formatDate(o.created_at || o.createdAt)}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-bold text-lg text-primary">#${String(o.id).substring(0, 8)}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium status-${o.status}">${getStatusText(o.status)}</span>
              </div>
            </div>
            <div class="flex flex-col items-end">
              <p class="font-bold text-lg">S/. ${(o.total || 0).toFixed(2)}</p>
              <div class="flex items-center gap-2">
                <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">${payMethod}</p>
                ${o.payment_image_url ? `
                  <button onclick="window.open('${o.payment_image_url}', '_blank')" class="p-1.5 bg-zinc-950 rounded-lg border border-zinc-700 hover:border-primary transition-all group" title="Ver Comprobante">
                    <svg class="w-4 h-4 text-zinc-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="text-sm mb-2"><p class="font-medium">${cName}</p><p class="text-zinc-300 text-xs">${cAddress}</p></div>
          <div class="flex flex-wrap gap-1 mb-3">${orderItems.map(i => `<span class="bg-zinc-950 text-xs px-2 py-1 rounded border border-zinc-700/50">${i.quantity}x ${i.name}${i.extras ? ' (' + formatExtras(i.extras) + ')' : ''}</span>`).join('')}</div>
          <div class="flex gap-2 border-t border-zinc-700 pt-3 mt-2">
            ${o.status === 'pending' ? `<button onclick="updateOrderStatus('${o.id}', 'preparing')" class="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold shadow shadow-primary/20">Preparar</button>
                                       <a href="https://wa.me/51${cPhone}?text=${encodeURIComponent('¡Hola ' + cName + '! Hemos recibido tu pedido #' + String(o.id).substring(0,6) + ' en PideClick. En breve lo estaremos preparando para ti.')}" target="_blank" class="flex-1 bg-[#25D366] text-white py-2 rounded-lg text-sm text-center shadow flex items-center justify-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg> Avisar</a>` : ''}
            ${o.status === 'preparing' ? `<button onclick="updateOrderStatus('${o.id}', 'ready')" class="flex-1 bg-success text-white py-2 rounded-lg text-sm shadow">Listo</button>` : ''}
            ${o.status === 'ready' ? `<button onclick="openDispatchModal('${o.id}')" class="flex-1 bg-primary text-white py-2 rounded-lg text-sm shadow shadow-primary/20">Despachar</button>
                                      <a href="https://wa.me/51${cPhone}?text=${encodeURIComponent('Tu pedido #'+String(o.id).substring(0,6)+' esta listo!')}" target="_blank" class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm text-center shadow flex items-center justify-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg> Avisar</a>` : ''}
          </div>
        </div>
      </div>`
    }).join('');
  } catch (e) {
    console.error("Error renderizando pedidos:", e);
    list.innerHTML = `<div class="p-4 text-red-500 bg-red-500/10 rounded-xl text-center">Error cargando formato de pedidos. Ver consola de desarrollo.</div>`;
  }
}

function getStatusText(s) { return { pending: 'Pendiente', preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado' }[s] || s; }

async function updateOrderStatus(id, status) {
  try {
    const { error } = await window.supabaseClient
      .from('orders')
      .update({ status: status })
      .eq('id', id);

    if (error) throw error;

    const o = orders.find(x => String(x.id) === String(id));
    if (o) { 
      o.status = status; 
      renderOrders(); 
      updateOrderCounts();
      updateDashboardStats(); // Actualizar dashboard al cambiar estados
    }
    if (status === 'delivered') closeDispatchModal();
    showNotification("Éxito", `Pedido marcado como ${getStatusText(status)}`);
  } catch (err) {
    console.error("Error updating order:", err);
    showNotification("Error", "No se pudo actualizar el pedido en la nube", "error");
  }
}

function updateOrderCounts() {
  document.getElementById('pendingCount').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('preparingCount').textContent = orders.filter(o => o.status === 'preparing').length;
  document.getElementById('readyCount').textContent = orders.filter(o => o.status === 'ready').length;
}

function openDispatchModal(id) {
  currentDispatchOrderId = id;
  const o = orders.find(x => String(x.id) === String(id));
  if (!o) return;

  const cName = o.customer_name || (o.customer && o.customer.name) || 'Cliente';
  const cPhone = o.customer_phone || (o.customer && o.customer.phone) || '';
  const cAddress = o.customer_address || (o.customer && o.customer.address) || '';
  const lat = (o.gps_coords && o.gps_coords.lat) || (o.customer && o.customer.lat);
  const lng = (o.gps_coords && o.gps_coords.lng) || (o.customer && o.customer.lng);
  
  const mapsLink = lat ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cAddress)}`;
  
  const orderItems = (typeof o.items === 'string') ? JSON.parse(o.items) : (o.items || []);
  const itemsText = orderItems.map(i => `${i.quantity}x ${i.name}${i.extras ? ' (' + formatExtras(i.extras) + ')' : ''}`).join(', ');
  
  document.getElementById('dispatchContent').innerHTML = `
    <div class="bg-zinc-950 rounded-xl p-4 space-y-2 text-sm">
      <div class="flex justify-between items-start">
        <p><strong>Cliente:</strong> ${cName}</p>
        <span class="text-[10px] text-zinc-500">${formatDate(o.created_at || o.createdAt || new Date().toISOString())}</span>
      </div>
      <p><strong>Telf:</strong> ${cPhone}</p><p><strong>Dir:</strong> ${cAddress}</p>
      <a href="${mapsLink}" target="_blank" class="text-primary underline block">Ver en Maps</a><hr class="my-2">
      <p><strong>Pedido:</strong> ${itemsText}</p>
      <div class="flex justify-between items-end">
        ${o.payment_image_url ? `
          <div class="mt-2">
            <p class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Comprobante:</p>
            <img src="${o.payment_image_url}" class="h-32 rounded-lg border border-zinc-700 shadow-sm cursor-zoom-in" onclick="window.open('${o.payment_image_url}', '_blank')">
          </div>
        ` : '<div></div>'}
        <p class="text-lg font-bold">Total: S/. ${(o.total || 0).toFixed(2)}</p>
      </div>
    </div>`;
  const waMsg = encodeURIComponent(`*Pedido #${String(o.id).substring(0,8)}*\\nCliente: ${cName}\\nDir: ${cAddress}\\nMaps: ${mapsLink}\\nTotal: S/. ${(o.total||0).toFixed(2)}`);
  const deliveryNum = restaurantData?.delivery_whatsapp_num || localStorage.getItem(storageKey('su_custom_delivery_whatsapp')) || "999999999";
  document.getElementById('whatsappDeliveryLink').href = `https://wa.me/51${deliveryNum}?text=${waMsg}`;
  document.getElementById('printArea').innerHTML = `<div style="font-family: monospace; width: 100%;"><h2 style="text-align:center;">PIDECLICK</h2><p style="text-align:center; font-size:10px;">${formatDate(o.created_at || o.createdAt || new Date().toISOString())}</p><hr><p>Pedido: #${String(o.id).substring(0,8)}</p><p>Cliente: ${cName}</p><p>Dir: ${cAddress}</p><p>Telf: ${cPhone}</p><hr>${orderItems.map(i => `<p>${i.quantity}x ${i.name}${i.extras ? '<br><small style="font-size:10px; color:#555;">' + formatExtras(i.extras) + '</small>' : ''} - S/.${(i.price*i.quantity).toFixed(2)}</p>`).join('')}<hr><p><strong>TOTAL: S/. ${(o.total||0).toFixed(2)}</strong></p></div>`;
  document.getElementById('dispatchModal').classList.remove('hidden');
  document.getElementById('dispatchModal').classList.add('flex');
}

function closeDispatchModal() { document.getElementById('dispatchModal').classList.add('hidden'); document.getElementById('dispatchModal').classList.remove('flex'); }

// ======================== TABS Y NAVEGACIÓN ========================
function switchAdminTab(tab) {
  currentAdminTab = tab;

  // Mapear nombres de tabs a IDs reales de paneles en el HTML
  const panelMap = {
    pedidos: 'ordersPanel',
    productos: 'productsPanel',
    dashboard: 'dashboardPanel',
    clientes: 'clientesPanel',
    configuracion: 'configuracionPanel'
  };

  // Ocultar todos los paneles
  Object.values(panelMap).forEach(panelId => {
    const el = document.getElementById(panelId);
    if (el) { el.classList.add('hidden'); el.classList.remove('fade-in'); }
  });
  
  // Reiniciar estilos de botones
  ['tabDashboard', 'tabPedidos', 'tabProductos', 'tabClientes', 'tabConfiguracion'].forEach(t => {
    const btn = document.getElementById(t);
    if (!btn) return;
    btn.classList.remove('text-primary', 'border-b-2', 'border-primary');
    btn.classList.add('text-zinc-300');
  });

  // Mostrar panel seleccionado (usando el mapa correcto)
  const activePanelId = panelMap[tab];
  const activePanel = activePanelId ? document.getElementById(activePanelId) : null;
  if (activePanel) {
    activePanel.classList.remove('hidden');
    setTimeout(() => activePanel.classList.add('fade-in'), 10);
  }
  
  // Activar botón del tab
  const activeBtn = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-zinc-300');
    activeBtn.classList.add('text-primary', 'border-b-2', 'border-primary');
  }
  
  // Renderizar contenido del panel seleccionado
  if (tab === 'pedidos') renderOrders();
  if (tab === 'dashboard') updateDashboardStats();
  if (tab === 'productos') renderAdminProducts();
  if (tab === 'clientes') renderAdminClientes();
}

// ======================== CLIENTES ADMIN ========================
function renderAdminClientes() {
  const list = document.getElementById('adminClientesList');
  if (!list) return;
  
  const customersMap = {};
  
  orders.forEach(o => {
    const cPhone = o.customer_phone || (o.customer && o.customer.phone) || '';
    if (!cPhone) return;
    
    const cName = o.customer_name || (o.customer && o.customer.name) || 'Cliente Anónimo';
    const cAddress = o.customer_address || (o.customer && o.customer.address) || 'Sin dirección';
    
    if (!customersMap[cPhone]) {
      customersMap[cPhone] = {
        phone: cPhone,
        name: cName,
        address: cAddress,
        orderCount: 0,
        totalSpent: 0,
        lastOrder: o.created_at || o.createdAt || new Date().toISOString()
      };
    }
    
    customersMap[cPhone].orderCount += 1;
    customersMap[cPhone].totalSpent += (o.total || 0);
    
    if (new Date(o.created_at || o.createdAt || new Date()) > new Date(customersMap[cPhone].lastOrder)) {
      customersMap[cPhone].lastOrder = o.created_at || o.createdAt;
      customersMap[cPhone].name = cName;
      customersMap[cPhone].address = cAddress;
    }
  });

  const uniqueCustomers = Object.values(customersMap).sort((a, b) => b.totalSpent - a.totalSpent);
  
  if (uniqueCustomers.length === 0) {
    list.innerHTML = `<div class="col-span-full text-center py-10 text-zinc-400">Aún no hay clientes registrados.</div>`;
    return;
  }
  
  list.innerHTML = uniqueCustomers.map(c => `
    <div class="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 shadow-md shadow-black/20 hover:border-primary/50 transition-colors">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h4 class="font-bold text-white text-lg">${c.name}</h4>
          <p class="text-zinc-400 text-sm mt-1">${c.phone}</p>
        </div>
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
          ${c.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <p class="text-zinc-500 text-xs mb-4 line-clamp-1" title="${c.address}">${c.address}</p>
      
      <div class="flex items-center justify-between pt-3 border-t border-zinc-700/50">
        <div>
          <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Pedidos</p>
          <p class="text-white font-medium text-lg">${c.orderCount}</p>
        </div>
        <div class="text-right">
          <p class="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Acumulado</p>
          <p class="text-emerald-400 font-bold text-lg">S/. ${c.totalSpent.toFixed(2)}</p>
        </div>
      </div>
      <a href="https://wa.me/51${c.phone.replace(/\\D/g,'')}?text=${encodeURIComponent('Hola ' + c.name + ', somos de PideClick. ¡Aprovecha la promo especial para ti!')}" target="_blank" class="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-xl hover:text-white hover:border-success hover:bg-success/10 transition-all text-sm font-medium">
        <svg class="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        Promoción WhatsApp
      </a>
    </div>
  `).join('');
}

// ======================== PRODUCTOS ADMIN ========================

function renderAdminProducts() {
  const grid = document.getElementById('adminProductsGrid');
  try {
    grid.innerHTML = products.map(p => `
      <div class="bg-zinc-800 rounded-2xl border ${!p.available ? 'border-red-500/50 opacity-75' : 'border-zinc-700'} overflow-hidden">
        <div class="h-32 bg-zinc-950 flex items-center justify-center relative">
          ${(p.image_url || p.image) ? `<img src="${p.image_url || p.image}" class="w-full h-full object-cover">` : getCategoryIcon(p.category)}
          ${!p.available ? `<span class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Agotado</span>` : ''}
        </div>
        <div class="p-3">
          <h4 class="font-bold text-white text-sm line-clamp-1">${p.name || 'Sin Nombre'}</h4>
          <p class="text-primary font-bold text-sm">S/. ${(p.price || 0).toFixed(2)}</p>
          <div class="flex gap-2 mt-2">
            <button onclick="editProduct('${p.id}')" class="flex-1 py-1.5 border border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary/10 transition-colors">Editar</button>
            <button onclick="deleteProduct('${p.id}')" class="px-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>`).join('');
  } catch (error) {
    console.error("DEBUG ERROR EN RENDER DE PRODUCTOS ADMIN:", error);
    grid.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-2xl col-span-full text-center">Error al mostrar productos. Verifica los datos en Supabase.</div>`;
  }
}


function openProductModal(id = null) {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const preview = document.getElementById('productPreviewImg');
  form.reset(); preview.classList.add('hidden'); document.getElementById('productId').value = '';
  if (id) {
    const p = products.find(x => x.id == id);
    if (p) {
      document.getElementById('productFormTitle').innerText = 'Editar Producto';
      document.getElementById('productId').value = p.id;
      document.getElementById('productName').value = p.name;
      document.getElementById('productCategory').value = p.category;
      document.getElementById('productPrice').value = p.price;
      document.getElementById('productDescription').value = p.description || '';
      document.getElementById('productAvailable').checked = p.available !== false;
      
      const co = p.customization_options || {};
      document.getElementById('customSauces').value = (co.sauces || []).join(', ');
      document.getElementById('customExtras').value = (co.extras || []).join(', ');
      document.getElementById('allowCustomerNotes').checked = co.allowNotes !== false;

      const imgToShow = p.image_url || p.image;
      if (imgToShow) { 
        preview.src = imgToShow; 
        preview.classList.remove('hidden'); 
      }
    }
  } else {
    document.getElementById('productFormTitle').innerText = 'Nuevo Producto';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('customSauces').value = '';
    document.getElementById('customExtras').value = '';
    document.getElementById('allowCustomerNotes').checked = true;
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

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const name = document.getElementById('productName').value;
  const category = document.getElementById('productCategory').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const description = document.getElementById('productDescription').value;
  const available = document.getElementById('productAvailable').checked;
  const imageInput = document.getElementById('productImageInput');

  if (!name || isNaN(price)) { 
    showNotification("Atención", "Por favor completa los campos correctamente", "warning"); 
    return; 
  }

  showNotification("Guardando", "Procesando producto...", "warning");

  let imageUrl = null;
  // Subida de imagen a la nube
  if (imageInput.files && imageInput.files[0]) {
    imageUrl = await uploadImageToSupabase(imageInput.files[0], 'products');
    if (!imageUrl) return; // Se aborta si la subida falló (la notificación ya la lanza el helper)
  } else {
    const existing = products.find(p => p.id == id);
    imageUrl = existing ? (existing.image_url || existing.image) : '';
  }

  const customization = {
    sauces: document.getElementById('customSauces').value.split(',').map(s => s.trim()).filter(s => s !== ""),
    extras: document.getElementById('customExtras').value.split(',').map(e => e.trim()).filter(e => e !== ""),
    allowNotes: document.getElementById('allowCustomerNotes').checked
  };

  const productData = {
    restaurant_id: restaurantData.id,
    name,
    category,
    price,
    description,
    available,
    image_url: imageUrl,
    customization_options: customization
  };

  if (id) productData.id = id;

  try {
    const { data, error } = await window.supabaseClient
      .from('products')
      .upsert([productData])
      .select();

    if (error) throw error;

    // Forzar actualización total desde la nube para evitar bugs de caché
    const refreshedProducts = await fetchProductsFromSupabase(restaurantData.id);
    if (refreshedProducts) {
      products = refreshedProducts;
    }

    renderProducts(); 
    renderAdminProducts();
    updatePlanUI(); 
    closeProductModal(); 
    showNotification("Éxito", "Producto guardado y actualizado en el panel");
  } catch (err) {
    console.error("Error guardando producto:", err);
    showNotification("Error", "No se pudo guardar el producto en la nube", "error");
  }
}

function editProduct(id) { openProductModal(id); }

async function deleteProduct(id) {
  if (!confirm('¿Estás seguro de eliminar este producto?')) return;

  // Manejo de UUID/Strings con comparador laxo
  try {
    const { error } = await window.supabaseClient
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    products = products.filter(p => p.id != id);
    renderProducts();
    renderAdminProducts();
    showNotification("Éxito", "Producto eliminado");
  } catch (err) {
    console.error("Error eliminando producto:", err);
    showNotification("Error", "No se pudo eliminar de la nube", "error");
  }
}

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
  const openTime = restaurantData?.open_time || localStorage.getItem(storageKey('su_custom_open_time')) || "08:00";
  const closeTime = restaurantData?.close_time || localStorage.getItem(storageKey('su_custom_close_time')) || "23:00";
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [openHours, openMins] = openTime.split(':').map(Number);
  const [closeHours, closeMins] = closeTime.split(':').map(Number);
  
  const openTotalMins = openHours * 60 + openMins;
  const closeTotalMins = closeHours * 60 + closeMins;
  
  // Si la hora de cierre es menor o igual a la de apertura (ej. abre 18:00, cierra 02:00 AM)
  if (closeTotalMins <= openTotalMins) {
    return currentMinutes >= openTotalMins || currentMinutes < closeTotalMins;
  }
  
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

async function loginAdmin(e) {
  e.preventDefault();
  // Limpiamos espacios en blanco al inicio y final
  const email = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();

  if (!email || !password) {
    showNotification("Error", "Por favor completa todos los campos", "error");
    return;
  }

  showNotification("Iniciando Sesión", "Conectando con Supabase...", "warning");

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    isAdminAuthenticated = true;
    closeLoginModal();
    
    // Recargar datos y entrar al dashboard
    if (restaurantData) {
       const { data: dbOrders } = await window.supabaseClient
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .order('created_at', { ascending: false });
      
      if (dbOrders) orders = dbOrders;
      setupRealtimeOrders(restaurantData.id);
      updateDashboardStats();
    }

    switchView('admin');
    renderOrders();
    updateOrderCounts();
    showNotification("Bienvenido", "Sesión iniciada correctamente");
  } catch (err) {
    console.error("DEBUG LOGIN ERROR:", err);
    
    let msg = err.message || "Error desconocido";
    
    // Traducciones amigables
    if (msg.includes("Invalid login credentials")) {
      msg = "Email o contraseña incorrectos. Verifica que no haya mayúsculas de más.";
    } else if (msg.includes("Email not confirmed")) {
      msg = "Debes confirmar tu correo en el panel de Supabase (Authentication > Users > Confirm).";
    }

    // Alerta técnica para depuración
    alert("DETALLE TÉCNICO DEL ERROR:\n" + msg);
    
    showNotification("Error de Acceso", msg, "error");
  }
}

async function logoutAdmin() {
  await window.supabaseClient.auth.signOut();
  isAdminAuthenticated = false;
  switchView('cliente');
  showNotification("Sesión Cerrada", "Has salido del panel de administración");
}
