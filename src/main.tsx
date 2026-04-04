import React from "react";
import ReactDOM from "react-dom/client";
import { UpdateChecker } from "-/components/update-checker";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <p className="font-bold">Hello!</p>
    <UpdateChecker />
  </React.StrictMode>,
);
