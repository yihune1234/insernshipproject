export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10', xl: 'h-16 w-16' };
  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizes[size]} ${className}`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="xl" className="text-primary" />
    </div>
  );
}
