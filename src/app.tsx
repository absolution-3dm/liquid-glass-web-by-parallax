"use client";

import { Analytics } from "@vercel/analytics/react";
import { AnimatePresence } from "motion/react";
import { Playground } from "./playground";
import { CustomizePage } from "./playground/customize-page";
import { Router, useRouter } from "./playground/router";

function AppRoutes() {
  const { path } = useRouter();

  return (
    <AnimatePresence mode="wait" initial>
      {path === "/customize" ? (
        <CustomizePage key="/customize" />
      ) : (
        <Playground key="/" />
      )}
    </AnimatePresence>
  );
}

export function App() {
  return (
    <Router>
      <AppRoutes />
      <Analytics />
    </Router>
  );
}
