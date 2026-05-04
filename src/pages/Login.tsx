import { Link } from "react-router-dom";
import "./Auth.css";

export function Login() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__lead">Acesse sua conta Pet Stop</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-label">
            E-mail
            <input type="email" className="auth-input" placeholder="seu@email.com" />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" className="auth-input" placeholder="••••••••" />
          </label>
          <button type="submit" className="btn btn-orange auth-submit">
            Entrar
          </button>
        </form>
        <p className="auth-footer">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
        <Link to="/" className="auth-back">
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
