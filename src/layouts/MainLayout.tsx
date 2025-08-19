// src/layouts/MainLayout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./MainLayout.module.scss";

const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
   const bare =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth");
  return (
    <div className={styles.shell}>
      {!bare && <Header />}
      <main className={styles.main}>{children}</main>
      {!bare && <Footer />}
    </div>
  );
};

export default MainLayout;