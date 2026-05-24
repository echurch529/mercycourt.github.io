# RCCG Mercy Court — Website

A modern, responsive static website for RCCG Mercy Court (Redeemed Christian Church of God), Baltimore, Maryland. Built with HTML5 and Tailwind CSS. Deployed to GitHub Pages at [mercycourt.org](https://mercycourt.org).

**Church:** RCCG Mercy Court  
**Location:** 529 Walker Avenue, Baltimore, MD 21212  
**Phone:** +1 (410) 900-9111  
**Email:** info@mercycourt.org  
**GitHub Pages repo:** https://github.com/echurch529/mercycourt.github.io

## Tech Stack

- **HTML5** — static pages, no framework or build step required
- **Tailwind CSS** — via CDN with custom theme config inline per page
- **Google Fonts** — Anton (headings), Lato (body)

## Project Structure

```
mercycourt.github.io/
├── index.html                # Homepage
├── who-we-are.html           # About / mission / pastor bio
├── contact.html              # Contact form and location
├── ministries.html           # Ministries overview
├── mercy-kidz.html           # Children's ministry
├── the-new-mc.html           # Youth ministry
├── community-impact.html     # Outreach
├── watch-live.html           # YouTube livestream embed
├── blog.html                 # News and updates
├── give.html                 # Donations
├── quick-links.html          # Navigation hub (23 links)
├── CNAME                     # mercycourt.org (GitHub Pages custom domain)
├── sitemap.xml               # All 11 pages for search indexing
├── robots.txt                # Allows all crawlers
├── assets/
│   └── images/
│       └── 2026/
│           ├── branding/         # Logos (black, orange, white PNG)
│           ├── leadership/       # Pastor photos (PJ-and-PA.jpeg, etc.)
│           ├── congregation/     # Service photography
│           ├── community-outreach/ # Outreach event photos
│           ├── mercy-kidz/       # Children's ministry photos
│           ├── the-new-mc/       # Youth ministry team photos
│           ├── service-slides/   # In-service screen slides
│           └── miscellaneous/    # Stock / generic images
└── pages/                    # Original source files (not served)
```

## Local Preview

No build step required. Start a local server from the project root:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

## Deployment

The site is deployed via GitHub Pages with a custom domain via Cloudflare.

- All HTML pages are at the repo root so GitHub Pages serves them at `mercycourt.org/<page>.html`
- `CNAME` file contains `mercycourt.org`
- Cloudflare DNS should point to GitHub Pages servers

## Brand

| Element      | Value                    |
|--------------|--------------------------|
| Primary      | `#D95A2B` (red-orange)   |
| Background   | `#0A0A0A` (near black)   |
| Footer       | `#1a1a1a`                |
| Heading font | Anton (Google Fonts)     |
| Body font    | Lato (Google Fonts)      |

## Social Media

| Platform  | URL                                          |
|-----------|----------------------------------------------|
| Facebook  | https://www.facebook.com/rccgmercycourt       |
| Instagram | https://www.instagram.com/rccgmercycourt/     |
| YouTube   | https://www.youtube.com/@RCCGMercyCourt       |

## Pages

| Page             | File                    | Description                                    |
|------------------|-------------------------|------------------------------------------------|
| Home             | `index.html`            | Hero, service times, leadership, giving CTA    |
| About            | `who-we-are.html`       | Mission, pastor bio, testimonials              |
| Ministries       | `ministries.html`       | Worship, children's, outreach                  |
| Mercy Kidz       | `mercy-kidz.html`       | Children's ministry detail                     |
| The New MC       | `the-new-mc.html`       | Youth ministry detail                          |
| Community Impact | `community-impact.html` | Outreach initiatives                           |
| Watch Live       | `watch-live.html`       | YouTube livestream embed + channel link        |
| Blog             | `blog.html`             | News and updates                               |
| Give             | `give.html`             | Donation options                               |
| Contact          | `contact.html`          | mailto form, map, social links                 |
| Quick Links      | `quick-links.html`      | Navigation hub (23 links)                      |

## UI Conventions

- **Hero banners** — all pages with an image hero use `h-[70vh]`, keeping content partially visible below the fold to invite scrolling
- **Nav logo** — the logo in the top-left of every page is wrapped in `<a href="index.html">` so clicking it returns to the homepage
- **Church name** — correct naming convention is `RCCG Mercy Court` (not "Mercy Court RCCG") — enforced across all pages
- **Leadership section** — references both lead pastors: Pastor John Itakpe (PJ) and Pastor Rosemary Itakpe (Paz); photo uses `object-position: center 10%` to keep faces in frame
- **"Maximize Your Potential" CTA** — background image is `congregation-worship-service-07.jpg` (hands raised in worship)

## Navigation Structure

| Nav Item | Dropdown |
|----------|----------|
| Home | — |
| About Us | Contact, Quick Links |
| Ministries | The New MC, God's Heritage |
| Community Impact | — |
| Watch Live | — |
| Blog | — |
| Give | — (button) |

## Remaining Placeholders

The following items still require real content before launch:

| Item | Location |
|------|----------|
| Blog "Read More" links | `blog.html` — replace `href="#"` with real post URLs |
| Building Project CTA links | Multiple pages |
| Email subscription forms | `blog.html`, `give.html`, `watch-live.html` |
| Donation action buttons | `give.html` |
| Contact form backend | `contact.html` — currently mailto, upgrade to Formspree when ready |
| Individual pastor portraits | `assets/images/2026/leadership/` — add `pj.jpg` and `paz.jpg` if separate photos needed |
| Google Maps embed | `index.html`, `contact.html` — replace embed src with a verified API-keyed URL for production |
