"""Read-only responsive, accessibility and journey audit. Outputs remain in /tmp/browser.
Run from project root: python3 scripts/check-site-quality.py
Local timings are lab observations, not production Core Web Vitals certification.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT = Path('/tmp/browser/site-quality')
PAGES = ['/', '/register?q=debt', '/small-boats', '/world', '/compare-countries?metric=hicp', '/education', '/grooming-gangs-inquiry', '/reports', '/rent', '/sponsors', '/restore-britain', '/live']
WIDTHS = [360, 390, 768, 927, 1280, 1440]

async def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    rows = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for path in PAGES:
            for width in WIDTHS:
                page = await browser.new_page(viewport={'width': width, 'height': 1800}, reduced_motion='reduce')
                errors = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                row = {'path': path, 'width': width}
                try:
                    response = await page.goto('http://localhost:8080' + path, wait_until='domcontentloaded', timeout=35000)
                    await page.wait_for_timeout(800)
                    row['status'] = response.status if response else None
                    row['measurements'] = await page.evaluate('''() => ({
                      title:document.title, pageWidth:document.documentElement.scrollWidth,
                      overflow:document.documentElement.scrollWidth>innerWidth+1,
                      headings:[...document.querySelectorAll('h1')].map(e=>e.textContent),
                      description:!!document.querySelector('meta[name="description"]'),
                      ogTitle:!!document.querySelector('meta[property="og:title"]'),
                      ogDescription:!!document.querySelector('meta[property="og:description"]'),
                      nav:performance.getEntriesByType('navigation').map(n=>({response_ms:Math.round(n.responseStart),dom_ms:Math.round(n.domContentLoadedEventEnd)}))
                    })''')
                    if width == 390:
                        await page.add_script_tag(path='node_modules/axe-core/axe.min.js')
                        row['accessibility'] = await page.evaluate('''async () => (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length,targets:v.nodes.slice(0,5).map(n=>n.target)}))''')
                    if path == '/' and width in [390, 768, 1440]:
                        await page.screenshot(path=str(OUTPUT / f'home-{width}.png'))
                except Exception as e:
                    row['failure'] = str(e).split('\n')[0]
                row['errors'] = errors
                rows.append(row)
                await page.close()
        page = await browser.new_page(viewport={'width':1280,'height':1800})
        journeys = []
        await page.goto('http://localhost:8080')
        await page.get_by_role('button', name='Open menu', exact=True).click()
        dialog = page.get_by_role('dialog', name='Explore UKStats')
        await dialog.wait_for()
        await page.keyboard.press('Shift+Tab')
        journeys.append({'name':'menu focus stays inside dialog', 'passed':await dialog.evaluate('(e)=>e.contains(document.activeElement)')})
        await page.keyboard.press('Escape')
        journeys.append({'name':'menu Escape restores trigger focus', 'passed':await page.get_by_role('button',name='Open menu',exact=True).evaluate('(e)=>e===document.activeElement')})
        await page.get_by_role('button',name='Search UKStats',exact=True).click()
        search = page.get_by_role('textbox',name='Search pages',exact=True)
        await search.fill('education')
        await page.keyboard.press('Enter')
        await page.wait_for_url('**/education')
        journeys.append({'name':'page search opens education', 'passed':await page.get_by_role('heading',name='Education',exact=True).is_visible()})
        await page.goto('http://localhost:8080')
        await page.get_by_role('searchbox',name='Find a UK statistic').fill('debt')
        await page.get_by_role('button',name='Find figures',exact=True).click()
        await page.wait_for_url('**/register?q=debt')
        journeys.append({'name':'home search retains debt in URL', 'passed':'q=debt' in page.url and await page.get_by_role('heading',name='UK statistics',exact=True).is_visible()})
        await page.screenshot(path=str(OUTPUT / 'debt-search.png'))
        await browser.close()
    result = {'scope':'Local Chromium, representative public pages; no payment or account mutations. Not field performance or full WCAG certification.', 'rows':rows, 'journeys':journeys}
    (OUTPUT / 'results.json').write_text(json.dumps(result, indent=2))
    print(json.dumps({'cases':len(rows),'overflow':[{ 'path':r['path'],'width':r['width']} for r in rows if r.get('measurements',{}).get('overflow')], 'failures':[r for r in rows if r.get('failure') or r['errors']], 'accessibility':[{ 'path':r['path'],'issues':r['accessibility']} for r in rows if r.get('accessibility')], 'journeys':journeys},indent=2))

asyncio.run(main())