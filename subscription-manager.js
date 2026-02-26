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

/**
 * Obtiene el plan actual del negocio.
 * En esta fase manual, lo guardamos en localStorage con prefijo global (su_subscription_[tenantId]).
 */
function getTenantSubscription() {
  const defaultSub = { planId: 'essential', expires: null };
  // Usamos una clave global (su_global_sub_) para que no se mezcle con los datos del propio tenant
  const subData = localStorage.getItem(`su_global_sub_${tenantId}`);
  return subData ? JSON.parse(subData) : defaultSub;
}

/**
 * Verifica si el negocio tiene una función específica disponible.
 */
function hasFeature(featureName) {
  const currentSub = getTenantSubscription();
  const plan = PLANS[currentSub.planId.toUpperCase()] || PLANS.ESSENTIAL;
  return plan.features[featureName] || false;
}

/**
 * Obtiene los límites del plan actual.
 */
function getPlanLimits() {
  const currentSub = getTenantSubscription();
  return PLANS[currentSub.planId.toUpperCase()] || PLANS.ESSENTIAL;
}

// Registro y gestión global de negocios (Para Super Admin)

/**
 * Registra un negocio en la lista global si no existe.
 */
function registerTenant(id) {
  if (!id || id === 'default') return;
  let tenants = JSON.parse(localStorage.getItem('su_global_tenants') || '[]');
  if (!tenants.includes(id)) {
    tenants.push(id);
    localStorage.setItem('su_global_tenants', JSON.stringify(tenants));
  }
}

/**
 * Obtiene todos los negocios registrados.
 */
function getAllTenants() {
  return JSON.parse(localStorage.getItem('su_global_tenants') || '[]');
}

/**
 * Actualiza el plan de un negocio de forma global.
 */
function updateTenantPlan(id, planId) {
  const subData = { planId: planId, updatedAt: new Date().toISOString() };
  localStorage.setItem(`su_global_sub_${id}`, JSON.stringify(subData));
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
