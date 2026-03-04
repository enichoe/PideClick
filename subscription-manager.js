console.log("DEBUG: subscription-manager.js loading...");
/**
 * SUBSCRIPTION MANAGER
 * Gestiona los planes y límites de cada negocio (tenant).
 */

const PLANS = {
  SENCILLITO: {
    id: 'sencillito',
    name: 'Plan Sencillito',
    maxProducts: 10,
    features: {
      customBranding: false,
      advancedAnalytics: false,
      customerManagement: false,
      whatsappFollowup: true,
      removablePideClickBadge: false
    }
  },
  PUNCHE: {
    id: 'punche',
    name: 'Plan Punche',
    maxProducts: 999,
    features: {
      customBranding: false,
      advancedAnalytics: false,
      customerManagement: true,
      whatsappFollowup: true,
      removablePideClickBadge: false
    }
  },
  PODEROSO: {
    id: 'poderoso',
    name: 'Plan Poderoso',
    maxProducts: 999,
    features: {
      customBranding: true,
      advancedAnalytics: true,
      customerManagement: true,
      whatsappFollowup: true,
      removablePideClickBadge: true
    }
  }
};


// Cache para evitar peticiones excesivas
let cachedSubscription = null;
let activeTenantId = null;

async function getTenantSubscription() {
  // Intentar obtener activeTenantId si no se ha registrado explícitamente
  if (!activeTenantId) {
    const params = new URLSearchParams(window.location.search);
    activeTenantId = params.get('b');
  }

  if (!activeTenantId || activeTenantId === 'default') return { planId: 'sencillito', expires: null };
  if (cachedSubscription && cachedSubscription.tenantId === activeTenantId) return cachedSubscription;

  try {
    const { data: tenant, error: tError } = await window.supabaseClient
      .from('tenants')
      .select('id, slug')
      .eq('slug', activeTenantId)
      .single();

    if (tError) {
       if (tError.code === 'PGRST116') return { planId: 'sencillito', expires: null };
       throw tError;
    }

    const { data: sub, error: sError } = await window.supabaseClient
      .from('subscriptions')
      .select('plan_id, status, expires_at')
      .eq('tenant_id', tenant.id)
      .single();

        if (sError && sError.code !== 'PGRST116') throw sError;

    const subData = sub || { plan_id: 'sencillito' };
    cachedSubscription = { planId: subData.plan_id, tenantId: activeTenantId, expires: subData.expires_at };
    return cachedSubscription;
  } catch (err) {
    console.warn("Error cargando suscripción de Supabase, usando fallback.", err);
    return { planId: 'sencillito', expires: null };
  }
}

async function hasFeature(featureName) {
  const currentSub = await getTenantSubscription();
  const plan = PLANS[currentSub.planId.toUpperCase()] || PLANS.SENCILLITO;
  return plan.features[featureName] || false;
}

/**
 * Obtiene los límites del plan actual.
 */
async function getPlanLimits() {
  const currentSub = await getTenantSubscription();
  return PLANS[currentSub.planId.toUpperCase()] || PLANS.SENCILLITO;
}

// Registro y gestión global de negocios (Para Super Admin)

/**
 * Registra un negocio en la lista global de Supabase.
 */
async function registerTenant(id) {
  if (!id || id === 'default') return;
  activeTenantId = id; // Guardar globalmente
  
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const userEmail = session?.user?.email;

    // Primero verificamos si ya existe
    const { data: existing } = await window.supabaseClient
      .from('tenants')
      .select('slug, owner_email')
      .eq('slug', id)
      .single();

    if (!existing) {
      const { error } = await window.supabaseClient
        .from('tenants')
        .upsert([{ 
          slug: id, 
          name: `Negocio ${id}`,
          owner_email: userEmail || null 
        }], { onConflict: 'slug' });
      
      if (error) console.warn("Error registrando tenant en Supabase:", error);
    } else if (!existing.owner_email && userEmail) {
      // Si existe pero no tiene dueño, y tenemos un usuario logueado, lo asignamos
      await window.supabaseClient
        .from('tenants')
        .update({ owner_email: userEmail })
        .eq('slug', id);
    }
  } catch (e) {
    console.error("RegisterTenant Error:", e);
  }
}

/**
 * Obtiene todos los negocios registrados desde Supabase.
 */
async function getAllTenants() {
  try {
    const { data, error } = await window.supabaseClient
      .from('tenants')
      .select('*, subscriptions(plan_id, updated_at)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error obteniendo todos los tenants:", err);
    return [];
  }
}

/**
 * Actualiza el plan de un negocio en Supabase.
 */
async function updateTenantPlan(tenantIdInternal, planId) {
  try {
    const { error } = await window.supabaseClient
      .from('subscriptions')
      .upsert([{ 
        tenant_id: tenantIdInternal, 
        plan_id: planId, 
        updated_at: new Date().toISOString() 
      }], { onConflict: 'tenant_id' });
    
    if (error) throw error;
    cachedSubscription = null; // Limpiar cache
  } catch (err) {
    console.error("Error actualizando plan del tenant:", err);
    alert(`Error al actualizar plan en Supabase: ${err.message || 'Error desconocido'}\n\nVerifica que tengas permisos de administrador.`);
  }
}

// Exportar funciones (en este entorno frontend simple, las dejamos globales)
window.SaaS = {
  hasFeature,
  getPlanLimits,
  getTenantSubscription,
  registerTenant,
  getAllTenants,
  updateTenantPlan,
  PLANS
};
