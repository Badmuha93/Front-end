import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createInitialState } from "./rules";
import { loadState } from "./storage";
import "./style.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Не найден элемент root");

const initialState = loadState() ?? createInitialState();

createRoot(root).render(
  <StrictMode>
    <App initialState={initialState} />
  </StrictMode>,
);
