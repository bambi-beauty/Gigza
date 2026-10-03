// src/services/translationService.js
const MEMORY_API = "https://api.mymemory.translated.net/get";
const CACHE_KEY = "gigza:translationCache";
const CACHE_VERSION = "v2";
const memoryCache = new Map();

/* Fallback dictionary — used when MyMemory is rate-limited or offline */
const FALLBACK = {
  fr: {
    "Profile": "Profil",
    "User Information": "Informations utilisateur",
    "My Bookings": "Mes réservations",
    "Favourite DJs": "DJs favoris",
    "Become a DJ": "Devenir DJ",
    "Settings": "Paramètres",
    "Notifications": "Notifications",
    "Appearance": "Apparence",
    "Privacy & Security": "Confidentialité et sécurité",
    "Help & Support": "Aide et assistance",
    "About Gigza": "À propos de Gigza",
    "Log Out": "Se déconnecter",
    "Delete Account": "Supprimer le compte",
    "Save Changes": "Enregistrer les modifications",
    "Cancel": "Annuler",
    "Save": "Enregistrer",
    "Book now": "Réserver",
    "Write a review": "Écrire un avis",
    "Reviews": "Avis",
    "Overview": "Aperçu",
    "Equipment": "Équipement",
    "Event date": "Date de l'événement",
    "Start time": "Heure de début",
    "Duration": "Durée",
    "Estimated total": "Total estimé",
    "Rate": "Tarif",
    "Available now": "Disponible maintenant",
    "Choose Theme": "Choisir un thème",
    "Choose Your Language": "Choisissez votre langue",
    "Font Size": "Taille de police",
    "Font Family": "Police",
    "Home": "Accueil",
    "Search": "Rechercher",
    "Filters": "Filtres",
    "Verified": "Vérifié",
    "Compare": "Comparer",
    "Quick view": "Aperçu rapide",
    "View profile": "Voir le profil",
  },
  es: {
    "Profile": "Perfil",
    "User Information": "Información del usuario",
    "My Bookings": "Mis reservas",
    "Favourite DJs": "DJs favoritos",
    "Become a DJ": "Conviértete en DJ",
    "Settings": "Ajustes",
    "Notifications": "Notificaciones",
    "Appearance": "Apariencia",
    "Privacy & Security": "Privacidad y seguridad",
    "Help & Support": "Ayuda y soporte",
    "About Gigza": "Acerca de Gigza",
    "Log Out": "Cerrar sesión",
    "Delete Account": "Eliminar cuenta",
    "Save Changes": "Guardar cambios",
    "Cancel": "Cancelar",
    "Save": "Guardar",
    "Book now": "Reservar",
    "Write a review": "Escribir una reseña",
    "Reviews": "Reseñas",
    "Overview": "Descripción general",
    "Equipment": "Equipo",
    "Event date": "Fecha del evento",
    "Start time": "Hora de inicio",
    "Duration": "Duración",
    "Estimated total": "Total estimado",
    "Rate": "Tarifa",
    "Available now": "Disponible ahora",
    "Choose Theme": "Elegir tema",
    "Choose Your Language": "Elige tu idioma",
    "Font Size": "Tamaño de fuente",
    "Font Family": "Fuente",
    "Home": "Inicio",
    "Search": "Buscar",
    "Filters": "Filtros",
    "Verified": "Verificado",
    "Compare": "Comparar",
    "Quick view": "Vista rápida",
    "View profile": "Ver perfil",
  },
  de: {
    "Profile": "Profil",
    "User Information": "Benutzerinformationen",
    "My Bookings": "Meine Buchungen",
    "Favourite DJs": "Lieblings-DJs",
    "Become a DJ": "DJ werden",
    "Settings": "Einstellungen",
    "Notifications": "Benachrichtigungen",
    "Appearance": "Aussehen",
    "Privacy & Security": "Datenschutz & Sicherheit",
    "Help & Support": "Hilfe & Support",
    "About Gigza": "Über Gigza",
    "Log Out": "Abmelden",
    "Delete Account": "Konto löschen",
    "Save Changes": "Änderungen speichern",
    "Cancel": "Abbrechen",
    "Save": "Speichern",
    "Book now": "Jetzt buchen",
    "Write a review": "Bewertung schreiben",
    "Reviews": "Bewertungen",
    "Overview": "Übersicht",
    "Equipment": "Ausrüstung",
    "Event date": "Veranstaltungsdatum",
    "Start time": "Startzeit",
    "Duration": "Dauer",
    "Estimated total": "Geschätzter Gesamtbetrag",
    "Rate": "Preis",
    "Available now": "Jetzt verfügbar",
    "Choose Theme": "Theme wählen",
    "Choose Your Language": "Wähle deine Sprache",
    "Font Size": "Schriftgröße",
    "Font Family": "Schriftart",
    "Home": "Startseite",
    "Search": "Suchen",
    "Filters": "Filter",
    "Verified": "Verifiziert",
    "Compare": "Vergleichen",
    "Quick view": "Schnellansicht",
    "View profile": "Profil ansehen",
  },
  pt: {
    "Profile": "Perfil",
    "My Bookings": "Minhas reservas",
    "Settings": "Configurações",
    "Book now": "Reservar",
    "Cancel": "Cancelar",
    "Save": "Salvar",
    "Home": "Início",
    "Search": "Pesquisar",
  },
};

try {
  const storedVersion = localStorage.getItem(`${CACHE_KEY}:version`);
  if (storedVersion !== CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(`${CACHE_KEY}:version`, CACHE_VERSION);
  } else {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    Object.entries(raw).forEach(([k, v]) => memoryCache.set(k, v));
  }
} catch {}

function persist() {
  try {
    const obj = {};
    memoryCache.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

function isWarning(text) {
  if (!text) return true;
  return /MYMEMORY WARNING|QUOTA|TOO MANY REQUESTS/i.test(text);
}

export async function translateText(text, targetLang, sourceLang = "en") {
  if (!text || targetLang === sourceLang) return text;
  const key = `${sourceLang}:${targetLang}:${text}`;

  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    if (!isWarning(cached)) return cached;
    memoryCache.delete(key);
  }

  try {
    const url = `${MEMORY_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    if (translated && !isWarning(translated)) {
      memoryCache.set(key, translated);
      persist();
      return translated;
    }
  } catch (e) {
    console.warn("Translation API error:", e);
  }

  const fallback = FALLBACK[targetLang]?.[text];
  if (fallback) {
    memoryCache.set(key, fallback);
    persist();
    return fallback;
  }

  return text;
}