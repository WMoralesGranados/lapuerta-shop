import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const { pathname, search, hash, state } = useLocation();
  const conservarScroll = (state as { keepScroll?: boolean } | null)?.keepScroll === true;

  useEffect(() => {
    if (conservarScroll) return;

    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }

    if (new URLSearchParams(search).has("categoria")) {
      document.getElementById("catalogo")?.scrollIntoView();
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, search, hash, conservarScroll]);

  return null;
}
