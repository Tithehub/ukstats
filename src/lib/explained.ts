// Plain-English explainers for the register's most-asked-about figures.
// Every explanation is grounded in the publisher's own methodology notes;
// no figures are stated here — the live value is injected from the register.

export interface Explainer {
  /** Metric id on the register. */
  id: string;
  title: string;
  /** One-sentence answer to "what is this number?". */
  summary: string;
  sections: { heading: string; body: string }[];
  /** Publisher methodology link. */
  methodology: { label: string; url: string };
}

export const EXPLAINERS: Explainer[] = [
  {
    id: "uk-national-debt",
    title: "What is the UK national debt?",
    summary:
      "Public sector net debt is the stock of everything the public sector owes, minus its liquid financial assets — the ONS headline measure of government debt.",
    sections: [
      {
        heading: "What it measures",
        body: "Public sector net debt (PSND) adds up the liabilities of central government, local government and public corporations — mostly gilts, Treasury bills and loans — and subtracts liquid assets such as foreign exchange reserves. It is expressed both in cash terms and as a percentage of GDP, which is the figure usually quoted in the news.",
      },
      {
        heading: "How it is compiled",
        body: "The Office for National Statistics compiles the figure each month from HM Treasury, Bank of England and public corporation returns, under the European System of Accounts framework. The ONS publishes the full time series back to March 1993 on a comparable basis.",
      },
      {
        heading: "What it is not",
        body: "It is not the deficit (the annual gap between spending and income) and it excludes most unfunded public sector pension promises and the Bank of England's quantitative easing holdings are netted in a specific way — the ONS bulletin explains the treatment each month.",
      },
    ],
    methodology: {
      label: "ONS public sector finances methodology",
      url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/methodologies/publicsectorfinancesqmi",
    },
  },
  {
    id: "uk-cpi",
    title: "How is UK inflation (CPI) measured?",
    summary:
      "The Consumer Prices Index tracks the price of a fixed basket of around 700 goods and services, surveyed each month at outlets across the UK.",
    sections: [
      {
        heading: "What it measures",
        body: "CPI measures how the prices of a representative basket of consumer goods and services change over time. The 12-month rate compares prices today with the same month a year earlier. The basket and its weights are updated annually to reflect what households actually buy.",
      },
      {
        heading: "How it is compiled",
        body: "The ONS collects hundreds of thousands of price quotes each month from shops and online retailers across the UK, then combines them using the basket weights. CPIH, which adds owner-occupiers' housing costs, is the ONS's lead measure; CPI is the internationally comparable one.",
      },
      {
        heading: "What it is not",
        body: "It is not the cost of living for any individual household — everyone buys a different basket. It also excludes house prices themselves (mortgage interest and rents appear differently across CPI, CPIH and RPI), which is why the ONS publishes several measures side by side.",
      },
    ],
    methodology: {
      label: "ONS consumer price inflation methodology",
      url: "https://www.ons.gov.uk/economy/inflationandpriceindices/methodologies/consumerpriceinflationqmi",
    },
  },
  {
    id: "uk-unemployment",
    title: "How is UK unemployment measured?",
    summary:
      "The unemployment rate comes from the Labour Force Survey: people without a job who have actively sought work in the last four weeks and can start within two.",
    sections: [
      {
        heading: "What it measures",
        body: "Unemployment follows the International Labour Organization definition: someone aged 16 or over who is not in work, has looked for work in the past four weeks and is available to start within two. The rate is the share of the economically active population — not the whole population.",
      },
      {
        heading: "How it is compiled",
        body: "The ONS estimates the figure from the Labour Force Survey, the UK's largest household survey. Because it is a survey, every estimate carries a confidence interval, which the ONS publishes alongside the headline rate.",
      },
      {
        heading: "What it is not",
        body: "It is not the claimant count (people on unemployment-related benefits), which is a separate administrative series the ONS also publishes. People not seeking work — students, carers, the long-term sick — are counted as economically inactive, not unemployed.",
      },
    ],
    methodology: {
      label: "ONS labour market methodology",
      url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/labourforcesurveyqmi",
    },
  },
  {
    id: "uk-house-prices",
    title: "Where does the average UK house price come from?",
    summary:
      "The UK House Price Index is built from completed sales registered at HM Land Registry, mixed-adjusted so the average reflects price changes, not just which homes happened to sell.",
    sections: [
      {
        heading: "What it measures",
        body: "The UK HPI average price is the mix-adjusted average price of residential properties actually sold and registered in the reference month, covering cash and mortgage sales across the whole UK.",
      },
      {
        heading: "How it is compiled",
        body: "HM Land Registry, Registers of Scotland, Land and Property Services Northern Ireland and the ONS combine the three land registers, then apply a hedonic model that adjusts for the mix of property types and locations sold. Figures are revised as late registrations arrive.",
      },
      {
        heading: "What it is not",
        body: "It is not an asking-price index (those come from property portals) and it lags the market by the time a sale takes to register — typically a few weeks to months. The average is not the price of a typical home in every area; regional figures differ widely.",
      },
    ],
    methodology: {
      label: "UK HPI methodology",
      url: "https://www.gov.uk/government/publications/about-the-uk-house-price-index",
    },
  },
  {
    id: "uk-net-migration",
    title: "What does net migration mean?",
    summary:
      "Net migration is the number of people arriving to live in the UK for 12 months or more, minus the number leaving to live abroad for 12 months or more.",
    sections: [
      {
        heading: "What it measures",
        body: "Long-term international migration counts people who change their usual country of residence for at least a year. Immigration minus emigration gives net migration. The ONS breaks the estimate down by nationality group, including British nationals returning or leaving.",
      },
      {
        heading: "How it is compiled",
        body: "The ONS now builds the estimate mainly from administrative data — Home Office visa and border records, DWP registrations and tax records — rather than the old passenger survey. Recent periods are labelled provisional and are revised as more journeys complete.",
      },
      {
        heading: "What it is not",
        body: "It does not count short-term visitors, and it is not the same as the number of visas granted — many visa holders never travel or stay less than a year. Irregular arrivals are estimated separately by the Home Office.",
      },
    ],
    methodology: {
      label: "ONS long-term international migration methodology",
      url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration/methodologies/longterminternationalmigrationqmi",
    },
  },
  {
    id: "uk-irregular-arrivals-ytd",
    title: "What do the small boat arrival figures count?",
    summary:
      "The Home Office counts people detected arriving in the UK by small boat, recorded on the day of detection — a subset of all detected irregular entry routes.",
    sections: [
      {
        heading: "What it measures",
        body: "The daily and weekly figures count individuals detected arriving by small boats across the Channel. The Home Office also publishes a quarterly total for all detected illegal entry routes, which includes small boats, inadequately documented air arrivals and detections at ports.",
      },
      {
        heading: "How it is compiled",
        body: "Figures come from Home Office operational systems and are published as provisional management information in the irregular migration statistics release, with breakdowns by nationality, age and sex where recorded.",
      },
      {
        heading: "What it is not",
        body: "Detections are not the same as the total irregular migrant population — some people enter undetected, and detected arrivals may later be granted leave or removed. The Home Office does not publish religion or ethnicity for irregular arrivals, so this site shows none.",
      },
    ],
    methodology: {
      label: "Home Office irregular migration statistics",
      url: "https://www.gov.uk/government/collections/irregular-migration-statistics",
    },
  },
  {
    id: "uk-terror-threat",
    title: "How is the UK terror threat level set?",
    summary:
      "The national threat level is set by the Joint Terrorism Analysis Centre on a five-step published scale from LOW to CRITICAL.",
    sections: [
      {
        heading: "What it measures",
        body: "The threat level is JTAC's assessment of the likelihood of a terrorist attack in the UK, expressed on the published five-step scale: LOW, MODERATE, SUBSTANTIAL, SEVERE, CRITICAL. A separate level covers Northern Ireland-related terrorism in Northern Ireland.",
      },
      {
        heading: "How it is set",
        body: "JTAC — based at MI5 and drawing on all UK intelligence agencies — assesses available intelligence, terrorist capability, intentions and timescale. The level is published by MI5 and gov.uk and changes only when the assessment changes.",
      },
      {
        heading: "What it is not",
        body: "It is not a prediction of a specific attack and it is not set by politicians. This site reproduces the published level exactly as the authorities display it, with the date it was last changed.",
      },
    ],
    methodology: {
      label: "MI5 threat levels",
      url: "https://www.mi5.gov.uk/threat-levels",
    },
  },
  {
    id: "uk-foreign-aid",
    title: "How is UK foreign aid (ODA) measured?",
    summary:
      "Official Development Assistance is measured under OECD rules as grant-equivalent spending on the economic development of eligible countries, reported both in cash and as a share of GNI.",
    sections: [
      {
        heading: "What it measures",
        body: "ODA covers spending whose main aim is the economic development and welfare of developing countries, as defined by the OECD Development Assistance Committee. The UK reports the total in cash terms and as a ratio to gross national income — the basis of the 0.7% and later 0.5% targets.",
      },
      {
        heading: "How it is compiled",
        body: "The Foreign, Commonwealth and Development Office compiles UK spending under OECD rules and reports it to the DAC, which publishes the internationally comparable series from 1960 onwards. From 2018 the DAC uses a grant-equivalent basis; earlier years are net disbursements.",
      },
      {
        heading: "What it is not",
        body: "It is not all overseas spending — military aid and most trade promotion sit outside the ODA definition. In-donor refugee costs count towards ODA under the rules, which is why the composition has changed in recent years.",
      },
    ],
    methodology: {
      label: "OECD DAC — what is ODA",
      url: "https://www.oecd.org/dac/financing-sustainable-development/development-finance-standards/what-is-oda",
    },
  },
  {
    id: "uk-street-crime",
    title: "What is street-level crime data?",
    summary:
      "Police.uk publishes every recorded crime snapped to an anonymised street point, so counts can be mapped within a mile of any location in England, Wales or Northern Ireland.",
    sections: [
      {
        heading: "What it measures",
        body: "Each record is a crime recorded by the police, placed at a nearby anonymised point (not the exact address) with its offence category and, later, its outcome. The site counts all categories within one mile of the searched point for the latest published month.",
      },
      {
        heading: "How it is compiled",
        body: "Forces submit records to the Home Office, which publishes them through the Police.uk API roughly two months in arrears. Scotland is not covered — Police Scotland publishes separately under a different recording standard.",
      },
      {
        heading: "What it is not",
        body: "Recorded crime is not all crime — the Crime Survey for England and Wales estimates offences that are never reported. Counts near busy locations are influenced by footfall, so the site also shows per-population rates at police force area level.",
      },
    ],
    methodology: {
      label: "Police.uk street-level crime method",
      url: "https://data.police.uk/docs/method/crime-street/",
    },
  },
  {
    id: "uk-population",
    title: "How big is the UK population, and how do we know?",
    summary:
      "The mid-year population estimate combines the census with registered births, deaths and migration to estimate usual residents of the UK each year.",
    sections: [
      {
        heading: "What it measures",
        body: "The mid-year estimate counts people usually resident in the UK — those living or intending to live here for 12 months or more — at 30 June each year, by age and sex.",
      },
      {
        heading: "How it is compiled",
        body: "The ONS rolls the census forward using registered births and deaths and its migration estimates, reconciling with the next census when it lands. Scotland and Northern Ireland's statistical agencies produce their own estimates on the same basis, combined into the UK total.",
      },
      {
        heading: "What it is not",
        body: "It is not a live count — estimates are published about a year in arrears and revised after each census. The country-of-birth split on this site comes from the 2021 Census for England and Wales, because the devolved censuses run on their own schedules.",
      },
    ],
    methodology: {
      label: "ONS population estimates methodology",
      url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/populationestimatesforukenglandandwalesscotlandandnorthernirelandqmi",
    },
  },
];

export function explainerById(id: string): Explainer | null {
  return EXPLAINERS.find((e) => e.id === id) ?? null;
}
