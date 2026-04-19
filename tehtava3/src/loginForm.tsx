import { useState } from "react";
import { loginWithEmail } from "./authService";

const LoginForm = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("auth/invalid-credential")) {
          setError("Väärä sähköposti tai salasana.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Tuntematon virhe");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>

        <div className="login-form-group">
          <label htmlFor="email">Sähköposti</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nimi@sähköposti.fi"
          />
        </div>

        <div className="login-form-group">
          <label htmlFor="password">Salasana</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="******"
          />
        </div>

        {error && <p className="error-message" style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Kirjaudutaan..." : "Kirjaudu"}
        </button>
      </form>

      <div className="test-credentials">
        <p><strong>Testitunnukset:</strong></p>
        <p>Email: <code>testaaja@testaus.fi</code></p>
        <p>Salasana: <code>SalainenSana</code></p>
      </div>
    </div>
  );
};

export default LoginForm;