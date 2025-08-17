// src/router/Router.tsx
import React, { useEffect, useMemo, useState } from "react";
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import Product from "@/pages/Product";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Payment from "@/pages/Payment";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";

type Route = { path: string; element: React.ReactNode };

const routes: Route[] = [
  { path: "/", element: <Home /> },
  { path: "/catalog", element: <Catalog /> },
  { path: "/product/:slug", element: <Product /> },
  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/payment", element: <Payment /> },
  { path: "/profile", element: <Profile /> },
  { path: "/auth", element: <Auth /> },
];

// --- tiny matcher like before ---
function match(path: string, route: string): null | Record<string, string> {
  const paramNames: string[] = [];
  const regex = new RegExp(
    "^" +
      route
        .replace(/\/:([^/]+)/g, (_m, p1) => {
          paramNames.push(p1);
          return "/([^/]+)";
        })
        .replace(/\//g, "\\/") +
      "$"
  );
  const m = path.match(regex);
  if (!m) return null;
  const params: Record<string, string> = {};
  paramNames.forEach((name, i) => (params[name] = decodeURIComponent(m[i + 1])));
  return params;
}

// --- programmatic navigation ---
export const navigate = (to: string) => {
  if (to !== window.location.pathname) {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};

// --- Link component using History API ---
export const Link: React.FC<
  React.PropsWithChildren<{ to: string; className?: string; onClick?: () => void }>
> = ({ to, children, className, onClick }) => {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        onClick?.();
        // allow new tab / modifiers / middle click
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};

export const useRoute = () => {
  const [path, setPath] = useState<string>(window.location.pathname || "/");

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const route = useMemo(() => {
    for (const r of routes) {
      const params = match(path, r.path);
      if (params) return { element: r.element, params };
    }
    return { element: <NotFound />, params: {} as Record<string, string> };
  }, [path]);

  return route;
};

export const Router: React.FC = () => {
  const { element } = useRoute();
  return <>{element}</>;
};
