# Keeping the stream settings saved, running 24/7, and admin capacity

## 1. Are your features saved?
- Everything built on the site is saved already. It goes live on ukstats.co.uk once you publish, and stays live after that.
- OBS keeps the private voice link and the sound settings in its scene collection. To keep a backup: in OBS choose Scene Collection, then Export, and save the file somewhere safe. If you move to a cloud computer later, import that file there.
- Keep the private voice link secret. If it ever leaks, I can change the key, and you would paste the new link into OBS.

## 2. Running 24/7 on a cloud computer
Your Mac sleeps, updates and loses its connection, so the stream stops. The fix is a small rented computer that runs OBS around the clock:
1. Rent a server: Hetzner or Contabo, about £10–25 a month (Oracle's free signup kept failing).
2. Install OBS on it, import your exported scene collection, and add your YouTube stream key there. The key stays on that computer and never goes on the website.
3. Turn on auto-restart: if OBS or the stream stops, it starts again by itself.
4. The site's own watchdog keeps checking the stream and shows "Back shortly" if it goes down.

When you've chosen a provider, I can write you step-by-step setup instructions for it.

## 3. Does the admin area need more capacity?
- I haven't checked this yet. I'd check before suggesting any upgrade, because a bigger plan costs more every month.
- Step 1 (no changes, no cost): look at how busy the site's database and server are over the last few weeks and at your recent usage costs.
- Step 2: suggest an upgrade only if those numbers show the site is overloaded, and you make the final call. Otherwise, no change.
- Running the stream on a cloud computer doesn't add load to the admin area. The stream page uses the same saved figures every visitor already gets.

## Technical notes
- Capacity check: run Cloud database health and slow-query reports and pull 30 days of project usage costs. Make no changes to resources.
- No code changes in this plan.
