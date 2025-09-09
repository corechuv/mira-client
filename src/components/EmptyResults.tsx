import React, { useEffect, useState } from "react";
import Loader from "./Loader";

type Props = {
  message: React.ReactNode;
  loadingLabel?: React.ReactNode;
  delayMs?: number;    // сколько держать лоадер до показа empty
  className?: string;
};

export default function EmptyResults({
  message,
  loadingLabel = "Ищем товары…",
  delayMs = 700,
  className
}: Props) {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setShowMessage(false);
    const id = setTimeout(() => setShowMessage(true), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);

  return (
    <div className={`card ${className || ""}`} style={{ padding: "1rem" }}>
      {showMessage ? message : <Loader label={loadingLabel} />}
    </div>
  );
}
