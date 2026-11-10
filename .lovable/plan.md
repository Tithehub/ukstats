# FT story: our own version of the chart

## The catch
The FT chart prints only one exact number: Rupert Lowe's 1.7bn views. Every other bar would have to be read off by eye, and that would be an estimate. The site never shows estimated figures.

## What gets built
Under the main story on the home page, a two-column panel in the site's navy, red and yellow style:
- Title: "Rupert Lowe has greater visibility on X than most world leaders", with the FT's label "Views of posts on X, Jan–Oct 2026".
- **World leaders** and **British MPs** shown as ranked ladders in the FT's order (Modi, Trump, Takaichi, **Lowe**, Zelenskyy, Macron, Netanyahu, Milei, Sánchez, Erdoğan / **Lowe**, Farage, Burnham, Badenoch, Sultana, Jenrick, Corbyn, Tice, Anderson, Braverman).
- Each row shows a numbered rank chip. Lowe's row is highlighted in red with "1.7bn". The other rows show the name and rank only, with no bar lengths or guessed numbers.
- Credit line: "Ranking and figure: Financial Times, 8 Nov 2026. Redrawn by UKStats; only the figure the FT printed is shown." It links to the article.
- Stacks into one column on phones.

## Option for real bars
If you can send me the FT's exact numbers (some FT charts let you download the data), I'll switch the ladders to true proportional bars.

## Technical
- Add `charts` (group, ordered names, `highlight`, `value` only where published) to `featured-story.data.ts`; render with a new `FeaturedStoryChart.tsx` using semantic tokens.
- Add a test that only Lowe's published figure carries a value.
- Nothing published until you say so.
