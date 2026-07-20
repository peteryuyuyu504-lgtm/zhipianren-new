import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p>这位角色暂时不在这里。</p>
      <Link href="/">回去重新选择</Link>
    </main>
  );
}
