import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, restaurant, whatsapp, problem } = data;

    if (!name || !restaurant || !whatsapp) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const botToken = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured in .env');
      return new Response(
        JSON.stringify({ ok: false, error: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number for direct WhatsApp web link
    const cleanPhone = String(whatsapp).replace(/[^0-9]/g, '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

    const now = new Date().toLocaleString('es-VE', {
      timeZone: 'America/Caracas',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const message = `🚀 <b>Nueva Postulación al Piloto de Precyza</b>

👤 <b>Responsable:</b> ${escapeHtml(name)}
🏢 <b>Restaurante:</b> ${escapeHtml(restaurant)}
📱 <b>WhatsApp:</b> ${waLink ? `<a href="${waLink}">${escapeHtml(whatsapp)}</a>` : escapeHtml(whatsapp)}
🎯 <b>Problema que espera resolver:</b>
${escapeHtml(problem || 'No especificado')}

⏰ <b>Fecha:</b> ${now}`;

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok || !telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      return new Response(
        JSON.stringify({ ok: false, error: telegramData.description || 'Error enviando a Telegram' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error handling pilot lead:', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Error interno procesando la solicitud' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
