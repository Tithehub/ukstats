import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { setPlayerName } from "@/lib/games.functions";
import { deleteMyAccount, myProfileStats } from "@/lib/profile.functions";
import { AVATAR_MAX_BYTES, AVATAR_TYPES, REAL_NAME_WARNING, looksLikeRealName } from "@/lib/profile";
import { GAME_DEFS, type GameId } from "@/lib/games";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My profile | UKStats" }, { name: "description", content: "Your UKStats nickname, picture, games record and account settings." }, { property: "og:title", content: "My profile | UKStats" }, { property: "og:description", content: "Your UKStats account settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

const card = "rounded-lg border border-night-line bg-night-panel p-5";
const input = "mt-2 min-h-11 w-full rounded-lg border border-night-line/70 bg-night px-3 py-2.5 text-sm outline-none focus-visible:border-electric";
const GAME_LINK: Record<GameId, string> = { "daily-5": "/games/daily", "britain-by-the-numbers": "/games/britain-by-the-numbers", "higher-or-lower": "/games/higher-or-lower", "guess-the-number": "/games/guess-the-number", "rank-the-world": "/games/rank-the-world", "guess-the-flag": "/games/guess-the-flag", "english-history": "/games/english-history", "world-knowledge": "/games/world-knowledge" };

function Profile() {
  return <div className="min-h-screen bg-night text-foreground"><SiteHeader /><ProfileGate /><SiteFooter /></div>;
}

function ProfileGate() {
  const { user, loading } = useAuth();
  if (loading) return <main className="mx-auto max-w-[760px] px-4 py-10"><p className="text-night-muted">Loading…</p></main>;
  if (!user) return (
    <main className="mx-auto max-w-[760px] px-4 py-10">
      <h1 className="text-2xl font-semibold">My profile</h1>
      <p className="mt-3 text-night-muted">Sign in to see your profile, nickname and game scores.</p>
      <Link to="/auth" search={{ next: "/profile" }} className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Sign in or create an account</Link>
    </main>
  );
  return <ProfileBody userId={user.id} email={user.email ?? ""} />;
}

