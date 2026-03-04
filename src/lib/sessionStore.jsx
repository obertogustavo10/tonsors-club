const KEY = "booking_mock_v1";

export function getBooking() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setBooking(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearBooking() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function getInitialBooking() {
  return (
    getBooking() || {
      branch: null,
      service: null,
      date: null,
      time: null,
      barber: null,
      autoAssign: false,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
    }
  );
}