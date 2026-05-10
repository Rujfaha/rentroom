"C:\Users\msi0007\hotel-ladingpage-portfolio\app\v2\layout.tsx"
"C:\Users\msi0007\hotel-ladingpage-portfolio\app\v2\page.tsx"// Auth layout — สำหรับหน้า Login, Register
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
