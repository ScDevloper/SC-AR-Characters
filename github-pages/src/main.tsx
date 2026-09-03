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
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, ""));

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.replace(/^#\/?/, ""));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

function PagesApp() {
  if (useHashRoute() === "qr") return <QrSheetPage />;

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
