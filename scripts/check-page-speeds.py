"""Public-page smoke/performance audit. Python Playwright required; outputs stay in /tmp.
Run: python3 scripts/check-page-speeds.py --origin https://ukstats.co.uk
Checks each static content route plus representative parameterised route families.
Measures real theme interaction after navigation (not just an HTTP response).
"""
import argparse, asyncio, json, re, time
from pathlib import Path
from playwright.async_api import async_playwright

PRIVATE = {'/agents','/outreach','/connections','/sponsor-dashboard','/my-pages','/auth','/reset-password','/create'}
def paths():
    out = set()
    for file in Path('src/routes').glob('*.tsx'):
        match = re.search(r'createFileRoute\([\'"]([^\'"]+)', file.read_text())
        if not match: continue
        path = match[1].rstrip('/') or '/'
        if '$' not in path and path not in PRIVATE: out.add(path)
    out.update(['/fr','/fr/calendar','/fr/sources','/fr/status','/fr/history/population','/fr/explained/population','/fr/embed/population','/ca/safest-places','/world/GBR','/history/uk-cpi','/explained/uk-cpi','/embed/uk-cpi','/answers/uk-inflation','/regions/london'])
    return sorted(out)

async def usable(page):
    # Embeds have no site chrome: require visible body content and hydration readiness.
    toggle = page.get_by_role('button', name=re.compile('Switch to .* theme')).first
    if await toggle.count():
        old = await toggle.get_attribute('aria-label')
        await toggle.click(timeout=15000)
        await page.wait_for_function("old => [...document.querySelectorAll('button')].some(b => /^Switch to .* theme$/.test(b.getAttribute('aria-label') || '') && b.getAttribute('aria-label') !== old)", arg=old, timeout=15000)
    else:
        await page.locator('body').wait_for(state='visible')
        await page.wait_for_function('document.body.innerText.trim().length > 10', timeout=15000)

async def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--origin',default='http://localhost:8080'); parser.add_argument('--output',default='/tmp/browser/page-speeds.json'); args=parser.parse_args()
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        context=await browser.new_context(viewport={'width':1280,'height':1800})
        page=await context.new_page()
        for path in paths():
            item={'path':path}; errors=[]
            def error(e): errors.append(str(e))
            page.on('pageerror', error)
            try:
                t=time.perf_counter(); response=await page.goto(args.origin+path,wait_until='domcontentloaded',timeout=35000)
                await usable(page); item['first_usable_ms']=round((time.perf_counter()-t)*1000); item['status']=response.status if response else None
                item['final_path']=page.url.removeprefix(args.origin)
                item['title']=await page.title()
                # In-app back navigation exercises retained router/query results.
                press = page.locator('a[href="/press"]').first
                if await press.count():
                    await press.click(); await page.wait_for_url(args.origin+'/press',timeout=35000)
                else:
                    await page.goto(args.origin+'/press',wait_until='domcontentloaded',timeout=35000)
                await usable(page)
                t=time.perf_counter(); await page.go_back(wait_until='domcontentloaded',timeout=35000); await usable(page)
                item['repeat_usable_ms']=round((time.perf_counter()-t)*1000)
                item['repeat_under_1s']=item['repeat_usable_ms']<1000
                if path in ['/','/maps','/tax-vs-welfare','/world','/polling']:
                    await page.screenshot(path='/tmp/browser/speed-'+path.strip('/').replace('/','-')+'.png')
            except Exception as e: item['error']=type(e).__name__+': '+str(e).split('\n')[0]
            item['runtime_errors']=errors; page.remove_listener('pageerror',error)
            results.append(item); print(json.dumps(item),flush=True)
        await browser.close()
    output=Path(args.output); output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps({'origin':args.origin,'scope':'All static public content routes and one representative per dynamic family; not every parameter value. Repeat = browser Back, includes cache restore; not a global speed guarantee.','rows':results},indent=2))

asyncio.run(main())
