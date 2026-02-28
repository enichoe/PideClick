/**
 * PideClick SalesBot — Chatbot de ventas ultra persuasivo
 * Vendedor automático 24/7 para la landing page de PideClick
 */

(function () {
  'use strict';

  // ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
  const CONFIG = {
    botName: 'Nico',
    botAvatar: '🤖',
    whatsappNumber: '51987654321',
    greeting_delay: 800,
    typing_delay_base: 600,
    typing_delay_per_char: 18,
    colors: { primary: '#F97316', bg: '#09090B', surface: '#18181B', border: '#27272A' }
  };

  // ── ÁRBOL DE CONVERSACIÓN ──────────────────────────────────────────────────
  const FLOWS = {

    // INICIO
    start: {
      messages: [
        '¡Hola! 👋 Soy Nico, tu asesor digital de **PideClick**.',
        '¿Tienes un restaurante o negocio gastronómico? 🍽️'
      ],
      options: [
        { label: '🍔 Sí, tengo un restaurante', next: 'has_restaurant' },
        { label: '🚀 Estoy por abrir uno', next: 'opening_soon' },
        { label: '💼 Quiero revender el servicio', next: 'reseller' },
        { label: '🤔 Solo estoy mirando', next: 'just_looking' }
      ]
    },

    // FLUJO: TIENE RESTAURANTE
    has_restaurant: {
      messages: ['¡Perfecto! 🔥 Vamos al punto.'],
      options: [
        { label: '📲 Recibo pedidos por WhatsApp (es un caos)', next: 'pain_whatsapp_chaos' },
        { label: '💸 Apps como Rappi me cobran mucho', next: 'pain_high_commissions' },
        { label: '📵 No tengo menú digital', next: 'pain_no_menu' },
        { label: '📈 Quiero vender más', next: 'pain_more_sales' }
      ]
    },

    // DOLOR 1: Caos en WhatsApp
    pain_whatsapp_chaos: {
      messages: [
        '¡Ese es el problema #1 de los restaurantes! 😤',
        'Con PideClick tus clientes hacen el pedido ellos mismos desde su celular — tú recibes el orden perfectamente detallado por WhatsApp. **Sin errores. Sin malentendidos.**',
        '¿Cuántos pedidos diarios manejas aprox?'
      ],
      options: [
        { label: '📦 1–10 pedidos/día', next: 'show_essential' },
        { label: '📦📦 10–30 pedidos/día', next: 'show_pro' },
        { label: '📦📦📦 +30 pedidos/día', next: 'show_pro_urgent' }
      ]
    },

    // DOLOR 2: Comisiones altas
    pain_high_commissions: {
      messages: [
        '¡Eso duele en el bolsillo! 💸',
        'Rappi y similares se quedan con el **25–35%** de cada venta. Si vendes S/. 5,000 al mes, les regalas hasta **S/. 1,750**.',
        'Con PideClick pagas una cuota fija pequeña y te quedas con el **100%** de tus ventas. ¿Quieres ver los números?'
      ],
      options: [
        { label: '💰 Sí, quiero ver cuánto ahorro', next: 'savings_calc' },
        { label: '🚀 ¡Quiero empezar ya!', next: 'capture_lead' }
      ]
    },

    // DOLOR 3: Sin menú digital
    pain_no_menu: {
      messages: [
        'Sin menú digital estás dejando ventas sobre la mesa 📉',
        'PideClick te da un menú **profesional con fotos, categorías y precios** — listo en minutos. Tus clientes lo ven desde cualquier celular, sin instalar nada.',
        '¿El mejor dato? **El Plan Esencial es GRATIS.** 🤩'
      ],
      options: [
        { label: '🆓 ¿Qué incluye el plan gratis?', next: 'show_essential' },
        { label: '⚡ Ver plan completo', next: 'show_pro' },
        { label: '🎯 Quiero probarlo ahora', next: 'capture_lead' }
      ]
    },

    // DOLOR 4: Más ventas
    pain_more_sales: {
      messages: [
        'Me gusta esa mentalidad 🎯',
        'Los restaurantes que implementan PideClick típicamente ven un **aumento del 30–40%** en pedidos en el primer mes.',
        '¿Por qué? Porque el carta digital hace que los clientes compren más fácil, más rápido y vuelvan más seguido.'
      ],
      options: [
        { label: '📊 ¿Cómo funciona exactamente?', next: 'how_it_works' },
        { label: '💬 Hablar con un asesor', next: 'whatsapp_cta' },
        { label: '🆓 Probar gratis', next: 'capture_lead' }
      ]
    },

    // CÁLCULO DE AHORRO
    savings_calc: {
      messages: [
        '💡 **Ejemplo real:**',
        '📌 Ventas mensuales: **S/. 5,000**\n🔺 Comisión Rappi (30%): **– S/. 1,500**\n✅ Con PideClick PRO: **– S/. 30**\n\n**Ahorro mensual: S/. 1,470** 🤑',
        'Ese dinero es tuyo para reinvertir, pagar personal o ahorrarlo.'
      ],
      options: [
        { label: '🚀 ¡Quiero activar PideClick!', next: 'capture_lead' },
        { label: '💬 Tengo preguntas', next: 'objections' }
      ]
    },

    // CÓMO FUNCIONA
    how_it_works: {
      messages: [
        '¡Es súper simple en 3 pasos! ⚡',
        '1️⃣ **Crea tu URL**: elige el nombre de tu negocio\n2️⃣ **Sube tu menú**: fotos, precios, categorías\n3️⃣ **Comparte el link**: por redes, WhatsApp o QR',
        'Tus clientes hacen el pedido y tú lo recibes directo en tu WhatsApp. **Sin apps, sin complicaciones.**'
      ],
      options: [
        { label: '🆓 Probar gratis ahora', next: 'capture_lead' },
        { label: '👀 Ver una demo', next: 'demo_offer' },
        { label: '💬 Hablar con Nico por WhatsApp', next: 'whatsapp_cta' }
      ]
    },

    // FLUJO: VA A ABRIR RESTAURANTE
    opening_soon: {
      messages: [
        '¡Excelente momento para arrancar con el pie derecho! 🚀',
        'Los restaurantes que digitalizan su menú **desde el día 1** consiguen más clientes, mejor imagen y menos dolores de cabeza desde el inicio.',
        '¿Cuándo aproximadamente piensas abrir?'
      ],
      options: [
        { label: '🗓️ En los próximos 30 días', next: 'capture_lead' },
        { label: '📅 En 2–3 meses', next: 'opening_future' },
        { label: '🤔 Todavía evaluando', next: 'just_looking' }
      ]
    },

    opening_future: {
      messages: [
        '¡Perfecto! Puedes crear tu menú ahora de forma gratuita y tenerlo listo antes de abrir 🎯',
        'Así el día que abras ya tienes todo operativo. ¿Te parece si te ayudo a empezar?'
      ],
      options: [
        { label: '✅ Sí, empecemos', next: 'capture_lead' },
        { label: '❓ Tengo dudas primero', next: 'objections' }
      ]
    },

    // FLUJO: REVENDEDOR
    reseller: {
      messages: [
        '¡Excelente visión! 💼',
        'PideClick tiene un modelo donde puedes presentar la plataforma a restaurantes de tu zona y generar ingresos recurrentes.',
        '¿Tienes contactos en el sector gastronómico?'
      ],
      options: [
        { label: '✅ Sí, tengo varios contactos', next: 'reseller_strong' },
        { label: '🌱 Estoy empezando', next: 'reseller_starting' }
      ]
    },

    reseller_strong: {
      messages: [
        '¡Eso es potente! 🔥 Con una cartera de restaurantes puedes generar ingresos pasivos mensuales significativos.',
        'Hablemos directamente para contarte cómo funciona el programa de aliados de PideClick 👇'
      ],
      options: [
        { label: '💬 Hablar por WhatsApp ahora', next: 'whatsapp_cta' },
        { label: '📋 Capturar mis datos', next: 'capture_lead' }
      ]
    },

    reseller_starting: {
      messages: [
        'No hay problema 💪 PideClick te da todo lo que necesitas para presentar el servicio profesionalmente.',
        'Te contactamos para darte más detalles del programa 📲'
      ],
      options: [
        { label: '📲 Sí, contáctenme', next: 'capture_lead' },
        { label: '💬 Prefiero hablar ya', next: 'whatsapp_cta' }
      ]
    },

    // FLUJO: SOLO MIRANDO
    just_looking: {
      messages: [
        '¡Sin presión! 😊',
        'Mientras exploras, te cuento lo esencial: **PideClick es gratis** para empezar.',
        'Tienes un menú digital completo, carrito de compras y pedidos por WhatsApp — en menos de 5 minutos. Sin tarjetas, sin compromisos.'
      ],
      options: [
        { label: '🤩 Oye, eso suena bien', next: 'show_essential' },
        { label: '🆓 ¿Qué tan gratis es?', next: 'show_essential' },
        { label: '💬 Quiero saber más', next: 'how_it_works' }
      ]
    },

    // ── PLANES ───────────────────────────────────────────────────────────────

    show_essential: {
      messages: [
        '📦 **Plan Esencial — S/. 0/mes (Gratis)**\n\n✅ Hasta 10 productos\n✅ Menú digital optimizado\n✅ Pedidos por WhatsApp\n✅ Link personalizado\n❌ Sin branding propio\n❌ Sin banners\n❌ Sin estadísticas',
        '¿Se ajusta a lo que necesitas, o quieres ver el plan completo?'
      ],
      options: [
        { label: '🎯 Con eso me basta, ¡empiezo!', next: 'capture_lead' },
        { label: '⚡ Quiero el plan completo', next: 'show_pro' },
        { label: '❓ ¿Qué diferencia al PRO?', next: 'show_pro' }
      ]
    },

    show_pro: {
      messages: [
        '🚀 **Plan PRO — S/. 30/mes**\n\n✅ Productos **ilimitados**\n✅ Branding con tu logo y colores\n✅ Banners promocionales\n✅ Estadísticas de ventas\n✅ Soporte VIP\n✅ Todo del plan Esencial',
        '**Menos que un almuerzo al día** para tener una tienda digital profesional 🔥'
      ],
      options: [
        { label: '🔥 Quiero el PRO', next: 'capture_lead' },
        { label: '🆓 Empiezo con el gratis', next: 'capture_lead' },
        { label: '💬 Tengo una duda', next: 'objections' }
      ]
    },

    show_pro_urgent: {
      messages: [
        '¡Con ese volumen de pedidos el Plan PRO se paga solo en días! 📈',
        '🚀 **Plan PRO — S/. 30/mes:**\n✅ Productos ilimitados\n✅ Branding propio\n✅ Estadísticas en tiempo real\n✅ Soporte prioritario',
        'Para +30 pedidos/día, el PRO es prácticamente **obligatorio** para mantener el orden 💪'
      ],
      options: [
        { label: '🔥 Activar PRO ahora', next: 'capture_lead' },
        { label: '💬 Hablar con asesor', next: 'whatsapp_cta' }
      ]
    },

    // ── OBJECIONES ────────────────────────────────────────────────────────────

    objections: {
      messages: ['¡Con gusto! ¿Cuál es tu duda principal? 🤔'],
      options: [
        { label: '💰 ¿Es realmente gratis?', next: 'obj_free' },
        { label: '⏱️ ¿Cuánto demora configurarlo?', next: 'obj_setup_time' },
        { label: '📱 ¿Mis clientes necesitan app?', next: 'obj_no_app' },
        { label: '🔒 ¿Y si quiero cancelar?', next: 'obj_cancel' }
      ]
    },

    obj_free: {
      messages: [
        '**100% gratis, sin trampa.** 🎉',
        'No pedimos tarjeta de crédito. El plan Esencial es tuyo sin fecha de vencimiento. Si quieres funciones avanzadas, upgrades cuando tú decidas — o nunca, si no es necesario.',
        'Literalmente no tienes nada que perder 🤷'
      ],
      options: [
        { label: '✅ Me convencí, ¡empiezo!', next: 'capture_lead' },
        { label: '❓ Otra pregunta', next: 'objections' }
      ]
    },

    obj_setup_time: {
      messages: [
        '⚡ **Menos de 5 minutos** para tener tu menú online.',
        '1. Entras al link con el nombre de tu negocio\n2. Subes tus productos con foto y precio\n3. Compartes el link — ¡listo!',
        'Sin instalaciones. Sin técnicos. Sin complicaciones.'
      ],
      options: [
        { label: '😮 ¡Eso es rápido! Empiezo', next: 'capture_lead' },
        { label: '❓ Otra pregunta', next: 'objections' }
      ]
    },

    obj_no_app: {
      messages: [
        '¡No necesitan instalar nada! 📲',
        'PideClick es una **web app**. Tus clientes acceden desde cualquier navegador — Chrome, Safari, lo que sea — con solo abrir el link o escanear el QR.',
        'Igual que entrar a Instagram. Sin descargas, sin cuenta, sin fricción.'
      ],
      options: [
        { label: '👌 Perfecto, eso es lo que necesito', next: 'capture_lead' },
        { label: '❓ Otra pregunta', next: 'objections' }
      ]
    },

    obj_cancel: {
      messages: [
        'Sin compromisos, sin letras pequeñas 🤝',
        'Puedes cancelar cuando quieras. No hay permanencia, no hay multas. Si el PRO no te convence (aunque no lo creemos 😄), simplemente no lo renuevas.',
        'Tu negocio, tus reglas.'
      ],
      options: [
        { label: '✅ Genial, quiero probarlo', next: 'capture_lead' },
        { label: '❓ Otra pregunta', next: 'objections' }
      ]
    },

    // ── CTAs ESPECIALES ───────────────────────────────────────────────────────

    demo_offer: {
      messages: [
        '¡Claro! Puedo mostrarte cómo luce PideClick con datos reales 👀',
        'Dame tus datos y te agendo una demo rápida (15 min) donde verás exactamente cómo funcionaría para tu negocio.'
      ],
      options: [
        { label: '📅 Quiero la demo', next: 'capture_lead' },
        { label: '💬 Mejor por WhatsApp', next: 'whatsapp_cta' }
      ]
    },

    whatsapp_cta: {
      messages: [
        '¡Perfecto! Mi colega del equipo PideClick te atenderá ahora 💬',
        'Te redirijo a WhatsApp para que puedas hablar directamente 👇'
      ],
      options: [
        { label: '💬 Abrir WhatsApp ahora', action: 'open_whatsapp' },
        { label: '📝 Dejar mis datos y me contactan', next: 'capture_lead' }
      ]
    },

    // ── CAPTURA DE LEAD ───────────────────────────────────────────────────────

    capture_lead: {
      messages: [
        '¡Me parece genial! 🎉',
        'Dame un par de datos para enviarte tu acceso y el links de tu menú:'
      ],
      input_form: true
    },

    // ── LEAD REGISTRADO ───────────────────────────────────────────────────────

    lead_captured: {
      messages: [
        '¡Listo, {nombre}! 🚀',
        'En breve el equipo de PideClick se comunicará contigo por WhatsApp para ayudarte a configurar tu menú digital.',
        '**Mientras tanto, ya puedes explorar tu panel** 👇'
      ],
      options: [
        { label: '🎯 Ver mi menú ahora', action: 'go_to_store' },
        { label: '💬 Hablar por WhatsApp', action: 'open_whatsapp' }
      ]
    }

  };

  // ── ESTADO ────────────────────────────────────────────────────────────────
  let state = {
    currentFlow: 'start',
    leadData: {},
    isOpen: false,
    isTyping: false,
    messageQueue: [],
    hasGreeted: false
  };

  // ── ESTILOS ───────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('pideclick-chatbot-css')) return;
    const style = document.createElement('style');
    style.id = 'pideclick-chatbot-css';
    style.textContent = `
      /* ── CHATBOT WIDGET ── */
      #pc-chat-bubble {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
        font-family: 'DM Sans', sans-serif;
      }

      #pc-chat-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #F97316, #ea6c0c);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 24px rgba(249,115,22,0.45);
        transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        position: relative;
        flex-shrink: 0;
      }
      #pc-chat-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 32px rgba(249,115,22,0.55);
      }
      #pc-chat-btn.is-open {
        background: linear-gradient(135deg, #27272A, #18181B);
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      }
      #pc-chat-btn-icon { font-size: 26px; line-height: 1; transition: transform 0.3s; }
      #pc-chat-btn.is-open #pc-chat-btn-icon { transform: rotate(90deg); }

      #pc-chat-pulse {
        position: absolute;
        top: 0; right: 0;
        width: 16px; height: 16px;
        background: #10B981;
        border-radius: 50%;
        border: 2px solid #09090B;
        animation: pc-pulse 2s infinite;
      }
      @keyframes pc-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }

      #pc-chat-teaser {
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 16px;
        padding: 10px 16px;
        max-width: 230px;
        font-size: 13px;
        color: #e4e4e7;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        cursor: pointer;
        animation: pc-slide-up 0.4s ease forwards;
        position: relative;
      }
      #pc-chat-teaser::after {
        content: '';
        position: absolute;
        bottom: -8px;
        right: 24px;
        width: 0; height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #27272A;
      }
      #pc-chat-teaser strong { color: #F97316; }

      /* ── CHAT WINDOW ── */
      #pc-chat-window {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 560px;
        max-height: calc(100vh - 120px);
        background: #09090B;
        border: 1px solid #27272A;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,0.7);
        z-index: 9998;
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.25s ease;
      }
      #pc-chat-window.is-open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      /* Header */
      #pc-chat-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #18181B, #1c1c1f);
        border-bottom: 1px solid #27272A;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      #pc-chat-header-avatar {
        width: 40px; height: 40px;
        background: linear-gradient(135deg, #F97316, #ea6c0c);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
        box-shadow: 0 0 0 3px rgba(249,115,22,0.2);
      }
      #pc-chat-header-info { flex: 1; min-width: 0; }
      #pc-chat-header-name { font-weight: 700; color: #fff; font-size: 14px; }
      #pc-chat-header-status {
        font-size: 11px;
        color: #10B981;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
      }
      #pc-chat-header-status::before {
        content: '';
        width: 6px; height: 6px;
        background: #10B981;
        border-radius: 50%;
        flex-shrink: 0;
        animation: pc-pulse 2s infinite;
      }
      #pc-chat-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #71717a;
        padding: 4px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s, background 0.2s;
      }
      #pc-chat-close:hover { color: #fff; background: rgba(255,255,255,0.05); }

      /* Messages area */
      #pc-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        scroll-behavior: smooth;
      }
      #pc-chat-messages::-webkit-scrollbar { width: 4px; }
      #pc-chat-messages::-webkit-scrollbar-track { background: transparent; }
      #pc-chat-messages::-webkit-scrollbar-thumb { background: #27272A; border-radius: 4px; }

      /* Mensaje del bot */
      .pc-msg-bot {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        animation: pc-slide-up 0.3s ease forwards;
        max-width: 85%;
      }
      .pc-msg-bot-av {
        width: 28px; height: 28px;
        background: linear-gradient(135deg, #F97316, #ea6c0c);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        flex-shrink: 0;
      }
      .pc-msg-bot-bubble {
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 18px 18px 18px 4px;
        padding: 10px 14px;
        font-size: 13.5px;
        color: #e4e4e7;
        line-height: 1.5;
        word-break: break-word;
      }
      .pc-msg-bot-bubble strong { color: #F97316; }
      .pc-msg-bot-bubble em { color: #a1a1aa; font-style: normal; }

      /* Typing indicator */
      .pc-typing {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .pc-typing-dots {
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 18px 18px 18px 4px;
        padding: 12px 16px;
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .pc-typing-dot {
        width: 6px; height: 6px;
        background: #52525b;
        border-radius: 50%;
        animation: pc-dot-bounce 1.2s infinite;
      }
      .pc-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .pc-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pc-dot-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-6px); opacity: 1; }
      }

      /* Quick replies */
      #pc-chat-options {
        padding: 12px 16px;
        border-top: 1px solid #18181B;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-shrink: 0;
        max-height: 200px;
        overflow-y: auto;
      }
      #pc-chat-options::-webkit-scrollbar { width: 4px; }
      #pc-chat-options::-webkit-scrollbar-thumb { background: #27272A; border-radius: 4px; }

      .pc-option-btn {
        width: 100%;
        padding: 10px 14px;
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 12px;
        color: #e4e4e7;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s;
        font-family: 'DM Sans', sans-serif;
      }
      .pc-option-btn:hover {
        background: rgba(249,115,22,0.08);
        border-color: rgba(249,115,22,0.35);
        color: #fff;
        transform: translateX(3px);
      }
      .pc-option-btn:active { transform: translateX(1px); }

      /* Formulario de lead */
      #pc-lead-form {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-top: 1px solid #18181B;
        flex-shrink: 0;
      }
      .pc-input {
        width: 100%;
        padding: 10px 14px;
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 12px;
        color: #e4e4e7;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
        font-family: 'DM Sans', sans-serif;
      }
      .pc-input:focus { border-color: #F97316; }
      .pc-input::placeholder { color: #52525b; }

      .pc-submit-btn {
        padding: 11px;
        background: linear-gradient(135deg, #F97316, #ea6c0c);
        border: none;
        border-radius: 12px;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.1s;
        font-family: 'DM Sans', sans-serif;
        box-shadow: 0 4px 14px rgba(249,115,22,0.3);
      }
      .pc-submit-btn:hover { opacity: 0.92; transform: translateY(-1px); }
      .pc-submit-btn:active { transform: translateY(0); }

      /* Animaciones */
      @keyframes pc-slide-up {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      /* Responsive */
      @media (max-width: 430px) {
        #pc-chat-window {
          bottom: 0; right: 0;
          width: 100vw;
          max-width: 100vw;
          border-radius: 24px 24px 0 0;
          height: 70vh;
        }
        #pc-chat-bubble { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── DOM ───────────────────────────────────────────────────────────────────
  function buildWidget() {
    if (document.getElementById('pc-chat-bubble')) return;

    const html = `
      <div id="pc-chat-bubble">
        <div id="pc-chat-teaser" onclick="PideChatbot.open()">
          <strong>¡Hola! 👋</strong> ¿Tienes un restaurante?<br>
          Te ayudo a digitalizar tu negocio gratis 🚀
        </div>
        <button id="pc-chat-btn" onclick="PideChatbot.toggle()" aria-label="Abrir chatbot de PideClick">
          <span id="pc-chat-btn-icon">💬</span>
          <span id="pc-chat-pulse"></span>
        </button>
      </div>

      <div id="pc-chat-window" role="dialog" aria-label="Chat de PideClick">
        <div id="pc-chat-header">
          <div id="pc-chat-header-avatar">🤖</div>
          <div id="pc-chat-header-info">
            <div id="pc-chat-header-name">Nico · PideClick</div>
            <div id="pc-chat-header-status">En línea ahora</div>
          </div>
          <button id="pc-chat-close" onclick="PideChatbot.close()" aria-label="Cerrar chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div id="pc-chat-messages"></div>

        <div id="pc-chat-options" class="hidden"></div>
        <form id="pc-lead-form" class="hidden" onsubmit="PideChatbot.submitLead(event)">
          <input class="pc-input" id="pc-lead-name" placeholder="Tu nombre 👤" required autocomplete="name">
          <input class="pc-input" id="pc-lead-biz" placeholder="Nombre de tu negocio 🍽️" required>
          <input class="pc-input" id="pc-lead-wa" placeholder="WhatsApp (ej: 987654321) 📲" type="tel" required pattern="[0-9]{9,12}">
          <button type="submit" class="pc-submit-btn">¡Empezar ahora → Gratis! 🚀</button>
        </form>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
    document.body.appendChild(container.lastElementChild);
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function scrollBottom() {
    const msgs = $('pc-chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function typingDelay(text) {
    return Math.min(
      CONFIG.typing_delay_base + text.length * CONFIG.typing_delay_per_char,
      2500
    );
  }

  // ── RENDERING ─────────────────────────────────────────────────────────────
  function showTyping() {
    const msgs = $('pc-chat-messages');
    const el = document.createElement('div');
    el.className = 'pc-typing';
    el.id = 'pc-typing-indicator';
    el.innerHTML = `
      <div class="pc-msg-bot-av">🤖</div>
      <div class="pc-typing-dots">
        <div class="pc-typing-dot"></div>
        <div class="pc-typing-dot"></div>
        <div class="pc-typing-dot"></div>
      </div>
    `;
    msgs.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    const el = $('pc-typing-indicator');
    if (el) el.remove();
  }

  function addBotMessage(text) {
    const msgs = $('pc-chat-messages');
    const el = document.createElement('div');
    el.className = 'pc-msg-bot';
    el.innerHTML = `
      <div class="pc-msg-bot-av">🤖</div>
      <div class="pc-msg-bot-bubble">${parseMarkdown(text)}</div>
    `;
    msgs.appendChild(el);
    scrollBottom();
  }

  function addUserMessage(text) {
    const msgs = $('pc-chat-messages');
    const el = document.createElement('div');
    el.style.cssText = 'display:flex; justify-content:flex-end; animation: pc-slide-up 0.3s ease forwards;';
    el.innerHTML = `<div style="background:linear-gradient(135deg,#F97316,#ea6c0c);border-radius:18px 18px 4px 18px;padding:10px 14px;font-size:13.5px;color:#fff;max-width:82%;word-break:break-word;line-height:1.5;">${text}</div>`;
    msgs.appendChild(el);
    scrollBottom();
  }

  function showOptions(options) {
    const container = $('pc-chat-options');
    container.innerHTML = '';
    container.classList.remove('hidden');
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'pc-option-btn';
      btn.textContent = opt.label;
      btn.onclick = () => handleOption(opt);
      container.appendChild(btn);
    });
  }

  function hideOptions() {
    const c = $('pc-chat-options');
    c.classList.add('hidden');
    c.innerHTML = '';
  }

  function showLeadForm() {
    $('pc-lead-form').classList.remove('hidden');
    setTimeout(() => $('pc-lead-name')?.focus(), 100);
  }

  function hideLeadForm() {
    $('pc-lead-form').classList.add('hidden');
  }

  // ── FLUJO DE CONVERSACIÓN ─────────────────────────────────────────────────
  async function runFlow(flowKey, replacements = {}) {
    const flow = FLOWS[flowKey];
    if (!flow) return;

    state.currentFlow = flowKey;
    hideOptions();
    hideLeadForm();
    state.isTyping = true;

    for (const msg of flow.messages) {
      showTyping();
      await delay(typingDelay(msg));
      hideTyping();
      let text = msg;
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
      addBotMessage(text);
      await delay(200);
    }

    state.isTyping = false;

    if (flow.input_form) {
      showLeadForm();
    } else if (flow.options) {
      showOptions(flow.options);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function handleOption(opt) {
    addUserMessage(opt.label);
    hideOptions();

    if (opt.action === 'open_whatsapp') {
      const msg = encodeURIComponent('Hola, me interesa PideClick para mi restaurante. ¿Puedo obtener más información?');
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');
      runFlow('whatsapp_cta');
    } else if (opt.action === 'go_to_store') {
      const b = new URLSearchParams(window.location.search).get('b');
      if (b) window.location.href = `index.html?b=${b}`;
    } else if (opt.next) {
      runFlow(opt.next);
    }
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  window.PideChatbot = {
    open() {
      state.isOpen = true;
      $('pc-chat-window').classList.add('is-open');
      $('pc-chat-btn').classList.add('is-open');
      $('pc-chat-btn-icon').textContent = '✕';
      const teaser = $('pc-chat-teaser');
      if (teaser) teaser.style.display = 'none';

      if (!state.hasGreeted) {
        state.hasGreeted = true;
        setTimeout(() => runFlow('start'), CONFIG.greeting_delay);
      }
    },

    close() {
      state.isOpen = false;
      $('pc-chat-window').classList.remove('is-open');
      $('pc-chat-btn').classList.remove('is-open');
      $('pc-chat-btn-icon').textContent = '💬';
    },

    toggle() {
      state.isOpen ? this.close() : this.open();
    },

    submitLead(e) {
      e.preventDefault();
      const nombre = $('pc-lead-name').value.trim();
      const negocio = $('pc-lead-biz').value.trim();
      const whatsapp = $('pc-lead-wa').value.trim();

      if (!nombre || !negocio || !whatsapp) return;

      state.leadData = { nombre, negocio, whatsapp };

      // Guardar en localStorage
      try {
        const leads = JSON.parse(localStorage.getItem('pc_chatbot_leads') || '[]');
        leads.push({ ...state.leadData, timestamp: new Date().toISOString() });
        localStorage.setItem('pc_chatbot_leads', JSON.stringify(leads));
      } catch (_) {}

      // Mostrar mensaje del usuario
      addUserMessage(`${nombre} · ${negocio} · ${whatsapp}`);
      hideLeadForm();

      // Mandar notificación por WhatsApp al equipo
      const msg = encodeURIComponent(
        `Nuevo lead PideClick 🔥\n\nNombre: ${nombre}\nNegocio: ${negocio}\nWhatsApp: +51${whatsapp}\n\n_(Enviado automáticamente desde el chatbot)_`
      );
      // Abrir silenciosamente (no forzamos, solo en móvil podría no funcionar)
      const notifLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;

      runFlow('lead_captured', { nombre }).then(() => {
        // Después del flujo, ofrecer ir a WA
        setTimeout(() => {
          const openWaBtn = document.createElement('button');
          openWaBtn.className = 'pc-option-btn';
          openWaBtn.style.borderColor = 'rgba(16,185,129,0.4)';
          openWaBtn.style.color = '#10B981';
          openWaBtn.textContent = '💬 Enviar alerta al equipo por WhatsApp';
          openWaBtn.onclick = () => window.open(notifLink, '_blank');
          const opts = $('pc-chat-options');
          opts.classList.remove('hidden');
          opts.appendChild(openWaBtn);
        }, 500);
      });
    }
  };

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildWidget();

    // Auto-show teaser después de 4 seg si el usuario no ha interactuado
    setTimeout(() => {
      if (!state.isOpen && !state.hasGreeted) {
        const teaser = $('pc-chat-teaser');
        if (teaser) {
          teaser.style.display = 'block';
          // Auto-hide teaser después de 8 seg
          setTimeout(() => {
            if (!state.isOpen && teaser) teaser.style.display = 'none';
          }, 8000);
        }
      }
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
