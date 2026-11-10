import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PICTURE_SPECS, pictureFileProblem, pictureProblem, readImageSize, type PictureKind } from "@/lib/banner-image";
import { BANNER_BUCKET, bannerObjectPath } from "@/lib/banner-paths";
import { Button } from "@/components/ui/button";

/** One sponsor picture (logo or stream picture): states its rules, checks the file, uploads to the sponsor's private folder. */
export function PictureUpload({ kind, title, userId, value, saved, onChange }: {
  kind: PictureKind; title: string; userId: string | undefined;
  value: string | null; saved: string | null; onChange: (path: string | null) => void;
}) {
  const spec = PICTURE_SPECS[kind];
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!value) { setPreview(null); return; }
    let live = true;
    supabase.storage.from(BANNER_BUCKET).createSignedUrl(value, 3600).then(({ data }) => { if (live) setPreview(data?.signedUrl ?? null); });
    return () => { live = false; };
  }, [value]);

  async function pick(file: File | undefined) {
    setMsg(null);
    if (!file) return;
    const quick = pictureFileProblem(kind, file);
    if (quick) { setMsg(quick); return; }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const problem = pictureProblem(kind, readImageSize(bytes), bytes.length);
      if (problem) { setMsg(problem); return; }
      if (!userId) { setMsg("Please sign in again, then try once more."); return; }
      const path = bannerObjectPath(userId, file.name);
      const { error } = await supabase.storage.from(BANNER_BUCKET).upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
      if (error) { setMsg("Couldn't upload that picture — please try again."); return; }
      if (value && value !== saved) await supabase.storage.from(BANNER_BUCKET).remove([value]);
      onChange(path);
      setMsg("That picture fits — press Save details below.");
    } catch {
      setMsg("Couldn't read that file — please try a different picture.");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (value && value !== saved) await supabase.storage.from(BANNER_BUCKET).remove([value]);
    onChange(null);
    setMsg("Removed — press Save details below to finish.");
  }

  return (
    <div className="text-sm sm:col-span-2">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-night-muted">{spec.requirements}</p>
      <input type="file" accept=".jpg,.jpeg,.png,.webp" disabled={busy} aria-label={`Upload ${title.toLowerCase()}`}
        onChange={(e) => void pick(e.target.files?.[0])}
        className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-electric file:px-3 file:py-1.5 file:text-night" />
      {busy ? <p className="mt-1 text-xs text-night-muted">Checking your picture…</p> : null}
      {msg ? <p role="status" className="mt-1 text-xs">{msg}</p> : null}
      {preview ? (
        <div className="mt-3">
          <img src={preview} alt={`Your ${title.toLowerCase()}`} className={`rounded-md border border-night-line ${kind === "logo" ? "size-32 bg-background object-contain p-2" : "w-full max-w-sm"}`} />
          <Button variant="link" type="button" onClick={() => void remove()} className="mt-1 px-0 text-xs text-night-muted underline">Remove picture</Button>
        </div>
      ) : null}
    </div>
  );
}
