// src/layouts/MainLayout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./MainLayout.module.scss";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
   const bare =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth");
  return (
    <div className={styles.shell}>
      {!bare && <Header />}
      <main className={styles.main}>
        <Outlet />
      </main>
      {!bare && <Footer />}
    </div>
  );
};
