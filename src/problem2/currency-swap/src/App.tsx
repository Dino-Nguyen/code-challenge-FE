import SwapForm from "./components/SwapForm";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>💱 Currency Swap</h1>
        <p>Swap assets quickly with real-time prices.</p>
      </header>
      <main className="app-main">
        <SwapForm />
      </main>
      <footer className="app-footer">
        <small>
          Prices via{" "}
          <a href="https://interview.switcheo.com/prices.json" target="_blank">
            Switcheo Interview API
          </a>{" "}
          · Icons via
          <a href="https://github.com/Switcheo/token-icons" target="_blank">
            {" "}
            token-icons
          </a>
        </small>
      </footer>
    </div>
  );
}
