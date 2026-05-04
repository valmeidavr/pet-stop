import { Link } from "react-router-dom";
import "./Auth.css";

export function Cadastro() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-label">
            Nome
            <input type="text" className="auth-input" placeholder="Seu nome" />
          </label>
          <label className="auth-label">
            E-mail
            <input type="email" className="auth-input" placeholder="seu@email.com" />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" className="auth-input" placeholder="••••••••" />
          </label>
          <button type="submit" className="btn btn-green auth-submit">
            Criar conta
          </button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
        <Link to="/" className="auth-back">
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
