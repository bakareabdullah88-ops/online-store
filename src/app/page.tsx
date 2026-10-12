import Link from "next/link";

export default function Home() {
  return (
    <main className="container-page py-24">
      <Link href="/design-system" className="underline">
        Design system
      </Link>
    </main>
  );
}
