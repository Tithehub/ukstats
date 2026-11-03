// Verified YouTube channels per country, checked 2026-11-03 with yt-dlp: each entry carries
// YouTube's own verified badge and the subscriber count YouTube reported that day. Thumbnails
// are the channels' original avatars on YouTube's CDN. "official" = government bodies;
// "msm" = mainstream media (state-owned flagged); "alt" = alternative media. Only "official"
// is ever presented as official.
export const BROADCAST_CHECKED = "2026-11-03";

export type BroadcastKind = "official" | "msm" | "alt";
export interface BroadcastChannel { kind: BroadcastKind; name: string; handle: string; channelId: string; subscribers: number; avatar: string; state?: true }

/** Keyed by countryKey(). Countries with no verified channel are absent rather than guessed. */
export const BROADCAST_CHANNELS: Record<string, BroadcastChannel[]> = {
  "united states": [
    {
      "kind": "official",
      "name": "The White House",
      "handle": "@WhiteHouse",
      "channelId": "UCYxRlFDqcWM4y7FfpiAN3KQ",
      "subscribers": 3350000,
      "avatar": "https://yt3.googleusercontent.com/UJ0CYk_LQ7cPIGXE7aIpLLv8OdTuU7wQ9Ygrdl2qLSSBBPei4l6wI5HL_cuOS00lzD81XJDj=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "official",
      "name": "U.S. Department of State",
      "handle": "@StateDept",
      "channelId": "UC6ZhpmNnLxlOYipqh8wbM3A",
      "subscribers": 508000,
      "avatar": "https://yt3.googleusercontent.com/xLytQ2ZPG9GUfsxsLD6FHkL_jqpYX2N9mpXrIvNgqHNb5ifPqGtV84wSadTjjmwBEB9_Dy8ksk4=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "CNN",
      "handle": "@CNN",
      "channelId": "UCupvZG-5ko_eiXAupbDfxWw",
      "subscribers": 20000000,
      "avatar": "https://yt3.googleusercontent.com/wSqAf5WdxsGsl7ZMtlyfz3qKULo_URoFjmKky0gLThm_Jtu2wsVHMu-XzGZPAb-z8zeMBYUUMYA=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "Fox News",
      "handle": "@FoxNews",
      "channelId": "UCXIJgqnII2ZOINSWNOGFThA",
      "subscribers": 15500000,
      "avatar": "https://yt3.googleusercontent.com/G3gLy3HBgiZ21mEt1uzR0VPA6VXpsgJReuD7Z91nHwcgyFVu_QpHNpxuULN1D0YEQBwD0F1HwQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "alt",
      "name": "Timcast IRL",
      "handle": "@TimcastIRL",
      "channelId": "UCLwNTXWEjVd2qIHLcXxQWxA",
      "subscribers": 2800000,
      "avatar": "https://yt3.googleusercontent.com/cvahaaQdU02e_wn5tNdfnGtT6u1nHGR5A2gtmGrQe1KoVFKZPsXJwZgkIsGjU67OiO0J96SYkyM=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "united kingdom": [
    {
      "kind": "official",
      "name": "10 Downing Street",
      "handle": "@10DowningStreet",
      "channelId": "UC8o7mIMg3mmO9-dx3e2iFgw",
      "subscribers": 307000,
      "avatar": "https://yt3.googleusercontent.com/BXXgxWLN6bmABx2pT2DtmlMx-lzN5nE2VQhqvJU-17Y3v1nT0siR0gIXFb81NO38I8vuOXxOQ7w=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "official",
      "name": "Home Office",
      "handle": "@ukhomeoffice",
      "channelId": "UC697e0rGEZK8tO-qmFN6kag",
      "subscribers": 70300,
      "avatar": "https://yt3.googleusercontent.com/XFF_n7VVvAcJtLeLURDaKWbArOTZz4tObMhPhrq9N0q0ZcxY_oyk2tbNY3PxfUQ3LBbzS7_a=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "BBC News",
      "handle": "@BBCNews",
      "channelId": "UC16niRr50-MSBwiO3YDb3RA",
      "subscribers": 20200000,
      "avatar": "https://yt3.googleusercontent.com/v4JamQ9B-PUiJHjmZQs9UwTaoLQW8vijJMMpV5QvA2wHQ6iwWM8Q1s6O4jgTl0dtDigVWAi7SA=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "Sky News",
      "handle": "@SkyNews",
      "channelId": "UCoMdktPbSTixAyNGwb-UYkQ",
      "subscribers": 9390000,
      "avatar": "https://yt3.googleusercontent.com/dGnkztdrLtXRlzkdqReeL-NES2761xxmNVcJhGKqFpR0vQBoP9XaxnXF95FDpwrjyFr2iJvV8Es=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "alt",
      "name": "GBNews",
      "handle": "@GBNewsOnline",
      "channelId": "UC0vn8ISa4LKMunLbzaXLnOQ",
      "subscribers": 2200000,
      "avatar": "https://yt3.googleusercontent.com/8hySIA7Ed6amMiAHJVNsG9oph0zoSlCAffYTmINH3gXJ8vvcToB_xh7uIlKSHA9fBEae3e_yl6I=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "france": [
    {
      "kind": "official",
      "name": "Gouvernement",
      "handle": "@gouvernementFR",
      "channelId": "UCfQpT8ebZlk8PndKVNTiAvA",
      "subscribers": 388000,
      "avatar": "https://yt3.googleusercontent.com/6bVJiXcI0zSZT8FpBkQ3ZITWksjXdAo1hjyOrQOEmSiU_fe5QCN_kR7RFitsJ6XOVy_ZewLi1A=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "official",
      "name": "Élysée",
      "handle": "@elysee",
      "channelId": "UCPaeEhnVIdn4T01gUphIltw",
      "subscribers": 167000,
      "avatar": "https://yt3.googleusercontent.com/ytc/AIdro_nFO-OPWtIJXJaweUY63ZsdLnbg5RaQqqsPmMo7z0Hm=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "FRANCE 24 English",
      "handle": "@France24_en",
      "channelId": "UCQfwfsi5VrQ8yKZ-UWmAEFg",
      "subscribers": 3700000,
      "avatar": "https://yt3.googleusercontent.com/ytc/AIdro_n_QTJ5-GLGnftQFkb7Kp36W2eBH3H-7ZqTQxzFkkqGrIE=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "BFMTV",
      "handle": "@BFMTV",
      "channelId": "UCXwDLMDV86ldKoFVc_g8P0g",
      "subscribers": 2710000,
      "avatar": "https://yt3.googleusercontent.com/l5yh1ebjlfahsfKc48zmOeqU-QGi3EMRN2hQPcK5wfTJ7MheP1fB3hId08940ANl_AK1RtHt=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "germany": [
    {
      "kind": "official",
      "name": "Bundesregierung",
      "handle": "@bundesregierung",
      "channelId": "UCcnFmkINMo4Jmkx5mvlCh6g",
      "subscribers": 66500,
      "avatar": "https://yt3.googleusercontent.com/xq_jPsDfHasI4nIUhNAhRot-fBFbZqP-Hm-n5ycgFc6xuOcZcHpHAHmX-VMuZv3A-5M7FXxz=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "DW News",
      "handle": "@dwnews",
      "channelId": "UCknLrEdhRCp1aegoMqRaCZg",
      "subscribers": 6490000,
      "avatar": "https://yt3.googleusercontent.com/NSOdTQTWlqMy8O_j32dx-ftfTCHMOt04Hm7KZ4pfAK6-eQzQSZMWvvss90kG8KQfJ7iNP3phyA=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "tagesschau",
      "handle": "@tagesschau",
      "channelId": "UC5NOEUbkLheQcaaRldYW5GA",
      "subscribers": 2270000,
      "avatar": "https://yt3.googleusercontent.com/9EmplOcwPUsr4FnvxJx_vQe8octHR-lmvdMBu5KEo1PfFWZQWV1QPg30v4YX4OQiA0matxfrCn0=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "alt",
      "name": "NIUS",
      "handle": "@NIUSde",
      "channelId": "UCQGqiGhMjc_p4lZEhSTb12g",
      "subscribers": 633000,
      "avatar": "https://yt3.googleusercontent.com/HdmG9Z5EWAG9CqlBJqHUOGHurhgJrRA7Ju9cHrdBi6-bZJl0LqNbO9ULbLNrnEN0Xm0kxmBfWSc=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "italy": [
    {
      "kind": "official",
      "name": "Palazzo Chigi",
      "handle": "@palazzochigi",
      "channelId": "UCp8W1bzofvzB8MfZSkYW2xw",
      "subscribers": 221000,
      "avatar": "https://yt3.googleusercontent.com/wBWei8Fsf9fadGd8ktvQo11G-miLLXtlXWB56omFKEGYSXIUUpBlNcGp5TOpEo4Gv34URSlVUvA=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "Sky tg24",
      "handle": "@SkyTG24",
      "channelId": "UCz6E3lF72mb6uoJ-mOlNo2A",
      "subscribers": 171000,
      "avatar": "https://yt3.googleusercontent.com/yRYEsj7tMUOtTj443FRfGqnmuMrPQKj0Fjo_YzqmdLN2Yv10ya7CFwOgB9-NrgQKytThFian=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "RaiNews",
      "handle": "@RaiNews",
      "channelId": "UCxqR9g_1XlnfrqwHK9viwCw",
      "subscribers": 164000,
      "avatar": "https://yt3.googleusercontent.com/OZxAUlfDYjG3nPgUIn3sXitxGyHtLE8mt5RZPZUMe8jajHH_nS_S1ND5-oKq1RUrftry4NqR=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "poland": [
    {
      "kind": "msm",
      "name": "TVP Info",
      "handle": "@TVPInfo",
      "channelId": "UCzQZbOb86WvhOPoR7jgAfsA",
      "subscribers": 546000,
      "avatar": "https://yt3.googleusercontent.com/oim6cqpb5QhUF_AXwmciICW9dM-ftPPF45Wr_bqbiaDnDojUOnawj69pXN88gKlqS9vSm8sT-Hc=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "tvn24",
      "handle": "@tvn24",
      "channelId": "UC3R8278fJUWn2ysrOCJrmAQ",
      "subscribers": 218000,
      "avatar": "https://yt3.googleusercontent.com/Nl3dQCsDLBowKirCvKzMNcruWPjaNUAohxJzXz19bHsZy7fopYe57ctzblCCfqK58MkE7GubSEs=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "alt",
      "name": "Kanał Zero",
      "handle": "@KanalZeroPL",
      "channelId": "UClhEl4bMD8_escGCCTmRAYg",
      "subscribers": 2400000,
      "avatar": "https://yt3.googleusercontent.com/JYzME6mj72Cx-S4j60dosUU4HKv6bc0Zl0c9nJtKK7V5Qabqox5DNvnO8DjbzJYyabJJpocAcDo=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "india": [
    {
      "kind": "official",
      "name": "Narendra Modi",
      "handle": "@narendramodi",
      "channelId": "UC1NF71EwP41VdjAU1iXdLkw",
      "subscribers": 31500000,
      "avatar": "https://yt3.googleusercontent.com/UkHAndHfP8kM_G0-rYjIi882mFD-337fI2tDpN1uFasFjFKllur19MGtkCbnRZ-YNE8F_LKjeg=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "official",
      "name": "PIB India",
      "handle": "@PIBIndia",
      "channelId": "UCGn6a5SI8SNlj7WylmPD6GQ",
      "subscribers": 2050000,
      "avatar": "https://yt3.googleusercontent.com/yoGXymisXMpBEyULQqvelXF19ZT3IF2HAb91XdJ4oTMKAW4ExA7v5pIbQKJbxIO61KOfFFEQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "Aaj Tak",
      "handle": "@aajtak",
      "channelId": "UCt4t-jeY85JegMlZ-E5UWtA",
      "subscribers": 75700000,
      "avatar": "https://yt3.googleusercontent.com/e8YzAY8Y5P2a068WGiccAx5gJVZjHtVDnJdKoEkp6vMNSy_LzV8kN7Bn8gRIdOf57y8puxwqOpM=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "NDTV",
      "handle": "@NDTV",
      "channelId": "UCZFMm1mMw0F81Z37aaEzTUA",
      "subscribers": 16100000,
      "avatar": "https://yt3.googleusercontent.com/mOb3OXPZO0-7LmZ0Y4o_wz2imPJ7aFa_isYXg0awkLyL1ehglmsiQD4rWxwrUrfXLK9jlh35=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "indonesia": [
    {
      "kind": "official",
      "name": "Sekretariat Presiden",
      "handle": "@SekretariatPresiden",
      "channelId": "UC_m_NBgf7ieJBHzb6vvJC5A",
      "subscribers": 3200000,
      "avatar": "https://yt3.googleusercontent.com/4LLJwJtobxtRUiyNT3FyAf2i9DX37GlFULZivj_CNkrm_zyxMUYG8f_s9lvYk6JbylCIUkC7oQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "KOMPASTV",
      "handle": "@KOMPASTV",
      "channelId": "UC5BMIWZe9isJXLZZWPWvBlg",
      "subscribers": 20100000,
      "avatar": "https://yt3.googleusercontent.com/zjKbjnC7zktWR7pw8AeuvW0Br9Xsk-MPW8JiVgKlF1K4vxiieEOqTk9WqrX1aDYScMoDDUmNDQ=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "china": [
    {
      "kind": "msm",
      "name": "CGTN",
      "handle": "@CGTN",
      "channelId": "UCgrNz-aDmcr2uuto8_DL2jg",
      "subscribers": 9180000,
      "avatar": "https://yt3.googleusercontent.com/ZswtbrleL4K7ameGvmiWb-FTsBCPpWf9Awwt6rUTQtbKe-sf1MbdvxtCGAqcdp7rksGs0oi1=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "pakistan": [
    {
      "kind": "msm",
      "name": "Geo News",
      "handle": "@geonews",
      "channelId": "UC_vt34wimdCzdkrzVejwX9g",
      "subscribers": 21300000,
      "avatar": "https://yt3.googleusercontent.com/ba1XSUznVGirkC7dP-iDCf3EcL8uUjDea3-4wxkqdyWGUlCVwLXotwRNdjQBRYg7VQ4dIEI7=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "DawnNews English",
      "handle": "@DawnNewsEnglish",
      "channelId": "UC_xWTNsx7zA2uI0ydQikViA",
      "subscribers": 567000,
      "avatar": "https://yt3.googleusercontent.com/xyx3LozGgTjuadD40XCi3Hx6FHbDHHmm97m5-hP6MiLeXS98XrRIuRqMBxoGULeEzLEAgNjuuJY=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "PTV News",
      "handle": "@PTVNewsOfficial",
      "channelId": "UC5RvV_LtR1dxPCVFGw6dxXA",
      "subscribers": 458000,
      "avatar": "https://yt3.googleusercontent.com/nnqueGOaGSP81pIgfClenqnT2fGNiQH0pgX35GVqWFeO-YLk3dUPWhaAdaHN0w0IXosHxrPM=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "brazil": [
    {
      "kind": "official",
      "name": "CanalGov",
      "handle": "@CanalGov",
      "channelId": "UCjaWLFTNqLkq3ZY2BJ4NYRg",
      "subscribers": 1680000,
      "avatar": "https://yt3.googleusercontent.com/x4z0ZuhvPPSrUqYhWIpwhAEbtVL1oTXwG52AYl-ju9Qhs7fLY2qbU-EzH7YA6Xkxl0Nk7td5=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "CNN Brasil",
      "handle": "@CNNbrasil",
      "channelId": "UCvdwhh_fDyWccR42-rReZLw",
      "subscribers": 7240000,
      "avatar": "https://yt3.googleusercontent.com/TUNo33rJfSv06L2UyQWsOPUMJglHptsHR2mFZOshcXL45xRJ1YgpRZWpb76IChbSBwyG1TBUvA=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "GloboNews",
      "handle": "@globonews",
      "channelId": "UCp6RRaz93Pt2xYZoEye_rLA",
      "subscribers": 1280000,
      "avatar": "https://yt3.googleusercontent.com/EPbkNb6s7LnU4mE0ZH4C4-hEt-XcxnTC5DzWhxh7EVFwseSMWC2p6E88xBlOoQXzD-5exgYAcQ=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "bangladesh": [
    {
      "kind": "msm",
      "name": "Jamuna TV",
      "handle": "@JamunaTVbd",
      "channelId": "UCN6sm8iHiPd0cnoUardDAnw",
      "subscribers": 31100000,
      "avatar": "https://yt3.googleusercontent.com/54prTx28YpPxSpk_PfJGuOfQgcZbNdvbfk0adGePrAvINO4Mo9_bw3j-J4seXn6hNGuMr1ck=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "SOMOY TV",
      "handle": "@somoynews360",
      "channelId": "UCxHoBXkY88Tb8z1Ssj6CWsQ",
      "subscribers": 28900000,
      "avatar": "https://yt3.googleusercontent.com/HIVp56M09fDcVPKGpRXkl47xJcG7JGV5Mwn8E_7TlwmPgjgg1MQ7t_oxiy4xkmgo5fmWxilY3yU=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "russia": [
    {
      "kind": "official",
      "name": "kremlin",
      "handle": "@Kremlin",
      "channelId": "UCZkiUDyOBtkaTWGRfGnKaHw",
      "subscribers": 417000,
      "avatar": "https://yt3.googleusercontent.com/ytc/AIdro_mtGnJiY7q45VrmrRUCSrvbGvPb3hAIdmpu2MEqK3Iv0Ls=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "TV Rain",
      "handle": "@tvrain",
      "channelId": "UCdubelOloxR3wzwJG9x8YqQ",
      "subscribers": 4960000,
      "avatar": "https://yt3.googleusercontent.com/uj8ImTYx1CcDh-bzkQTuQtQraux10NPB9vAFUm8cMREr6TOUFAXU6HrogH8wg8PlFxnSVO1L1g=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "ethiopia": [
    {
      "kind": "msm",
      "name": "EBC",
      "handle": "@EBCworld",
      "channelId": "UCOhrz3uRCOHmK6ueUstw7_Q",
      "subscribers": 2200000,
      "avatar": "https://yt3.googleusercontent.com/P1ygQZTLvHsMcCtZlC2Dbql4Mzd__gGKfQtKewm_hF8D6FEWfdg_XEEP6rzH68hTIQiGugkY=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "mexico": [
    {
      "kind": "official",
      "name": "Gobierno de México",
      "handle": "@GobiernodeMexico",
      "channelId": "UCvzHrtf9by1-UY67SfZse8w",
      "subscribers": 1130000,
      "avatar": "https://yt3.googleusercontent.com/ntwZ1nZGTxwE2vMpymiyEW3iJyAWBjbKv9M6aDVEBpkA-D9dH2hKKht-N4HpB_IEiYJZQ_KdWw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "NMás",
      "handle": "@nmas",
      "channelId": "UCUsm-fannqOY02PNN67C0KA",
      "subscribers": 9350000,
      "avatar": "https://yt3.googleusercontent.com/LS9cwO8HbaSm2eut9R5cQaz9eARzkWkoimKs4RQm5x6CDH9tCfYhsTw4yj-uq5Rz4GU3ZZC8WQ=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "japan": [
    {
      "kind": "msm",
      "name": "ANNnewsCH",
      "handle": "@ANNnewsCH",
      "channelId": "UCGCZAYq5Xxojl_tSXcVJhiQ",
      "subscribers": 5090000,
      "avatar": "https://yt3.googleusercontent.com/YNCCp1NNe4z2aL7Iv82YHL8qKYmU6uOSn8NKep4qKRBK_E2XJCF5evjRiArUbs-gmLX2dnwtIQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "NHK",
      "handle": "@nhk",
      "channelId": "UCip8ve30-AoX2y2OtAAmqFA",
      "subscribers": 4570000,
      "avatar": "https://yt3.googleusercontent.com/ytc/AIdro_kP84At-9gzRK4jqaZNOpOWVSbsSu22SWrHHe0r_-khdHHE=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "vietnam": [
    {
      "kind": "msm",
      "name": "VTV24",
      "handle": "@VTV24",
      "channelId": "UCabsTV34JwALXKGMqHpvUiA",
      "subscribers": 7010000,
      "avatar": "https://yt3.googleusercontent.com/WkRGl-uLsgZ8pwNxDnWTk6J1Xji1ZTOyyGia_dNapDkYnVDhlYu2X4Klc8hfdBY4CS15G7DPvFA=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "philippines": [
    {
      "kind": "msm",
      "name": "ABS-CBN News",
      "handle": "@abscbnnews",
      "channelId": "UCE2606prvXQc_noEqKxVJXA",
      "subscribers": 19300000,
      "avatar": "https://yt3.googleusercontent.com/LtCFX_IgcqOXKsqhTYjkMwMTFo42j6WJCehxqSFNq3fWyr6io-3cdQhh5KC3evcxltETifDkuQ=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "GMA News",
      "handle": "@gmanews",
      "channelId": "UCqYw-CTd1dU2yGI71sEyqNw",
      "subscribers": 18300000,
      "avatar": "https://yt3.googleusercontent.com/Gwe8ZHt5B2ZxijlgvtnALf1BPpzJQg8bK-IyB1iwe_OZEHy8Hwh0Q-FrRM5G46S132a451g3Cw=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "turkey": [
    {
      "kind": "msm",
      "name": "TRT World",
      "handle": "@trtworld",
      "channelId": "UC7fWeaHhqgM4Ry-RMpM2YYw",
      "subscribers": 10300000,
      "avatar": "https://yt3.googleusercontent.com/luLQWmGFG4iDC1U_2JlzZ1mquci_sUdfZfFl4eWgBkDpW6tvZT0MEA4c4JebJdi9hCo518q1=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "CNN TÜRK",
      "handle": "@cnnturk",
      "channelId": "UCV6zcRug6Hqp1UX_FdyUeBg",
      "subscribers": 2290000,
      "avatar": "https://yt3.googleusercontent.com/H6Fh64z_Vb9AYevqCPwgeyRAyd4mye6fqU2HN5Jj1RWtrtK5lbU3B2Nkxc_nJfpN_WpI5_flfBk=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "TRT Haber",
      "handle": "@trthaber",
      "channelId": "UCBgTP2LOFVPmq15W-RH-WXA",
      "subscribers": 1470000,
      "avatar": "https://yt3.googleusercontent.com/X-b7tJvjfBMDHCAafwyNV89qJ_FlzlXChymSisVsncnPpgOLLHknR6n1wtm8huk0SJz3KhNRTQ=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "thailand": [
    {
      "kind": "msm",
      "name": "Thai PBS",
      "handle": "@ThaiPBS",
      "channelId": "UC5TOFhyb_LxL2VG_Zenhpzw",
      "subscribers": 10500000,
      "avatar": "https://yt3.googleusercontent.com/_iSBN-mYxxKmlvxY8f26CSTnlbMfBoD1VAE7PNsD5SOrVoC2YC0Vrb8RiWlujNxDMlObQmbYDw=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "iran": [
    {
      "kind": "msm",
      "name": "Iran International",
      "handle": "@iranintl",
      "channelId": "UCat6bC0Wrqq9Bcq7EkH_yQw",
      "subscribers": 1240000,
      "avatar": "https://yt3.googleusercontent.com/NToSNgHiaYMOYYCTpOrhgtq5B_2KmAKrp5tCEKOAni5moCZhavDhY4FIhsPi6GG6lgwqE24O6Mo=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "BBC Persian",
      "handle": "@BBCNewsPersian",
      "channelId": "UCHZk9MrT3DGWmVqdsj5y0EA",
      "subscribers": 1230000,
      "avatar": "https://yt3.googleusercontent.com/ytc/AIdro_n2v3RuCAyxj4wJ4mMphlWm23BBzPNOzCvilxkETADBJhI=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    }
  ],
  "nigeria": [
    {
      "kind": "msm",
      "name": "Channels Television",
      "handle": "@ChannelsTelevision",
      "channelId": "UCEXGDNclvmg6RW0vipJYsTQ",
      "subscribers": 3850000,
      "avatar": "https://yt3.googleusercontent.com/hBmtX1OA-mMEdfPqPdLzFxVeAlXKrc_wLU2z0la9sjIuTdjH_L7ISQl89c1AG2fkRAIQlTz_Hw=s88-c-k-c0x00ffffff-no-rj"
    },
    {
      "kind": "msm",
      "name": "TVC News Nigeria",
      "handle": "@TVCNewsNigeria",
      "channelId": "UCgp4A6I8LCWrhUzn-5SbKvA",
      "subscribers": 1530000,
      "avatar": "https://yt3.googleusercontent.com/5LJSCQAyVpMCl2gp-fADOAkEfJ0VOpxmhtMkGe6RDogNeCbOFxmaOD9qjksTKCRj9XLoGR-pyw=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "south africa": [
    {
      "kind": "msm",
      "name": "SABC News",
      "handle": "@SABCDigitalNews",
      "channelId": "UC8yH-uI81UUtEMDsowQyx1g",
      "subscribers": 3400000,
      "avatar": "https://yt3.googleusercontent.com/kt7KGuaHi5CanLpbqBYAPjEPniZvUeg1DbmJFavd1H4OqmOVXZNogo3Qn9FPkiALMlp9EsGlP50=s88-c-k-c0x00ffffff-no-rj",
      "state": true
    },
    {
      "kind": "msm",
      "name": "eNCA",
      "handle": "@eNCAnews",
      "channelId": "UCI3RT5PGmdi1KVp9FG_CneA",
      "subscribers": 1870000,
      "avatar": "https://yt3.googleusercontent.com/7_AEy7nfANZN3gVxUSdaXLL8bnwB1NQTljZLJVXaZuJFfSg27Qh7QD6ceZblD1Ae9jE-rmpn=s88-c-k-c0x00ffffff-no-rj"
    }
  ],
  "tanzania": [
    {
      "kind": "msm",
      "name": "Azam TV",
      "handle": "@AzamTVTZ",
      "channelId": "UCpHiA0taMn231yDiUeqoANw",
      "subscribers": 3340000,
      "avatar": "https://yt3.googleusercontent.com/mNBjACYJld_a4efrxMte5uOI5oqjIHPa5fWLpQ7J_e-UcDVzBlr1BQlq2Ic-fpA3xbqMNdhV-A=s88-c-k-c0x00ffffff-no-rj"
    }
  ]
};
