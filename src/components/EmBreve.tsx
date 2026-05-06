import Link from "next/link";
import "./EmBreve.css";

type Props = { title: string };

export function EmBreve({ title }: Props) {
  return (
    <main className="page em-breve">
      <h1 className="em-breve__title">{title}</h1>
      <p className="em-breve__text">Conteúdo em construção.</p>
      <Link href="/" className="em-breve__back">
        ← Voltar ao início
      </Link>
    </main>
  );
}
