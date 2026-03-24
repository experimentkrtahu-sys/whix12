export default function RegisterPage() {
  return (
    <div className="container-app max-w-md py-10">
      <h1 className="mb-6 text-2xl font-semibold">Register</h1>
      <form action="/api/auth/register" method="post" className="space-y-4 rounded-xl border border-slate-800 bg-surface p-6">
        <input name="displayName" placeholder="Display name" className="w-full rounded-md border border-slate-700 bg-slate-900 p-2" required />
        <input name="email" type="email" placeholder="Email" className="w-full rounded-md border border-slate-700 bg-slate-900 p-2" required />
        <input name="password" type="password" placeholder="Password" className="w-full rounded-md border border-slate-700 bg-slate-900 p-2" required />
        <button className="w-full rounded-md bg-brand p-2">Create account</button>
      </form>
    </div>
  );
}
