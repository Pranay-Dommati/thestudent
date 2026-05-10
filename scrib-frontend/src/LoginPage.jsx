import { Link } from 'react-router-dom'

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#1f1f1f]">
      <header className="border-b border-[#e4ddd4] bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2dbd2] bg-white">
              <img src="/scrib-favicon.svg" alt="Scrib" className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Scrib</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-[#e2dbd2] bg-white px-8 py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a9289]">Scrib</p>
          <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-[#7b756d]">Log in to access your notes and credits.</p>

          <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-[#d9d1c7] bg-white px-4 py-2 text-sm font-semibold">
            <span className="text-base">G</span> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-[#9a9289]">
            <span className="h-px flex-1 bg-[#eee6dc]" /> or <span className="h-px flex-1 bg-[#eee6dc]" />
          </div>

          <div className="space-y-3 text-left">
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Email address"
            />
            <input
              className="w-full rounded-lg border border-[#e0d9ce] px-3 py-2 text-sm"
              placeholder="Password"
              type="password"
            />
          </div>

          <div className="mt-3 text-right">
            <button className="text-xs font-semibold text-[#7b756d]">Forgot password?</button>
          </div>

          <button className="mt-4 w-full rounded-lg border border-[#1f1f1f] bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white">
            Log in
          </button>

          <p className="mt-4 text-xs text-[#7b756d]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-[#1f1f1f]">
              Sign up free
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