function ProfileBody({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const saveName = useServerFn(setPlayerName);
  const stats = useQuery({ queryKey: ["my-profile-stats", userId], queryFn: useServerFn(myProfileStats) });
  const prof = useQuery({ queryKey: ["my-profile", userId], queryFn: async () => (await supabase.from("profiles").select("display_name, avatar_path").eq("id", userId).maybeSingle()).data });
  const [name, setName] = useState(""); const [nameMsg, setNameMsg] = useState<string | null>(null); const [confirmReal, setConfirmReal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); const [avMsg, setAvMsg] = useState<string | null>(null);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [del, setDel] = useState(""); const [delMsg, setDelMsg] = useState<string | null>(null);
  const removeAccount = useServerFn(deleteMyAccount);

  useEffect(() => { if (prof.data?.display_name) setName(prof.data.display_name); }, [prof.data?.display_name]);
  useEffect(() => {
    const p = prof.data?.avatar_path; if (!p) { setAvatarUrl(null); return; }
    void supabase.storage.from("avatars").createSignedUrl(p, 3600).then(({ data }) => setAvatarUrl(data?.signedUrl ?? null));
  }, [prof.data?.avatar_path]);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault(); setNameMsg(null);
    if (looksLikeRealName(name, email) && !confirmReal) { setConfirmReal(true); setNameMsg("This looks like it could be your real name. It will be public on leaderboards — press Save again to use it anyway, or pick a different nickname."); return; }
    try { const r = await saveName({ data: { name } }); setNameMsg(r.ok ? "Nickname saved." : r.error); setConfirmReal(false); void qc.invalidateQueries(); }
    catch (err) { setNameMsg(err instanceof Error ? err.message : "Couldn't save that name."); }
  }
  async function onAvatar(f: File | undefined) {
    setAvMsg(null); if (!f) return;
    if (!AVATAR_TYPES.includes(f.type)) return setAvMsg("Please use a PNG, JPG or WebP picture.");
    if (f.size > AVATAR_MAX_BYTES) return setAvMsg("That picture is over 1 MB.");
    const path = `${userId}/avatar-${Date.now()}.${f.type.split("/")[1]}`;
    const old = prof.data?.avatar_path;
    const up = await supabase.storage.from("avatars").upload(path, f, { contentType: f.type });
    if (up.error) return setAvMsg("Upload failed — please try again.");
    await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
    if (old) await supabase.storage.from("avatars").remove([old]);
    setAvMsg("Picture saved."); void prof.refetch();
  }
  async function onRemoveAvatar() {
    const old = prof.data?.avatar_path; if (!old) return;
    await supabase.storage.from("avatars").remove([old]);
    await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId);
    setAvMsg("Picture removed."); void prof.refetch();
  }
  async function onPassword(e: React.FormEvent) {
    e.preventDefault(); setPwMsg(null);
    if (pw.length < 8) return setPwMsg("Use at least 8 characters.");
    if (pw !== pw2) return setPwMsg("The two passwords don't match.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwMsg(error ? error.message : "Password changed."); if (!error) { setPw(""); setPw2(""); }
  }
  async function onDelete(e: React.FormEvent) {
    e.preventDefault(); setDelMsg(null);
    try {
      const r = await removeAccount({ data: { confirm: del } });
      if (!r.ok) return setDelMsg(r.error);
      await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut();
      void navigate({ to: "/", replace: true });
    } catch (err) { setDelMsg(err instanceof Error ? err.message : "Couldn't delete your account."); }
  }

  const games = stats.data?.games ?? {};
  return (
    <main className="mx-auto max-w-[760px] space-y-5 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
      <div role="note" className="flex gap-3 rounded-lg border border-ageing/60 bg-ageing/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-ageing" aria-hidden />
        <p><strong>Privacy:</strong> {REAL_NAME_WARNING} Choose a nickname that doesn't identify you.</p>
      </div>

      <section className={card}>
        <h2 className="text-lg font-semibold">Nickname and email</h2>
        <p className="mt-2 text-sm text-night-muted">Email (private): <span className="font-mono text-foreground">{email}</span></p>
        <form onSubmit={onSaveName} className="mt-3">
          <label htmlFor="nick" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Leaderboard nickname</label>
          <input id="nick" className={input} minLength={2} maxLength={24} value={name} onChange={(e) => { setName(e.target.value); setConfirmReal(false); }} />
          <p className="mt-1.5 text-xs text-ageing">{REAL_NAME_WARNING}</p>
          <Button type="submit" className="mt-3" disabled={name.trim().length < 2}>Save nickname</Button>
          {nameMsg && <p role="status" className="mt-2 text-sm">{nameMsg}</p>}
        </form>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Profile picture</h2>
        <p className="mt-1 text-sm text-night-muted">Square PNG, JPG or WebP, up to 1 MB. Only you see it on this page — it is never shown on leaderboards. If you want to stay anonymous, don't use a photo of yourself.</p>
        <div className="mt-3 flex items-center gap-4">
          {avatarUrl ? <img src={avatarUrl} alt="Your profile picture" width={80} height={80} className="size-20 rounded-full object-cover ring-1 ring-night-line" /> : <div className="grid size-20 place-items-center rounded-full bg-night text-2xl font-semibold ring-1 ring-night-line">{(name || "?").slice(0, 1).toUpperCase()}</div>}
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-md border border-night-line px-3 py-2 text-sm hover:border-electric-soft">Upload picture<input type="file" accept={AVATAR_TYPES.join(",")} className="sr-only" onChange={(e) => void onAvatar(e.target.files?.[0])} /></label>
            {prof.data?.avatar_path && <Button variant="outline" onClick={() => void onRemoveAvatar()}>Remove</Button>}
          </div>
        </div>
        {avMsg && <p role="status" className="mt-2 text-sm">{avMsg}</p>}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">My games</h2><span className="font-mono text-sm text-night-muted">Daily 5 streak: {stats.data?.streak ?? 0}</span></div>
        <ul className="mt-3 divide-y divide-night-line">
          {(Object.keys(GAME_DEFS) as GameId[]).map((g) => { const s = games[g]; return (
            <li key={g} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="flex-1 font-medium">{GAME_DEFS[g].title}</span>
              <span className="font-mono text-xs text-night-muted">{s ? `${s.days} day${s.days === 1 ? "" : "s"} · best ${s.best} · today ${s.today ?? "—"}` : "Not played yet"}</span>
              <Link to={GAME_LINK[g] as never} className="text-sm underline">Play</Link>
            </li>
          ); })}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Change password</h2>
        <form onSubmit={onPassword} className="mt-2 space-y-3">
          <div><label htmlFor="pw1" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">New password</label><PasswordInput id="pw1" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div><label htmlFor="pw2" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Confirm new password</label><PasswordInput id="pw2" minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
          <Button type="submit" disabled={!pw}>Change password</Button>
          {pwMsg && <p role="status" className="text-sm">{pwMsg}</p>}
        </form>
      </section>

      <section className="rounded-lg border border-overdue/60 bg-overdue/5 p-5">
        <h2 className="text-lg font-semibold text-overdue">Delete account</h2>
        <p className="mt-1 text-sm text-night-muted">This permanently removes your account, nickname, picture and every game score. It can't be undone.</p>
        <form onSubmit={onDelete} className="mt-3 flex flex-wrap items-end gap-3">
          <div><label htmlFor="del" className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Type DELETE to confirm</label><input id="del" className={input} value={del} onChange={(e) => setDel(e.target.value)} autoComplete="off" /></div>
          <Button type="submit" variant="destructive" disabled={del !== "DELETE"}>Delete my account</Button>
        </form>
        {delMsg && <p role="status" className="mt-2 text-sm">{delMsg}</p>}
      </section>
    </main>
  );
}
