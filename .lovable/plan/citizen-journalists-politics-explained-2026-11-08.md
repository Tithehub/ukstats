# Citizen Journalists + Politics Explained

## 1. Citizen Journalists (/citizen-journalists)
- Public directory of approved citizen journalists, open to any political stance or religion.
- Each card: name, photo, short bio, social links (YouTube, X, Rumble, Substack, website), and latest videos (pulled from their YouTube channel feed, titles verbatim).
- Starts empty; you add your default list yourself from the admin review screen (paste name + channel link, approve).
- "Apply to be listed" form (sign-in required): name, bio, photo, links. Every application goes to **Pending** and appears nowhere until an admin approves it.
- Admin review screen: approve / reject / edit, with optional reason. Applicants see their own status.
- Clear label: "Independent creators — not official sources. Listing is not endorsement." Never mixed into stats, embeds, reports or the stream.
- Search and filter by platform; no political-stance labels on people (avoids pigeon-holing anyone).

## 2. Politics Explained (/politics-explained)
- About 80 terms and abbreviations, plain neutral dictionary-style definitions, zero slang or slurs. Groups:
  - Political spectrum: Far-left, Extreme-left, Left, Centre-left, Centre, Centre-right, Right, Far-right, Extreme-right.
  - Ideologies: Socialism, Communism, Marxism, Liberalism, Conservatism, Libertarianism, Populism, Fascism, Neo-Nazism, Anarchism, Social democracy, Green politics, etc.
  - Nationalism: Civic nationalism (Civ-Nat), Ethnic nationalism (Ethno-Nat), Patriotism, Unionism, Separatism, Globalism, Sovereigntism, etc.
  - Identity and ethnicity terms used in official statistics (e.g. the ONS ethnic group categories), Multiculturalism, Integration, Assimilation.
  - UK politics abbreviations: MP, PM, PMQs, MSP, MS, MLA, SNP, DUP, PR, FPTP, Whip, Hung parliament, etc.
- Each entry: term, also-known-as/abbreviation, plain one-line meaning, longer neutral explanation, where it sits on the scale (if applicable), and a dictionary/reference link (Cambridge, Oxford Learner's, Britannica, Parliament glossary).
- Interactive left-to-right scale at the top: click a position to see its meaning and related terms.
- A–Z search box and category filter; sharable links to each term.
- Note: "For education only. Definitions describe how terms are commonly used, not judgements about any person or group."

## 3. Links
- Add both to the menu, topic bar and home page, plus sitemap and share cards.

## Technical details
- New table `citizen_journalists` (status pending/approved/rejected, owner user_id, fields above) with GRANTs and RLS: public reads approved only, owners read/insert own, admins manage via existing `has_role`.
- Photos in a storage bucket; admin approval required for photo changes.
- Latest videos via YouTube RSS by channel ID, cached in `payload_cache`; POST server functions.
- Glossary is a static data file with a unit test ensuring every term has a definition and source link.
