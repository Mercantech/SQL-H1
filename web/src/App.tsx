import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthCallback } from "./pages/AuthCallback";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { ModuleDetail } from "./pages/ModuleDetail";
import { Modules } from "./pages/Modules";
import { Database } from "./pages/Database";
import { Playground } from "./pages/Playground";
import { Profile } from "./pages/Profile";
import { Progress } from "./pages/Progress";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="modules" element={<Modules />} />
          <Route path="modules/:slug" element={<ModuleDetail />} />
          <Route path="learn/:slug" element={<Learn />} />
          <Route path="playground" element={<Playground />} />
          <Route path="database" element={<Database />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<Profile />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
