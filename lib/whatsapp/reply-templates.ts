/**
 * WhatsApp Reply Templates — Bilingual EN/ES
 *
 * All user-facing messages for the WhatsApp AI assistant.
 * Each function returns a string or { text, buttons } for interactive messages.
 */

import type { ExtractedVehicle, WAButton } from './types';

type Lang = 'en' | 'es';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

// ─────────────────────────────────────────────
// Session Flow
// ─────────────────────────────────────────────

export function welcomeMessage(lang: Lang): string {
  return lang === 'es'
    ? `Hola! Soy tu asistente de publicacion de Autos MALL.\n\nEnvia fotos del vehiculo y luego escribe los detalles (marca, modelo, ano, precio, millaje).\n\nYo me encargo del resto!`
    : `Hi! I'm your Autos MALL listing assistant.\n\nSend photos of the vehicle and then write the details (brand, model, year, price, mileage).\n\nI'll take care of the rest!`;
}

export function photoReceived(lang: Lang, count: number): string {
  return lang === 'es'
    ? `Foto recibida! (${count} ${count === 1 ? 'foto' : 'fotos'}). Envia mas fotos o escribe los detalles del vehiculo para continuar.`
    : `Photo received! (${count} ${count === 1 ? 'photo' : 'photos'}). Send more photos or write the vehicle details to continue.`;
}

export function maxImagesReached(lang: Lang): string {
  return lang === 'es'
    ? `Maximo de 10 fotos alcanzado. Ahora escribe los detalles del vehiculo (marca, modelo, ano, precio, millaje).`
    : `Maximum 10 photos reached. Now write the vehicle details (brand, model, year, price, mileage).`;
}

export function extractingMessage(lang: Lang): string {
  return lang === 'es'
    ? `Analizando tus fotos y datos... Un momento.`
    : `Analyzing your photos and data... One moment.`;
}

// ─────────────────────────────────────────────
// Vehicle Confirmation
// ─────────────────────────────────────────────

export function confirmationMessage(
  lang: Lang,
  vehicle: ExtractedVehicle,
  sellerHandle: string
): { text: string; buttons: WAButton[] } {
  const title = `${vehicle.year || '?'} ${vehicle.brand || '?'} ${vehicle.model || '?'}`;
  const trim = vehicle.trim ? ` ${vehicle.trim}` : '';
  const price = vehicle.price ? `$${vehicle.price.toLocaleString('en-US')}` : 'N/A';
  const miles = vehicle.mileage ? `${vehicle.mileage.toLocaleString('en-US')} mi` : 'N/A';
  const color = vehicle.exterior_color || '—';
  const trans = vehicle.transmission || '—';
  const condition = vehicle.condition || '—';
  const bodyType = vehicle.body_type || '—';

  const text = lang === 'es'
    ? `He extraido la siguiente informacion:\n\n*${title}${trim}*\nPrecio: ${price}\nMillaje: ${miles}\nColor: ${color}\nTipo: ${bodyType}\nTransmision: ${trans}\nCondicion: ${condition}\n\nSe creara el listado en tu catalogo: ${sellerHandle}.${APP_DOMAIN}\n\nEs correcto?`
    : `I've extracted the following information:\n\n*${title}${trim}*\nPrice: ${price}\nMileage: ${miles}\nColor: ${color}\nType: ${bodyType}\nTransmission: ${trans}\nCondition: ${condition}\n\nA listing will be created on your catalog: ${sellerHandle}.${APP_DOMAIN}\n\nIs this correct?`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'confirm_yes', title: lang === 'es' ? 'Si, crear' : 'Yes, create' } },
    { type: 'reply', reply: { id: 'confirm_edit', title: lang === 'es' ? 'Editar' : 'Edit' } },
    { type: 'reply', reply: { id: 'confirm_cancel', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

export function missingFieldsMessage(lang: Lang, fields: string[]): string {
  const fieldLabels: Record<string, Record<Lang, string>> = {
    brand: { es: 'Marca', en: 'Brand' },
    model: { es: 'Modelo', en: 'Model' },
    year: { es: 'Ano', en: 'Year' },
    price: { es: 'Precio', en: 'Price' },
    mileage: { es: 'Millaje', en: 'Mileage' },
  };

  const labels = fields.map(f => fieldLabels[f]?.[lang] || f).join(', ');

  return lang === 'es'
    ? `No pude detectar: ${labels}.\n\nPor favor escribe la informacion faltante.`
    : `I couldn't detect: ${labels}.\n\nPlease provide the missing information.`;
}

export function creatingMessage(lang: Lang): string {
  return lang === 'es'
    ? `Creando tu listado... Un momento.`
    : `Creating your listing... One moment.`;
}

// ─────────────────────────────────────────────
// Vehicle Created + Facebook Confirmation
// ─────────────────────────────────────────────

export function vehicleCreatedMessage(
  lang: Lang,
  vehicle: ExtractedVehicle,
  catalogUrl: string
): { text: string; buttons: WAButton[] } {
  const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
  const trim = vehicle.trim ? ` ${vehicle.trim}` : '';
  const price = vehicle.price ? `$${vehicle.price.toLocaleString('en-US')}` : '';
  const miles = vehicle.mileage ? `${vehicle.mileage.toLocaleString('en-US')} mi` : '';

  const details = [price, miles, vehicle.exterior_color, vehicle.transmission]
    .filter(Boolean)
    .join(' | ');

  const text = lang === 'es'
    ? `Tu listado ha sido creado y publicado en tu catalogo!\n\n*${title}${trim}* — ${details}\n\nVer: ${catalogUrl}\n\nDeseas publicarlo tambien en Facebook?`
    : `Your listing has been created and published to your catalog!\n\n*${title}${trim}* — ${details}\n\nView: ${catalogUrl}\n\nWould you like to publish it to Facebook too?`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'fb_yes', title: lang === 'es' ? 'Si, publicar' : 'Yes, publish' } },
    { type: 'reply', reply: { id: 'fb_no', title: lang === 'es' ? 'No, gracias' : 'No, thanks' } },
  ];

  return { text, buttons };
}

