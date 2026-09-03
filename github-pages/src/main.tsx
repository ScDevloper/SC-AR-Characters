import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import ArPage from "../../app/ar/page";
import QrSheetPage from "../../app/qr/page";
import "../../app/globals.css";
import "./pages.css";

/**
 * GitHub Pages is static hosting - it cannot route `/qr` to an SPA without a
 * 404.html redirect trick. Hash routes always resolve, so `#/qr` is the
 * reliable way to ship a second page here.
 *
 * The query string is independent of the hash, so a QR encoding
 * `.../SC-AR-Characters/?model=press` still lands on the AR view with that
 * character already selected.
 */
function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash) return hash;

  // Paths like /SC-AR-Characters/qr are served by 404.html (see the Pages vite
  // config), so the pathname still carries the route the user asked for.
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  const path = window.location.pathname.replace(base, "").replace(/^\/+|\/+$/g, "");
  return path;
}

function useRoute() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  return route;
}

function PagesApp() {
  if (useRoute() === "qr") return <QrSheetPage />;

  return (
    <div className="github-pages-ar">
      <ArPage />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PagesApp />
  </React.StrictMode>,
);
