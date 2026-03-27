/* eslint-disable no-undef */
/* eslint-env node */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();

exports.sendTurnoEmails = onDocumentCreated("turnos/{turnoId}", async (event) => {
  const apiKey = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;

  if (!apiKey) {
    logger.error("Falta RESEND_API_KEY");
    return;
  }

  if (!EMAIL_FROM) {
    logger.error("Falta EMAIL_FROM");
    return;
  }

  const resend = new Resend(apiKey);

  const snap = event.data;
  if (!snap) {
    logger.error("No hay snapshot en el evento.");
    return;
  }

  const turno = snap.data();
  const turnoId = event.params.turnoId;

  const clientEmail = turno.client_email;
  const clientName = turno.client_name || "Cliente";
  const clientPhone = turno.client_phone || "-";

  const barberEmail = turno.barbero_email || turno?.barber?.email;
  const barberName = turno?.barber?.name || "Barbero";
  const barberPhone = turno?.barber?.phone || "-";

  const serviceName = turno?.service?.name || "Servicio";
  const servicePrice = turno?.service?.price || "-";
  const serviceDuration =
    turno?.service?.durationLabel || turno?.service?.duration || "-";

  const branchName = turno?.branch?.name || "Sucursal";
  const branchAddress = turno?.branch?.address || "-";

  const date = turno.date || "-";
  const time = turno.time || "-";
  const notes = turno.notes || "Sin notas";
  const status = turno.status || "-";

  const logoUrl =
    "https://firebasestorage.googleapis.com/v0/b/tonsors-club.firebasestorage.app/o/barberos%2Fbarbero_1774476600669_logo-tonsors-dorado.png?alt=media&token=cb5af72d-14ce-45fa-95ad-f8d06cae5f04";

  if (!clientEmail || !barberEmail) {
    logger.error("Faltan emails para enviar el turno.", {
      turnoId,
      clientEmail,
      barberEmail,
    });
    return;
  }

  if (status !== "confirmed") {
    logger.info("El turno no está confirmado, no se envía email.", {
      turnoId,
      status,
    });
    return;
  }

  const cardStyle =
    "font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);";

  const wrapperStyle =
    "margin:0;padding:24px;background:#f7f4ef;";

  const headerHtml = `
    <div style="background:#111111;padding:28px 24px;text-align:center;">
      <img
        src="${logoUrl}"
        alt="Tonsor's Club"
        style="max-width:140px;height:auto;display:block;margin:0 auto;"
      />
    </div>
  `;

  const footerHtml = `
    <div style="padding:18px 24px;background:#f8f8f8;border-top:1px solid #ececec;text-align:center;font-size:12px;color:#666;">
      Este correo fue enviado automáticamente por TonSors Club.<br/>
      ID del turno: ${turno.id || turnoId}
    </div>
  `;

  const customerTableRows = `
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;width:38%;"><strong>Servicio</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${serviceName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Precio</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${servicePrice}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Duración</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${serviceDuration}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Fecha</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${date}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Hora</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${time}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Barbero</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${barberName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Teléfono del barbero</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${barberPhone}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Sucursal</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${branchName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Dirección</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${branchAddress}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;"><strong>Notas</strong></td>
      <td style="padding:12px 14px;">${notes}</td>
    </tr>
  `;

  const barberTableRows = `
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;width:38%;"><strong>Cliente</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${clientName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Teléfono del cliente</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${clientPhone}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Servicio</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${serviceName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Precio</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${servicePrice}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Duración</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${serviceDuration}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Fecha</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${date}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Hora</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${time}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Sucursal</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${branchName}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;border-bottom:1px solid #ece7dd;"><strong>Dirección</strong></td>
      <td style="padding:12px 14px;border-bottom:1px solid #ece7dd;">${branchAddress}</td>
    </tr>
    <tr>
      <td style="padding:12px 14px;background:#faf8f4;"><strong>Notas</strong></td>
      <td style="padding:12px 14px;">${notes}</td>
    </tr>
  `;

  const customerHtml = `
    <div style="${wrapperStyle}">
      <div style="${cardStyle}">
        ${headerHtml}

        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 12px 0;font-size:24px;color:#111111;">
            Tu turno fue confirmado ✂️
          </h2>

          <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;color:#1a1a1a;">
            Hola <strong>${clientName}</strong>, tu reserva fue creada correctamente.
          </p>

          <div style="border:1px solid #ece7dd;border-radius:14px;overflow:hidden;">
            <table style="border-collapse:collapse;width:100%;font-size:14px;color:#1a1a1a;">
              ${customerTableRows}
            </table>
          </div>

          <div style="margin-top:22px;padding:16px 18px;background:#fcf8ef;border:1px solid #f0e3bf;border-radius:12px;">
            <div style="font-size:14px;line-height:1.6;color:#1a1a1a;">
              <strong>Importante:</strong> te recomendamos llegar 5 a 10 minutos antes de tu turno.
            </div>
          </div>
        </div>

        ${footerHtml}
      </div>
    </div>
  `;

  const barberHtml = `
    <div style="${wrapperStyle}">
      <div style="${cardStyle}">
        ${headerHtml}

        <div style="padding:28px 24px;">
          <h2 style="margin:0 0 12px 0;font-size:24px;color:#111111;">
            Nuevo turno asignado 💈
          </h2>

          <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;color:#1a1a1a;">
            Hola <strong>${barberName}</strong>, tienes un nuevo turno confirmado.
          </p>

          <div style="border:1px solid #ece7dd;border-radius:14px;overflow:hidden;">
            <table style="border-collapse:collapse;width:100%;font-size:14px;color:#1a1a1a;">
              ${barberTableRows}
            </table>
          </div>

          <div style="margin-top:22px;padding:16px 18px;background:#fcf8ef;border:1px solid #f0e3bf;border-radius:12px;">
            <div style="font-size:14px;line-height:1.6;color:#1a1a1a;">
              <strong>Recordatorio:</strong> revisa tu agenda para tener este turno presente.
            </div>
          </div>
        </div>

        ${footerHtml}
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: [clientEmail],
      subject: `TonSors Club | Turno confirmado - ${date} ${time}`,
      html: customerHtml,
    });

    await resend.emails.send({
      from: EMAIL_FROM,
      to: [barberEmail],
      subject: `TonSors Club | Nuevo turno asignado - ${date} ${time}`,
      html: barberHtml,
    });

    logger.info("Emails enviados correctamente.", {
      turnoId,
      clientEmail,
      barberEmail,
    });
  } catch (error) {
    logger.error("Error enviando emails con Resend.", {
      turnoId,
      message: error?.message,
      error,
    });
  }
});