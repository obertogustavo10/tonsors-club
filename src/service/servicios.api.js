// src/services/servicios.api.js
import {
    createItem,
    updateItem,
    deleteItem,
    getItemById,
    listItems,
} from "./firestore.service";
import { nanoid } from 'nanoid';
const COLLECTION = "servicios";

/** Convierte "$18.000" / "18.000" / "18000" a número 18000 */
function parsePriceToNumber(input) {
    if (input == null) return null;
    const str = String(input).trim();
    if (!str) return null;

    // quita $ y separadores de miles
    const normalized = str.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
}

/** Convierte "45 min" / "1 hrs" / "1 hr" / "90" a minutos */
function parseDurationToMinutes(input) {
    if (input == null) return null;

    // si viene number, asumimos minutos
    if (typeof input === "number") return input;

    const str = String(input).trim().toLowerCase();
    if (!str) return null;

    // "45 min"
    const minMatch = str.match(/(\d+)\s*(min|mins|minute|minutes)/);
    if (minMatch) return Number(minMatch[1]);

    // "1 hrs" / "1 hr" / "2 hours"
    const hrMatch = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)/);
    if (hrMatch) return Number(hrMatch[1]) * 60;

    // "45" -> 45
    const n = Number(str);
    return Number.isFinite(n) ? n : null;
}

/** Formatea 45 -> "45 min" ; 60 -> "1 hrs" */
function formatDurationLabel(minutes) {
    if (!Number.isFinite(minutes) || minutes <= 0) return "";
    if (minutes % 60 === 0) {
        const hrs = minutes / 60;
        return `${hrs} hrs`;
    }
    return `${minutes} min`;
}

/** Formatea 18000 -> "$18.000" (AR style) */
function formatPriceLabel(amount) {
    if (!Number.isFinite(amount)) return "";
    // miles con punto
    const withDots = String(Math.trunc(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `$${withDots}`;
}

/**
 * data esperado:
 * {
 *  title: string,
 *  description?: string,
 *  durationMinutes?: number,
 *  durationLabel?: string,
 *  priceAmount?: number,
 *  priceLabel?: string,
 *  includes?: string[],      // opcional (lista 1., 2.)
 *  moreInfo?: string,        // opcional (texto largo o url)
 *  isActive?: boolean,
 *  sortOrder?: number,       // opcional para ordenar en UI
 * }
 */
export async function createServicio({ data }) {
    const title = (data?.title || "").trim();
    if (!title) throw new Error("Servicio: title is required");

    // duration
    const durationMinutes =
        Number.isFinite(data?.durationMinutes)
            ? data.durationMinutes
            : parseDurationToMinutes(data?.durationLabel);

    const durationLabel =
        (data?.durationLabel || "").trim() ||
        (durationMinutes ? formatDurationLabel(durationMinutes) : "");

    // price
    const priceAmount =
        Number.isFinite(data?.priceAmount)
            ? data.priceAmount
            : parsePriceToNumber(data?.priceLabel);

    const priceLabel =
        (data?.priceLabel || "").trim() ||
        (Number.isFinite(priceAmount) ? formatPriceLabel(priceAmount) : "");
    const id = nanoid();
    const payload = {
        id,
        name: title,
        description: (data?.description || ""),
        duration: data?.duration || null,

        durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
        durationLabel,
        priceAmount: Number.isFinite(priceAmount) ? priceAmount : null,
        price: priceLabel,
        includes: Array.isArray(data?.includes) ? data.includes.filter(Boolean) : [],
        moreInfo: data?.moreInfo ?? "",
        isActive: data?.isActive ?? true,
        sortOrder: Number.isFinite(data?.sortOrder) ? data.sortOrder : 0,
    };

    return createItem(COLLECTION, payload);
}

export async function updateServicio({ id, data }) {
    if (!id) throw new Error("Servicio: id is required");

    const patch = { ...data };

    if (typeof data?.title === "string") {
        const cleanTitle = data.title.trim();
        patch.title = cleanTitle;
        patch.name = cleanTitle;
    }
    if (typeof data?.description === "string") patch.description = data.description.trim();

    // si actualizan durationLabel o durationMinutes, recalculamos consistencia
    if (data?.durationLabel != null || data?.durationMinutes != null) {
        const durationMinutes =
            Number.isFinite(data?.durationMinutes)
                ? data.durationMinutes
                : parseDurationToMinutes(data?.durationLabel);

        patch.durationMinutes = Number.isFinite(durationMinutes) ? durationMinutes : null;
        patch.duration = Number.isFinite(durationMinutes) ? durationMinutes : null;

        const durationLabel =
            (typeof data?.durationLabel === "string" && data.durationLabel.trim()) ||
            (Number.isFinite(durationMinutes) ? formatDurationLabel(durationMinutes) : "");

        patch.durationLabel = durationLabel;
    }

    // si actualizan priceLabel o priceAmount, recalculamos consistencia
    if (data?.priceLabel != null || data?.priceAmount != null) {
        const priceAmount =
            Number.isFinite(data?.priceAmount)
                ? data.priceAmount
                : parsePriceToNumber(data?.priceLabel);

        patch.priceAmount = Number.isFinite(priceAmount) ? priceAmount : null;

        const priceLabel =
            (typeof data?.priceLabel === "string" && data.priceLabel.trim()) ||
            (Number.isFinite(priceAmount) ? formatPriceLabel(priceAmount) : "");

        patch.priceLabel = priceLabel;
        patch.price = priceLabel;
    }

    if (Array.isArray(data?.includes)) patch.includes = data.includes.filter(Boolean);

    return updateItem(COLLECTION, id, patch);
}

export async function deleteServicio(id) {
    return deleteItem(COLLECTION, id);
}

export async function getServicio(id) {
    return getItemById(COLLECTION, id);
}

export async function listServicios() {
  return listItems(COLLECTION);
}

export function getServiceDurationMinutes(service) {
  if (!service) return null;

  if (Number.isFinite(service?.durationMinutes)) {
    return service.durationMinutes;
  }

  if (Number.isFinite(service?.duration)) {
    return service.duration;
  }

  return parseDurationToMinutes(service?.durationLabel || service?.duration);
}
