import { LoginForm, AuthStatus } from "@/components/auth";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            CubiQo
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            One Mind. Many Dimensions.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Auth Status */}
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              Session Status
            </h2>
            <AuthStatus />
          </div>

          {/* Login Form */}
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              Sign In
            </h2>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Enter your email to receive a magic link for passwordless authentication.
              </p>
              <LoginForm />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Phase 2 Development
          </h3>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              Next.js 16
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              React 19
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              Supabase
            </span>
            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
              Auth Testing
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
