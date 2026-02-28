/**
 * PideClick SalesBot â€” Chatbot de ventas ultra persuasivo
 * Vendedor automÃ¡tico 24/7 para la landing page de PideClick
 */

(function () {
  'use strict';

  // â”€â”€ CONFIGURACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CONFIG = {
    botName: 'Danny',
    botAvatar: 'ðŸ¤–',
    whatsappNumber: '51972498691',
    greeting_delay: 800,
    typing_delay_base: 600,
    typing_delay_per_char: 18,
    colors: { primary: '#F97316', bg: '#09090B', surface: '#18181B', border: '#27272A' }
  };

  // â”€â”€ ÃRBOL DE CONVERSACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const FLOWS = {

    // INICIO
    start: {
      messages: [
        'Â¡Hola! ðŸ‘‹ Soy Danny, tu asesor digital de **PideClick**.',
        'Â¿Tienes un restaurante o negocio gastronÃ³mico? ðŸ½ï¸'
      ],
      options: [
        { label: 'ðŸ” SÃ­, tengo un restaurante', next: 'has_restaurant' },
        { label: 'ðŸš€ Estoy por abrir uno', next: 'opening_soon' },
        { label: 'ðŸ’¼ Quiero revender el servicio', next: 'reseller' },
        { label: 'ðŸ¤” Solo estoy mirando', next: 'just_looking' }
      ]
    },

    // FLUJO: TIENE RESTAURANTE
    has_restaurant: {
      messages: ['Â¡Perfecto! ðŸ”¥ Vamos al punto.'],
      options: [
        { label: 'ðŸ“² Recibo pedidos por WhatsApp (es un caos)', next: 'pain_whatsapp_chaos' },
        { label: 'ðŸ’¸ Apps como Rappi me cobran mucho', next: 'pain_high_commissions' },
        { label: 'ðŸ“µ No tengo menÃº digital', next: 'pain_no_menu' },
        { label: 'ðŸ“ˆ Quiero vender mÃ¡s', next: 'pain_more_sales' }
      ]
    },

    // DOLOR 1: Caos en WhatsApp
    pain_whatsapp_chaos: {
      messages: [
        'Â¡Ese es el problema #1 de los restaurantes! ðŸ˜¤',
        'Con PideClick tus clientes hacen el pedido ellos mismos desde su celular â€” tÃº recibes el orden perfectamente detallado por WhatsApp. **Sin errores. Sin malentendidos.**',
        'Â¿CuÃ¡ntos pedidos diarios manejas aprox?'
      ],
      options: [
        { label: 'ðŸ“¦ 1â€“10 pedidos/dÃ­a', next: 'show_essential' },
        { label: 'ðŸ“¦ðŸ“¦ 10â€“30 pedidos/dÃ­a', next: 'show_pro' },
        { label: 'ðŸ“¦ðŸ“¦ðŸ“¦ +30 pedidos/dÃ­a', next: 'show_pro_urgent' }
      ]
    },

    // DOLOR 2: Comisiones altas
    pain_high_commissions: {
      messages: [
        'Â¡Eso duele en el bolsillo! ðŸ’¸',
        'Rappi y similares se quedan con el **25â€“35%** de cada venta. Si vendes S/. 5,000 al mes, les regalas hasta **S/. 1,750**.',
        'Con PideClick pagas una cuota fija pequeÃ±a y te quedas con el **100%** de tus ventas. Â¿Quieres ver los nÃºmeros?'
      ],
      options: [
        { label: 'ðŸ’° SÃ­, quiero ver cuÃ¡nto ahorro', next: 'savings_calc' },
        { label: 'ðŸš€ Â¡Quiero empezar ya!', next: 'capture_lead' }
      ]
    },

    // DOLOR 3: Sin menÃº digital
    pain_no_menu: {
      messages: [
        'Sin menÃº digital estÃ¡s dejando ventas sobre la mesa ðŸ“‰',
        'PideClick te da un menÃº **profesional con fotos, categorÃ­as y precios** â€” listo en minutos. Tus clientes lo ven desde cualquier celular, sin instalar nada.',
        'Â¿El mejor dato? **El Plan Esencial es GRATIS.** ðŸ¤©'
      ],
      options: [
        { label: 'ðŸ†“ Â¿QuÃ© incluye el plan gratis?', next: 'show_essential' },
        { label: 'âš¡ Ver plan completo', next: 'show_pro' },
        { label: 'ðŸŽ¯ Quiero probarlo ahora', next: 'capture_lead' }
      ]
    },

    // DOLOR 4: MÃ¡s ventas
    pain_more_sales: {
      messages: [
        'Me gusta esa mentalidad ðŸŽ¯',
        'Los restaurantes que implementan PideClick tÃ­picamente ven un **aumento del 30â€“40%** en pedidos en el primer mes.',
        'Â¿Por quÃ©? Porque el carta digital hace que los clientes compren mÃ¡s fÃ¡cil, mÃ¡s rÃ¡pido y vuelvan mÃ¡s seguido.'
      ],
      options: [
        { label: 'ðŸ“Š Â¿CÃ³mo funciona exactamente?', next: 'how_it_works' },
        { label: 'ðŸ’¬ Hablar con un asesor', next: 'whatsapp_cta' },
        { label: 'ðŸ†“ Probar gratis', next: 'capture_lead' }
      ]
    },

    // CÃLCULO DE AHORRO
    savings_calc: {
      messages: [
        'ðŸ’¡ **Ejemplo real:**',
        'ðŸ“Œ Ventas mensuales: **S/. 5,000**\nðŸ”º ComisiÃ³n Rappi (30%): **â€“ S/. 1,500**\nâœ… Con PideClick PRO: **â€“ S/. 30**\n\n**Ahorro mensual: S/. 1,470** ðŸ¤‘',
        'Ese dinero es tuyo para reinvertir, pagar personal o ahorrarlo.'
      ],
      options: [
        { label: 'ðŸš€ Â¡Quiero activar PideClick!', next: 'capture_lead' },
        { label: 'ðŸ’¬ Tengo preguntas', next: 'objections' }
      ]
    },

    // CÃ“MO FUNCIONA
    how_it_works: {
      messages: [
        'Â¡Es sÃºper simple en 3 pasos! âš¡',
        '1ï¸âƒ£ **Crea tu URL**: elige el nombre de tu negocio\n2ï¸âƒ£ **Sube tu menÃº**: fotos, precios, categorÃ­as\n3ï¸âƒ£ **Comparte el link**: por redes, WhatsApp o QR',
        'Tus clientes hacen el pedido y tÃº lo recibes directo en tu WhatsApp. **Sin apps, sin complicaciones.**'
      ],
      options: [
        { label: 'ðŸ†“ Probar gratis ahora', next: 'capture_lead' },
        { label: 'ðŸ‘€ Ver una demo', next: 'demo_offer' },
        { label: 'ðŸ’¬ Hablar con Nico por WhatsApp', next: 'whatsapp_cta' }
      ]
    },

    // FLUJO: VA A ABRIR RESTAURANTE
    opening_soon: {
      messages: [
        'Â¡Excelente momento para arrancar con el pie derecho! ðŸš€',
        'Los restaurantes que digitalizan su menÃº **desde el dÃ­a 1** consiguen mÃ¡s clientes, mejor imagen y menos dolores de cabeza desde el inicio.',
        'Â¿CuÃ¡ndo aproximadamente piensas abrir?'
      ],
      options: [
        { label: 'ðŸ—“ï¸ En los prÃ³ximos 30 dÃ­as', next: 'capture_lead' },
        { label: 'ðŸ“… En 2â€“3 meses', next: 'opening_future' },
        { label: 'ðŸ¤” TodavÃ­a evaluando', next: 'just_looking' }
      ]
    },

    opening_future: {
      messages: [
        'Â¡Perfecto! Puedes crear tu menÃº ahora de forma gratuita y tenerlo listo antes de abrir ðŸŽ¯',
        'AsÃ­ el dÃ­a que abras ya tienes todo operativo. Â¿Te parece si te ayudo a empezar?'
      ],
      options: [
        { label: 'âœ… SÃ­, empecemos', next: 'capture_lead' },
        { label: 'â“ Tengo dudas primero', next: 'objections' }
      ]
    },

    // FLUJO: REVENDEDOR
    reseller: {
      messages: [
        'Â¡Excelente visiÃ³n! ðŸ’¼',
        'PideClick tiene un modelo donde puedes presentar la plataforma a restaurantes de tu zona y generar ingresos recurrentes.',
        'Â¿Tienes contactos en el sector gastronÃ³mico?'
      ],
      options: [
        { label: 'âœ… SÃ­, tengo varios contactos', next: 'reseller_strong' },
        { label: 'ðŸŒ± Estoy empezando', next: 'reseller_starting' }
      ]
    },

    reseller_strong: {
      messages: [
        'Â¡Eso es potente! ðŸ”¥ Con una cartera de restaurantes puedes generar ingresos pasivos mensuales significativos.',
        'Hablemos directamente para contarte cÃ³mo funciona el programa de aliados de PideClick ðŸ‘‡'
      ],
      options: [
        { label: 'ðŸ’¬ Hablar por WhatsApp ahora', next: 'whatsapp_cta' },
        { label: 'ðŸ“‹ Capturar mis datos', next: 'capture_lead' }
      ]
    },

    reseller_starting: {
      messages: [
        'No hay problema ðŸ’ª PideClick te da todo lo que necesitas para presentar el servicio profesionalmente.',
        'Te contactamos para darte mÃ¡s detalles del programa ðŸ“²'
      ],
      options: [
        { label: 'ðŸ“² SÃ­, contÃ¡ctenme', next: 'capture_lead' },
        { label: 'ðŸ’¬ Prefiero hablar ya', next: 'whatsapp_cta' }
      ]
    },

    // FLUJO: SOLO MIRANDO
    just_looking: {
      messages: [
        'Â¡Sin presiÃ³n! ðŸ˜Š',
        'Mientras exploras, te cuento lo esencial: **PideClick es gratis** para empezar.',
        'Tienes un menÃº digital completo, carrito de compras y pedidos por WhatsApp â€” en menos de 5 minutos. Sin tarjetas, sin compromisos.'
      ],
      options: [
        { label: 'ðŸ¤© Oye, eso suena bien', next: 'show_essential' },
        { label: 'ðŸ†“ Â¿QuÃ© tan gratis es?', next: 'show_essential' },
        { label: 'ðŸ’¬ Quiero saber mÃ¡s', next: 'how_it_works' }
      ]
    },

    // â”€â”€ PLANES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    show_essential: {
      messages: [
        'ðŸ“¦ **Plan Esencial â€” S/. 0/mes (Gratis)**\n\nâœ… Hasta 10 productos\nâœ… MenÃº digital optimizado\nâœ… Pedidos por WhatsApp\nâœ… Link personalizado\nâŒ Sin branding propio\nâŒ Sin banners\nâŒ Sin estadÃ­sticas',
        'Â¿Se ajusta a lo que necesitas, o quieres ver el plan completo?'
      ],
      options: [
        { label: 'ðŸŽ¯ Con eso me basta, Â¡empiezo!', next: 'capture_lead' },
        { label: 'âš¡ Quiero el plan completo', next: 'show_pro' },
        { label: 'â“ Â¿QuÃ© diferencia al PRO?', next: 'show_pro' }
      ]
    },

    show_pro: {
      messages: [
        'ðŸš€ **Plan PRO â€” S/. 30/mes**\n\nâœ… Productos **ilimitados**\nâœ… Branding con tu logo y colores\nâœ… Banners promocionales\nâœ… EstadÃ­sticas de ventas\nâœ… Soporte VIP\nâœ… Todo del plan Esencial',
        '**Menos que un almuerzo al dÃ­a** para tener una tienda digital profesional ðŸ”¥'
      ],
      options: [
        { label: 'ðŸ”¥ Quiero el PRO', next: 'capture_lead' },
        { label: 'ðŸ†“ Empiezo con el gratis', next: 'capture_lead' },
        { label: 'ðŸ’¬ Tengo una duda', next: 'objections' }
      ]
    },

    show_pro_urgent: {
      messages: [
        'Â¡Con ese volumen de pedidos el Plan PRO se paga solo en dÃ­as! ðŸ“ˆ',
        'ðŸš€ **Plan PRO â€” S/. 30/mes:**\nâœ… Productos ilimitados\nâœ… Branding propio\nâœ… EstadÃ­sticas en tiempo real\nâœ… Soporte prioritario',
        'Para +30 pedidos/dÃ­a, el PRO es prÃ¡cticamente **obligatorio** para mantener el orden ðŸ’ª'
      ],
      options: [
        { label: 'ðŸ”¥ Activar PRO ahora', next: 'capture_lead' },
        { label: 'ðŸ’¬ Hablar con asesor', next: 'whatsapp_cta' }
      ]
    },

    // â”€â”€ OBJECIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    objections: {
      messages: ['Â¡Con gusto! Â¿CuÃ¡l es tu duda principal? ðŸ¤”'],
      options: [
        { label: 'ðŸ’° Â¿Es realmente gratis?', next: 'obj_free' },
        { label: 'â±ï¸ Â¿CuÃ¡nto demora configurarlo?', next: 'obj_setup_time' },
        { label: 'ðŸ“± Â¿Mis clientes necesitan app?', next: 'obj_no_app' },
        { label: 'ðŸ”’ Â¿Y si quiero cancelar?', next: 'obj_cancel' }
      ]
    },

    obj_free: {
      messages: [
        '**100% gratis, sin trampa.** ðŸŽ‰',
        'No pedimos tarjeta de crÃ©dito. El plan Esencial es tuyo sin fecha de vencimiento. Si quieres funciones avanzadas, upgrades cuando tÃº decidas â€” o nunca, si no es necesario.',
        'Literalmente no tienes nada que perder ðŸ¤·'
      ],
      options: [
        { label: 'âœ… Me convencÃ­, Â¡empiezo!', next: 'capture_lead' },
        { label: 'â“ Otra pregunta', next: 'objections' }
      ]
    },

    obj_setup_time: {
      messages: [
        'âš¡ **Menos de 5 minutos** para tener tu menÃº online.',
        '1. Entras al link con el nombre de tu negocio\n2. Subes tus productos con foto y precio\n3. Compartes el link â€” Â¡listo!',
        'Sin instalaciones. Sin tÃ©cnicos. Sin complicaciones.'
      ],
      options: [
        { label: 'ðŸ˜® Â¡Eso es rÃ¡pido! Empiezo', next: 'capture_lead' },
        { label: 'â“ Otra pregunta', next: 'objections' }
      ]
    },

    obj_no_app: {
      messages: [
        'Â¡No necesitan instalar nada! ðŸ“²',
        'PideClick es una **web app**. Tus clientes acceden desde cualquier navegador â€” Chrome, Safari, lo que sea â€” con solo abrir el link o escanear el QR.',
        'Igual que entrar a Instagram. Sin descargas, sin cuenta, sin fricciÃ³n.'
      ],
      options: [
        { label: 'ðŸ‘Œ Perfecto, eso es lo que necesito', next: 'capture_lead' },
        { label: 'â“ Otra pregunta', next: 'objections' }
      ]
    },

    obj_cancel: {
      messages: [
        'Sin compromisos, sin letras pequeÃ±as ðŸ¤',
        'Puedes cancelar cuando quieras. No hay permanencia, no hay multas. Si el PRO no te convence (aunque no lo creemos ðŸ˜„), simplemente no lo renuevas.',
        'Tu negocio, tus reglas.'
      ],
      options: [
        { label: 'âœ… Genial, quiero probarlo', next: 'capture_lead' },
        { label: 'â“ Otra pregunta', next: 'objections' }
      ]
    },

    // â”€â”€ CTAs ESPECIALES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    demo_offer: {
      messages: [
        'Â¡Claro! Puedo mostrarte cÃ³mo luce PideClick con datos reales ðŸ‘€',
        'Dame tus datos y te agendo una demo rÃ¡pida (15 min) donde verÃ¡s exactamente cÃ³mo funcionarÃ­a para tu negocio.'
      ],
      options: [
        { label: 'ðŸ“… Quiero la demo', next: 'capture_lead' },
        { label: 'ðŸ’¬ Mejor por WhatsApp', next: 'whatsapp_cta' }
      ]
    },

    whatsapp_cta: {
      messages: [
        'Â¡Perfecto! Mi colega del equipo PideClick te atenderÃ¡ ahora ðŸ’¬',
        'Te redirijo a WhatsApp para que puedas hablar directamente ðŸ‘‡'
      ],
      options: [
        { label: 'ðŸ’¬ Abrir WhatsApp ahora', action: 'open_whatsapp' },
        { label: 'ðŸ“ Dejar mis datos y me contactan', next: 'capture_lead' }
      ]
    },

    // â”€â”€ CAPTURA DE LEAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    capture_lead: {
      messages: [
        'Â¡Me parece genial! ðŸŽ‰',
        'Dame un par de datos para enviarte tu acceso y el links de tu menÃº:'
      ],
      input_form: true
    },

    // â”€â”€ LEAD REGISTRADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    lead_captured: {
      messages: [
        'Â¡Listo, {nombre}! ðŸš€',
        'En breve el equipo de PideClick se comunicarÃ¡ contigo por WhatsApp para ayudarte a configurar tu menÃº digital.',
        '**Mientras tanto, ya puedes explorar tu panel** ðŸ‘‡'
      ],
      options: [
        { label: 'ðŸŽ¯ Ver mi menÃº ahora', action: 'go_to_store' },
        { label: 'ðŸ’¬ Hablar por WhatsApp', action: 'open_whatsapp' }
      ]
    }

  };

  // â”€â”€ ESTADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let state = {
    currentFlow: 'start',
    leadData: {},
    isOpen: false,
    isTyping: false,
    messageQueue: [],
    hasGreeted: false
  };

  // â”€â”€ ESTILOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function injectStyles() {
    if (document.getElementById('pideclick-chatbot-css')) return;
    const style = document.createElement('style');
    style.id = 'pideclick-chatbot-css';
    style.textContent = `
      /* â”€â”€ CHATBOT WIDGET â”€â”€ */
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

      /* â”€â”€ CHAT WINDOW â”€â”€ */
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

  // â”€â”€ DOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildWidget() {
    if (document.getElementById('pc-chat-bubble')) return;

    const html = `
      <div id="pc-chat-bubble">
        <div id="pc-chat-teaser" onclick="PideChatbot.open()">
          <strong>Â¡Hola! ðŸ‘‹</strong> Â¿Tienes un restaurante?<br>
          Te ayudo a digitalizar tu negocio gratis ðŸš€
        </div>
        <button id="pc-chat-btn" onclick="PideChatbot.toggle()" aria-label="Abrir chatbot de PideClick">
          <span id="pc-chat-btn-icon">ðŸ’¬</span>
          <span id="pc-chat-pulse"></span>
        </button>
      </div>

      <div id="pc-chat-window" role="dialog" aria-label="Chat de PideClick">
        <div id="pc-chat-header">
          <div id="pc-chat-header-avatar">ðŸ¤–</div>
          <div id="pc-chat-header-info">
            <div id="pc-chat-header-name">Nico Â· PideClick</div>
            <div id="pc-chat-header-status">En lÃ­nea ahora</div>
          </div>
          <button id="pc-chat-close" onclick="PideChatbot.close()" aria-label="Cerrar chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div id="pc-chat-messages"></div>

        <div id="pc-chat-options" class="hidden"></div>
        <form id="pc-lead-form" class="hidden" onsubmit="PideChatbot.submitLead(event)">
          <input class="pc-input" id="pc-lead-name" placeholder="Tu nombre ðŸ‘¤" required autocomplete="name">
          <input class="pc-input" id="pc-lead-biz" placeholder="Nombre de tu negocio ðŸ½ï¸" required>
          <input class="pc-input" id="pc-lead-wa" placeholder="WhatsApp (ej: 987654321) ðŸ“²" type="tel" required pattern="[0-9]{9,12}">
          <button type="submit" class="pc-submit-btn">Â¡Empezar ahora â†’ Gratis! ðŸš€</button>
        </form>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
    document.body.appendChild(container.lastElementChild);
  }

  // â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ RENDERING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function showTyping() {
    const msgs = $('pc-chat-messages');
    const el = document.createElement('div');
    el.className = 'pc-typing';
    el.id = 'pc-typing-indicator';
    el.innerHTML = `
      <div class="pc-msg-bot-av">ðŸ¤–</div>
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
      <div class="pc-msg-bot-av">ðŸ¤–</div>
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

  // â”€â”€ FLUJO DE CONVERSACIÃ“N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      const msg = encodeURIComponent('Hola, me interesa PideClick para mi restaurante. Â¿Puedo obtener mÃ¡s informaciÃ³n?');
      window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');
      runFlow('whatsapp_cta');
    } else if (opt.action === 'go_to_store') {
      const b = new URLSearchParams(window.location.search).get('b');
      if (b) window.location.href = `index.html?b=${b}`;
    } else if (opt.next) {
      runFlow(opt.next);
    }
  }

  // â”€â”€ API PÃšBLICA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window.PideChatbot = {
    open() {
      state.isOpen = true;
      $('pc-chat-window').classList.add('is-open');
      $('pc-chat-btn').classList.add('is-open');
      $('pc-chat-btn-icon').textContent = 'âœ•';
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
      $('pc-chat-btn-icon').textContent = 'ðŸ’¬';
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
      addUserMessage(`${nombre} Â· ${negocio} Â· ${whatsapp}`);
      hideLeadForm();

      // Mandar notificaciÃ³n por WhatsApp al equipo
      const msg = encodeURIComponent(
        `Nuevo lead PideClick ðŸ”¥\n\nNombre: ${nombre}\nNegocio: ${negocio}\nWhatsApp: +51${whatsapp}\n\n_(Enviado automÃ¡ticamente desde el chatbot)_`
      );
      // Abrir silenciosamente (no forzamos, solo en mÃ³vil podrÃ­a no funcionar)
      const notifLink = `https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`;

      runFlow('lead_captured', { nombre }).then(() => {
        // DespuÃ©s del flujo, ofrecer ir a WA
        setTimeout(() => {
          const openWaBtn = document.createElement('button');
          openWaBtn.className = 'pc-option-btn';
          openWaBtn.style.borderColor = 'rgba(16,185,129,0.4)';
          openWaBtn.style.color = '#10B981';
          openWaBtn.textContent = 'ðŸ’¬ Enviar alerta al equipo por WhatsApp';
          openWaBtn.onclick = () => window.open(notifLink, '_blank');
          const opts = $('pc-chat-options');
          opts.classList.remove('hidden');
          opts.appendChild(openWaBtn);
        }, 500);
      });
    }
  };

  // â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function init() {
    injectStyles();
    buildWidget();

    // Auto-show teaser despuÃ©s de 4 seg si el usuario no ha interactuado
    setTimeout(() => {
      if (!state.isOpen && !state.hasGreeted) {
        const teaser = $('pc-chat-teaser');
        if (teaser) {
          teaser.style.display = 'block';
          // Auto-hide teaser despuÃ©s de 8 seg
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

