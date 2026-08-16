import { auth, signIn, signOut } from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-binder px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-xs tracking-[0.2em] text-binder-text/60 uppercase">
          Clinical Study Binder
        </span>
        <h1 className="font-serif text-4xl font-semibold text-binder-text">
          The Rounds
        </h1>
        <p className="max-w-xs font-sans text-sm text-binder-text/70">
          Write, organize, and share clinical notes the way a real chart
          binder is organized.
        </p>
      </div>

      <div className="mt-10">
        {session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="font-sans text-sm text-binder-text/80">
              Signed in as{" "}
              <span className="font-medium text-binder-text">
                {session.user.email}
              </span>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-binder-text/20 px-5 py-2.5 font-sans text-sm font-medium text-binder-text transition-colors hover:bg-binder-soft"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 rounded-full bg-binder-soft px-5 py-2.5 font-sans text-sm font-medium text-binder-text transition-colors hover:bg-binder-soft/80"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
