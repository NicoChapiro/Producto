import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Producto</h1>
      <Link href="/packaging">Ir a Packaging Requests</Link>
    </main>
  );
}
