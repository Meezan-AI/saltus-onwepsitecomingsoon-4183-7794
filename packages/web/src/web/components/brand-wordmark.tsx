export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      <span style={{ fontFamily: "'Segoe Print', 'Comic Sans MS', cursive" }} className="text-white">
        Saltus
      </span>{" "}
      <span className="font-display">
        <span className="text-white">O</span>
        <span className="text-[#FF6B00]">N</span>
        <span className="text-white">E</span>
      </span>
    </span>
  );
}