export function fbPublishedMessage(lang: Lang): string {
  return lang === 'es'
    ? `Publicado en Facebook exitosamente!\n\nTu vehiculo esta visible en tu catalogo y en Facebook.\n\nEnvia mas fotos para crear otro listado.`
    : `Published to Facebook successfully!\n\nYour vehicle is visible on your catalog and Facebook.\n\nSend more photos to create another listing.`;
}

export function fbSkippedMessage(lang: Lang): string {
  return lang === 'es'
    ? `Entendido! Tu vehiculo esta publicado solo en tu catalogo.\n\nEnvia mas fotos para crear otro listado.`
    : `Got it! Your vehicle is published on your catalog only.\n\nSend more photos to create another listing.`;
}

export function fbErrorMessage(lang: Lang): string {
  return lang === 'es'
    ? `No se pudo publicar en Facebook. Tu vehiculo sigue visible en tu catalogo.\n\nPuedes intentar publicarlo manualmente desde tu perfil.\n\nEnvia mas fotos para crear otro listado.`
    : `Couldn't publish to Facebook. Your vehicle is still visible on your catalog.\n\nYou can try publishing manually from your profile.\n\nSend more photos to create another listing.`;
}

export function fbNotConnectedMessage(lang: Lang): string {
  return lang === 'es'
    ? `Tu vehiculo fue publicado en tu catalogo.\n\nPara publicar en Facebook, conecta tu pagina de Facebook en tu perfil de Autos MALL (seccion "Facebook & WhatsApp").\n\nEnvia mas fotos para crear otro listado.`
    : `Your vehicle has been published to your catalog.\n\nTo publish to Facebook, connect your Facebook page in your Autos MALL profile ("Facebook & WhatsApp" section).\n\nSend more photos to create another listing.`;
}

// ─────────────────────────────────────────────
// Errors & Edge Cases
// ─────────────────────────────────────────────

export function errorMessage(lang: Lang): string {
  return lang === 'es'
    ? `Ocurrio un error al procesar tu solicitud. Por favor intenta de nuevo enviando las fotos.`
    : `An error occurred while processing your request. Please try again by sending the photos.`;
}

export function phoneNotLinkedMessage(lang: Lang): string {
  return lang === 'es'
    ? `Tu numero de WhatsApp no esta vinculado a una cuenta de vendedor.\n\nVe a tu perfil en Autos MALL y vincula tu numero en la seccion "WhatsApp AI".`
    : `Your WhatsApp number is not linked to a seller account.\n\nGo to your profile on Autos MALL and link your number in the "WhatsApp AI" section.`;
}

export function sessionExpiredMessage(lang: Lang): string {
  return lang === 'es'
    ? `Tu sesion anterior expiro. Envia fotos para comenzar un nuevo listado.`
    : `Your previous session expired. Send photos to start a new listing.`;
}

export function editInstructionsMessage(lang: Lang): string {
  return lang === 'es'
    ? `Envia las correcciones como texto. Por ejemplo:\n"Precio: 16000"\n"Ano: 2020"\n"Color: Rojo"\n\nO envia mas fotos si necesitas reemplazarlas.`
    : `Send corrections as text. For example:\n"Price: 16000"\n"Year: 2020"\n"Color: Red"\n\nOr send more photos if you need to replace them.`;
}

export function unsupportedMessageType(lang: Lang): string {
  return lang === 'es'
    ? `Solo acepto fotos y mensajes de texto. Por favor envia fotos del vehiculo.`
    : `I only accept photos and text messages. Please send photos of the vehicle.`;
}
