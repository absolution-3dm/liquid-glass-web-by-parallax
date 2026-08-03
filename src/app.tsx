"use client";

import { Playground } from "./playground";
import { CustomizePage } from "./playground/customize-page";
import { Router, useRouter } from "./playground/router";

function AppRoutes() {
  const { path } = useRouter();

  if (path === "/customize") {
    return <CustomizePage />;
  }

  return <Playground />;
}

export function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
