export default function FloatingShape({ className }) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`} />
  );
}
