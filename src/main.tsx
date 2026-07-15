import React from "react";
import { unstableSetRender } from "antd-mobile";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "antd-mobile/es/global";
import "./styles.css";

const imperativeRoots = new WeakMap<Element | DocumentFragment, Root>();

unstableSetRender((node, container) => {
  const root = imperativeRoots.get(container) ?? createRoot(container);
  imperativeRoots.set(container, root);
  root.render(node);

  return async () => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    root.unmount();
    imperativeRoots.delete(container);
  };
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
