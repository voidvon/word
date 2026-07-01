import { createHashRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { HomePage } from "./views/HomePage";
import { WdBookHomePage } from "./views/WdBookHomePage";
import { WordDetailPage } from "./views/WordDetailPage";
import { WdBookDetailPage } from "./views/WdBookDetailPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "word",
        element: <WordDetailPage />,
      },
      {
        path: "wdbook",
        element: <WdBookHomePage />,
      },
      {
        path: "wdbook/:bookId",
        element: <WdBookDetailPage />,
      },
    ],
  },
]);
