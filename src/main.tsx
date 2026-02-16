import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Open /public/index.html is served by the Worker</h1>
      <p>
        This Vite entry is kept minimal. The actual UI lives in <code>public/index.html</code>.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
