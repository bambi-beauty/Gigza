// src/hooks/useTranslation.js
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translateText } from "../services/translationService";

const STRINGS = {
  // ─── Common / generic ────────────────────────────────────────
  loading: "Loading...",
  search: "Search",
  cancel: "Cancel",
  save: "Save",
  saveChanges: "Save Changes",
  clear: "Clear",
  close: "Close",
  remove: "Remove",
  viewAll: "View all",
  tryAgain: "Try again",
  yes: "Yes",
  no: "No",
  user: "User",
  dj: "DJ",
  djs: "DJs",
  selected: "selected",
  aClient: "A client",
  undo: "Undo",
  refresh: "Refresh",
  urgent: "Urgent",
  dismiss: "Dismiss",
  unreadLower: "unread",
  back: "Back",
  live: "Live",

  // ─── TopNav ──────────────────────────────────────────────────
  discover: "Discover",
  bookings: "Bookings",
  navNotifications: "Notifications",
  gigRequests: "Gig Requests",
  earnings: "Earnings",
  emergencyDJ: "Emergency DJ",
  profile: "Profile",

  // ─── Profile screen ──────────────────────────────────────────
  userInfo: "User Information",
  myBookings: "My Bookings",
  favouriteDJs: "Favourite DJs",
  becomeDJ: "Become a DJ",
  settings: "Settings",
  notifications: "Notifications",
  appearance: "Appearance",
  privacy: "Privacy & Security",
  helpSupport: "Help & Support",
  aboutGigza: "About Gigza",
  logOut: "Log Out",
  deleteAccount: "Delete Account",
  writeReview: "Write a review",
  reviews: "Reviews",
  overview: "Overview",
  equipment: "Equipment",
  eventDate: "Event date",
  startTime: "Start time",
  duration: "Duration",
  estimatedTotal: "Estimated total",
  rate: "Rate",
  availableNow: "Available now",
  chooseTheme: "Choose Theme",
  chooseLanguage: "Choose Your Language",
  fontSize: "Font Size",
  fontFamily: "Font Family",
  myProfile: "My profile",
  myBookingsShort: "My bookings",
  emergencySOS: "Emergency SOS",

  // ─── Home screen — hero ──────────────────────────────────────
  heroTitle: "Book the right DJ for your event",
  heroSubtitle: "Compare rates and reviews, then book DJs for weddings, parties and corporate events.",
  searchPlaceholder: "Search by name, genre or style",
  searchDJs: "Search DJs",
  clearDate: "Clear date",
  showingDJsFreeOn: "Showing DJs free on",
  djsListed: "DJs listed",
  averageRating: "Average rating",

  // ─── Home screen — sections ──────────────────────────────────
  needDJTonight: "Need a DJ tonight?",
  needDJTonightSub: "These DJs are free right now.",
  browseByGenre: "Browse by genre",
  djOfTheWeek: "DJ of the week",
  trendingDJs: "Trending DJs",
  trendingDJsSub: "Most popular right now",
  yourFavorites: "Your favorites",
  allDJs: "All DJs",
  whatClientsSaying: "What clients are saying",
  howBookingWorks: "How booking works",

  // ─── Home screen — filters ───────────────────────────────────
  filters: "Filters",
  availableNowFilter: "Available now",
  verifiedOnly: "Verified only",
  djsFound: "DJs found",
  priceRange: "Price range (per hour)",
  min: "Min",
  max: "Max",
  resetFilters: "Reset filters",

  // ─── Home screen — sort ──────────────────────────────────────
  sortTopRated: "Top rated",
  sortPriceLow: "Price: low to high",
  sortPriceHigh: "Price: high to low",
  sortName: "Name A to Z",
  sortDJs: "Sort DJs",

  // ─── Cards / buttons ─────────────────────────────────────────
  quickView: "Quick view",
  viewProfile: "View profile",
  viewFullProfile: "View full profile",
  profileShort: "Profile",
  bookNow: "Book now",
  book: "Book",
  bookFrom: "Book from",
  message: "Message",
  compare: "Compare",
  addToCompare: "Add to compare",
  compareUpTo: "You can compare up to",
  compareDJs: "Compare DJs",
  removeFromFavorites: "Remove from favorites",
  addToFavorites: "Add to favorites",

  // ─── Compare modal ───────────────────────────────────────────
  pricePerHour: "Price per hour",
  price: "Price",
  rating: "Rating",
  reviewsLower: "reviews",
  verified: "Verified",
  experience: "Experience",
  professional: "Professional",
  professionalDJ: "Professional DJ",
  worldwide: "Worldwide",
  perHour: "/ hour",
  perHourShort: "/hr",
  location: "Location",
  genre: "Genre",

  // ─── Empty / error ───────────────────────────────────────────
  noDJsFound: "No DJs found",
  noDJsOnDate: "No DJs are listed as free on",
  tryAnotherDate: "Try another date or loosen your filters.",
  tryDifferentSearch: "Try a different search or loosen your filters.",
  clearAllFilters: "Clear all filters",
  failedToLoadDJs: "Failed to load DJs. Please try again later.",

  // ─── Genre labels ────────────────────────────────────────────
  genreAll: "All",
  genreElectronic: "Electronic",
  genreHipHop: "Hip Hop",
  genreHouse: "House",
  genreTechno: "Techno",
  genreRnB: "R&B",
  genrePop: "Pop",
  genreRock: "Rock",
  genreLatin: "Latin",
  genreJazz: "Jazz",

  // ─── Budget ──────────────────────────────────────────────────
  budgetUnder300: "Under R300",
  budget300To700: "R300 to R700",
  budget700Plus: "R700+",

  // ─── How it works ────────────────────────────────────────────
  howStep1Title: "Find your DJ",
  howStep1Body: "Search by genre, budget and date, and preview mixes before you decide.",
  howStep2Title: "Message and confirm",
  howStep2Body: "Ask about your venue, set times and requests, then agree the details.",
  howStep3Title: "Book and enjoy",
  howStep3Body: "Send your booking request and get back to planning the rest of your event.",

  // ─── Misc UI ─────────────────────────────────────────────────
  pickAtLeastTwo: "(pick at least 2)",
  clearComparison: "Clear comparison",
  switchToList: "Switch to list view",
  switchToGrid: "Switch to grid view",

  // ─── Notifications screen ────────────────────────────────────
  notificationsTitle: "Notifications",
  loadingNotifications: "Loading notifications",
  markAsRead: "Mark as read",
  deleteNotification: "Delete notification",
  showEverything: "Show everything",
  thatsEverything: "That's everything.",
  needsAttention: "Needs your attention",
  markAllAsRead: "Mark all as read",
  markingAll: "Marking...",
  filterByReadState: "Filter by read state",

  // Notifications — session / errors
  sessionExpiredTitle: "Session expired",
  sessionExpiredBody: "Log in again to see your notifications.",
  loginAction: "Log in",
  loadErrorTitle: "Couldn't load notifications",
  notifNoPermission: "You don't have permission to view notifications.",
  notifLoadFailed: "Couldn't load notifications.",
  notifLoadError: "Failed to load notifications",
  notifMarkReadFailed: "Couldn't mark that as read.",
  notifMarkAllFailed: "Couldn't mark everything as read.",
  notifDeleteFailed: "Couldn't delete that notification, so we've put it back.",
  notifDeleted: "Notification deleted",

  // Notifications — subline
  sublineExpired: "Session expired",
  sublineLoaded: "Stay updated with your bookings",
  sublineCaughtUp: "You're all caught up",
  sublineKeepStreak: "Clear your inbox today to keep your {n}-day streak",
  sublineUnread: "{n} unread",
  sublineUnreadAttention: "{unread} unread, {attention} need your attention",

  // Notifications — empty states
  emptyUnreadTitle: "Nothing unread",
  emptyUnreadBody: "New booking requests, messages and payments will show up here as they happen.",
  emptyReadTitle: "Nothing read yet",
  emptyReadBody: "Notifications you open will be kept here.",
  emptyCategoryTitle: "No {label} notifications",
  emptyCategoryBody: "Try another category to see everything else.",
  emptyAllTitle: "No notifications yet",
  emptyAllBody: "We'll let you know when a booking, payment or message needs you.",

  // Notifications — streak / celebration
  inboxCleared: "Inbox cleared",
  inboxClearedStreak: "{n} days in a row. Come back tomorrow to keep it going.",
  inboxClearedSolo: "Nice work. We'll let you know when something new comes in.",
  streakTooltip: "{n} days in a row you've been caught up",

  // Notifications — new arrivals banner
  showOneNew: "Show {n} new notification",
  showManyNew: "Show {n} new notifications",

  // Notifications — time labels
  timeJustNow: "Just now",
  timeMinutesShort: "m ago",
  timeHoursShort: "h ago",
  timeDaysShort: "d ago",
  timeWeeksShort: "w ago",
  timeMonthsShort: "mo ago",
  dayToday: "Today",
  dayYesterday: "Yesterday",
  dayEarlier: "Earlier",

  // Notifications — categories
  catAll: "All",
  catBookings: "Bookings",
  catPayments: "Payments",
  catMessages: "Messages",
  catReviews: "Reviews",
  catUpdates: "Updates",

  // Notifications — filters
  filterAll: "All",
  filterUnread: "Unread",
  filterRead: "Read",

  // Notifications — type labels
  notifTypeBookingCreated: "New booking",
  notifTypeBookingConfirmed: "Booking confirmed",
  notifTypeBookingCancelled: "Booking cancelled",
  notifTypeBookingRescheduled: "Booking rescheduled",
  notifTypeBookingUpdated: "Booking updated",
  notifTypeBookingCompleted: "Booking completed",
  notifTypePaymentReceived: "Payment received",
  notifTypePaymentFailed: "Payment failed",
  notifTypePaymentRefunded: "Payment refunded",
  notifTypeAppSubmitted: "Application submitted",
  notifTypeAppApproved: "Application approved",
  notifTypeAppRejected: "Application rejected",
  notifTypeNewMessage: "New message",
  notifTypeNewReview: "New review",
  notifTypeReviewRequest: "Review request",
  notifTypeSystemAlert: "System alert",
  notifTypeReminder: "Reminder",
  notifTypePromotion: "Promotion",
  notificationFallback: "Notification",

  // Notifications — CTA labels
  notifCtaReviewBooking: "Review booking",
  notifCtaViewBooking: "View booking",
  notifCtaSeeDetails: "See details",
  notifCtaCheckTime: "Check the new time",
  notifCtaViewPayment: "View payment",
  notifCtaFixPayment: "Fix payment",
  notifCtaViewApplication: "View application",
  notifCtaReply: "Reply",
  notifCtaReadReview: "Read review",
  notifCtaLeaveReview: "Leave a review",
  notifCtaLearnMore: "Learn more",
  notifCtaOpen: "Open",
  notifCtaTakeLook: "Take a look",

  // ─── Booking management screen ───────────────────────────────
  myBookingsTitle: "My bookings",
  myBookingsSubtitle: "Manage your upcoming events.",
  backToDJs: "Back to DJs",
  liveUpdatesOn: "Live updates on",
  connectingLiveUpdates: "Connecting to live updates",
  findDJ: "Find a DJ",

  // Status labels
  statusConfirmed: "Confirmed",
  statusPending: "Pending",
  statusCancelled: "Cancelled",
  statusCompleted: "Completed",

  // Tabs
  tabUpcoming: "Upcoming",
  tabCompleted: "Completed",
  tabCancelled: "Cancelled",
  tabAll: "All",

  // Booking card
  totalPrice: "Total price",
  leaveReview: "Leave review",
  cancelBooking: "Cancel booking",
  viewDJProfile: "View DJ profile",
  hour: "hour",
  hours: "hours",
  durationTBD: "Duration TBD",
  guest: "guest",
  guests: "guests",
  dateTBD: "Date TBD",
  timeTBD: "Time TBD",

  // Cancel dialog
  cancelDialogTitle: "Cancel this booking?",
  cancelDialogBodyPre: "Your booking with",
  cancelDialogBodyOn: "on",
  cancelDialogBodyPost: "will be cancelled. Cancellations may be subject to fees.",
  keepBooking: "Keep booking",
  yesCancel: "Yes, cancel it",

  // Booking empty states
  emptyUpcomingTitle: "No upcoming bookings",
  emptyUpcomingBody: "You haven't scheduled any DJs yet.",
  emptyCompletedTitle: "No completed events yet",
  emptyCompletedBody: "Finished events will show up here so you can leave a review.",
  emptyCancelledTitle: "No cancelled bookings",
  emptyCancelledBody: "Anything you cancel will be listed here.",
  emptyAllTitle: "No bookings yet",
  emptyAllBody: "You haven't scheduled any DJs yet.",

  // Booking errors
  loginToViewBookings: "Please log in to view your bookings.",
  bookingsLoadFailed: "Failed to load bookings. Please try again.",
  sessionExpiredMsg: "Session expired. Please log in again.",
  noPermissionBookings: "You don't have permission to view bookings.",
  bookingsServiceNotFound: "Bookings service not found. Please try again later.",
  networkError: "Cannot connect to the server. Check your internet connection.",
  bookingCancelFailed: "Failed to cancel booking. Please try again.",
  noPermissionCancel: "You don't have permission to cancel this booking.",
  bookingNotFound: "Booking not found. It may have already been cancelled.",
  noNotificationsYet: "No notifications yet",

  // ─── Emergency DJ screen ─────────────────────────────────────
  emergencyTitle: "Emergency DJ",
  emergencyIntro: "Hit broadcast to alert DJs in your area immediately.",
  broadcastSOS: "Broadcast SOS",
  processing: "Processing...",
  searchingForDJs: "Searching for DJs...",
  connectingWithDJs: "Connecting you with available DJs in your area",
  cancelRequest: "Cancel Request",
  djEnRoute: "DJ En Route",
  arrivingNow: "Arriving Now!",
  enRoute: "En Route",
  enRouteMin: "En Route • {n} min",
  tracking: "Tracking...",
  estimatedArrival: "Estimated Arrival",
  emergencyRate: "Emergency Rate",
  mins: "Mins",
  minShort: "min",
  viewBookingDetails: "View Booking Details",
  emergencyCompleted: "Emergency Completed!",
  emergencyCompletedBody: "Your emergency request has been completed.",
  redirectingToHistory: "Redirecting to history...",
  yourLocation: "Your Location",
  loadingMap: "Loading map...",
  djGeneric: "DJ",

  // Emergency — status / auth
  loadingYourProfile: "Loading your profile...",
  findingYourLocation: "Finding your location...",
  gettingYourLocation: "Getting your location...",
  waitingForLocation: "Waiting for location...",
  loginForEmergency: "Please login to use emergency services.",
  sessionExpiredLogin: "Session expired. Please login again.",
  apiRequestFailed: "API request failed",

  // Emergency — location errors
  geoNotSupported: "Geolocation not supported by your browser.",
  geoDenied: "Location access denied. Using approximate location.",

  // Emergency — request errors
  createEmergencyFailed: "Failed to create emergency request",
  cancelEmergencyFailed: "Failed to cancel emergency",
  noDJsAvailable: "No DJs available in your area. Please try again.",
  emergencyTimedOut: "Emergency request timed out. Please try again.",
  emergencyCancelledMsg: "Emergency request cancelled",
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem("gigza:lang") || "en"; } catch { return "en"; }
  });
  const [dict, setDict] = useState(STRINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (lang === "en") {
        setDict(STRINGS);
        setLoading(false);
        return;
      }
      setLoading(true);
      const entries = Object.entries(STRINGS);
      const translated = await Promise.all(
        entries.map(async ([k, v]) => {
          try {
            const result = await translateText(v, lang);
            return [k, result];
          } catch {
            return [k, v];
          }
        })
      );
      if (!cancelled) {
        setDict(Object.fromEntries(translated));
        setLoading(false);
      }
    }
    load();
    try { localStorage.setItem("gigza:lang", lang); } catch {}
    return () => { cancelled = true; };
  }, [lang]);

  const t = useCallback((key) => dict[key] ?? STRINGS[key] ?? key, [dict]);

  return (
    <I18nContext.Provider value={{ t, lang, setLang, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
};

export { STRINGS };