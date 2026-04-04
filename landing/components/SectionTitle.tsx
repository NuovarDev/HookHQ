export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="sticky top-24 border border-line bg-panel p-5 shadow-panel max-[1080px]:static">
      <h2 className="font-mono text-[1.7rem] uppercase leading-none">{title}</h2>
    </div>
  );
}
