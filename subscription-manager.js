/**
 * SUBSCRIPTION MANAGER
 * Gestiona los planes y límites de cada negocio (tenant).
 */

const PLANS = {
  ESSENTIAL: {
    id: 'essential',
    name: 'Plan Esencial',
    maxProducts: 10,
    features: {
      customBranding: false,
      advancedAnalytics: false,
      whatsappFollowup: true,
      removablePideClickBadge: false
    }
  },
  PRO: {
    id: 'pro',
    name: 'Plan Pro',
    maxProducts: 999,
    features: {
      customBranding: true,
      advancedAnalytics: true,
      whatsappFollowup: true,
      removablePideClickBadge: true
    }
  }
};


// Cache para evitar peticiones excesivas
let cachedSubscription = null;

/**
 * Obtiene el plan actual del negocio desde Supabase.
 */
async function getTenantSubscription() {
  if (cachedSubscription && cachedSubscription.tenantId === tenantId) return cachedSubscription;

  try {
    const { data: tenant, error: tError } = await window.supabaseClient
      .from('tenants')
      .select('id, slug')
      .eq('slug', tenantId)
      .single();

    if (tError) throw tError;

    const { data: sub, error: sError } = await window.supabaseClient
      .from('subscriptions')
      .select('plan_id, status, expires_at')
      .eq('tenant_id', tenant.id)
      .single();

    if (sError && sError.code !== 'PGRST116') throw sError;

    const subData = sub || { plan_id: 'essential' };
    cachedSubscription = { planId: subData.plan_id, tenantId: tenantId, expires: subData.expires_at };
    return cachedSubscription;
  } catch (err) {
    console.warn("Error cargando suscripción de Supabase, usando fallback esencial.", err);
    return { planId: 'essential', expires: null };
  }
}

/**
 * Verifica si el negocio tiene una función específica disponible.
 */
async function hasFeature(featureName) {
  const currentSub = await getTenantSubscription();
  const plan = PLANS[currentSub.planId.toUpperCase()] || PLANS.ESSENTIAL;
  return plan.features[featureName] || false;
}

/**
 * Obtiene los límites del plan actual.
 */
async function getPlanLimits() {
  const currentSub = await getTenantSubscription();
  return PLANS[currentSub.planId.toUpperCase()] || PLANS.ESSENTIAL;
}

// Registro y gestión global de negocios (Para Super Admin)

/**
 * Registra un negocio en la lista global de Supabase.
 */
async function registerTenant(id) {
  if (!id || id === 'default') return;
  
  try {
    const { error } = await window.supabaseClient
      .from('tenants')
      .upsert([{ slug: id, name: id }], { onConflict: 'slug' });
    
    if (error) console.warn("Error registrando tenant en Supabase:", error);
  } catch (e) {
    console.error(e);
  }
}

/**
 * Obtiene todos los negocios registrados desde Supabase.
 */
async function getAllTenants() {
  try {
    const { data, error } = await window.supabaseClient
      .from('tenants')
      .select('*, subscriptions(plan_id, updated_at)');
    
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
    alert("Error al actualizar plan en Supabase");
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
