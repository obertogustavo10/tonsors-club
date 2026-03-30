import { useCallback, useEffect, useMemo, useState } from "react";

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isIOS, setIsIOS] = useState(isIOSDevice);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const standaloneMediaQuery = window.matchMedia?.("(display-mode: standalone)");

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstalled(isStandaloneMode());
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstalling(false);
    };

    const handleStandaloneChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    standaloneMediaQuery?.addEventListener?.("change", handleStandaloneChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      standaloneMediaQuery?.removeEventListener?.("change", handleStandaloneChange);
    };
  }, []);

  useEffect(() => {
    setIsIOS(isIOSDevice());
    setIsInstalled(isStandaloneMode());
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt || isIOS || isInstalled) {
      return null;
    }

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return choice;
    } finally {
      setIsInstalling(false);
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  return useMemo(
    () => ({
      isIOS,
      isInstalled,
      isInstalling,
      canPromptInstall: Boolean(deferredPrompt) && !isIOS && !isInstalled,
      shouldShowIOSFallback: isIOS && !isInstalled,
      promptInstall,
    }),
    [deferredPrompt, isIOS, isInstalled, isInstalling, promptInstall]
  );
}
