export default function LoginPage() {
  return (
    <div className="container-app max-w-md py-10">
      <h1 className="mb-6 text-2xl font-semibold">Login</h1>
      <form action="/api/auth/login" method="post" className="space-y-4 rounded-xl border border-slate-800 bg-surface p-6">
        <input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-slate-700 bg-slate-900 p-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full rounded-md border border-slate-700 bg-slate-900 p-2" required />
        <button className="w-full rounded-md bg-brand p-2">Sign in</button>
      </form>
    </div>
  );
}
