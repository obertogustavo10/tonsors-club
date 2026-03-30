const REMEMBERED_PANEL_LOGIN_KEY = "tonsors_panel_login_v1";

export function getRememberedPanelLogin() {
  try {
    const raw = localStorage.getItem(REMEMBERED_PANEL_LOGIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveRememberedPanelLogin(credentials) {
  try {
    localStorage.setItem(
      REMEMBERED_PANEL_LOGIN_KEY,
      JSON.stringify({
        email: credentials?.email || "",
        password: credentials?.password || "",
      })
    );
  } catch {
    // ignore storage errors
  }
}

export function clearRememberedPanelLogin() {
  try {
    localStorage.removeItem(REMEMBERED_PANEL_LOGIN_KEY);
  } catch {
    // ignore storage errors
  }
}
