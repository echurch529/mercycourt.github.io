# Mercy Court RCCG — Website Template

A modern, responsive website template for Mercy Court RCCG (Redeemed Christian Church of God), Baltimore, Maryland. Built with static HTML and Tailwind CSS.

## Project Overview

This template covers all major pages for a church website, including a homepage, about, ministries, giving, blog, watch live, community impact, and contact. It is designed to be deployed as-is or migrated into a CMS (e.g., WordPress/Elementor).

**Church:** Mercy Court RCCG  
**Location:** 529 Walker Avenue, Baltimore, MD 21212  
**Phone:** +1 (410) 900-9111  
**Email:** info@mercycourt.org

## Tech Stack

- **HTML5** — static pages, no framework required
- **Tailwind CSS** — via CDN with custom theme config inline per page
- **Google Fonts** — Anton (headings), Lato (body)
- **Puppeteer** — screenshot automation for page previews

## Project Structure

```
CCI Template/
├── pages/                    # All website pages
│   ├── index.html            # Homepage
│   ├── who-we-are.html       # About / mission
│   ├── contact.html          # Contact form and location
│   ├── ministries.html       # Ministries overview
│   ├── mercy-kidz.html       # Children's ministry
│   ├── the-new-mc.html       # Ministry page
│   ├── community-impact.html # Outreach
│   ├── watch-live.html       # Live stream
│   ├── blog.html             # News and updates
│   ├── give.html             # Donations
│   └── quick-links.html      # Quick links
├── assets/                   # Organised media library
│   └── 2026/
│       ├── branding/         # Mercy Court logos (orange, black, white)
│       ├── congregation/     # Service photography — arrivals, worship, prayer, full-room
│       ├── community-outreach/ # Food distribution, truck commissioning, children's events
│       ├── event-posters/    # Designed graphics for specific events
│       ├── mercy-kidz/       # Children's ministry classroom photos
│       ├── the-new-mc/       # Youth ministry team photos
│       ├── service-slides/   # In-service screen slides (Bible Study, Sunday School, etc.)
│       ├── miscellaneous/    # Stock / generic images
│       └── documents/        # Archives and PDF files
├── screenshots/              # Generated page previews (Puppeteer)
├── Reference/                # Design reference images
├── elementor-guide.xls       # WordPress/Elementor integration notes
├── package.json
└── README.md
```

## Getting Started

No build step is required — open any page in `pages/` directly in a browser.

To generate page screenshots:

```bash
npm install
node screenshots/screenshot.js
```

## Brand

| Element     | Value                              |
|-------------|-------------------------------------|
| Primary     | `#D95A2B` (red-orange)             |
| Background  | `#0A0A0A` (near black)             |
| Footer      | `#1a1a1a`                          |
| Heading font | Anton (Google Fonts)              |
| Body font   | Lato (Google Fonts)                |

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, service times, leadership, giving CTA |
| About | `who-we-are.html` | Mission, pastor bio, testimonials |
| Ministries | `ministries.html` | Worship, children's, outreach |
| Mercy Kidz | `mercy-kidz.html` | Children's ministry detail |
| Community Impact | `community-impact.html` | Outreach initiatives |
| Watch Live | `watch-live.html` | Streaming content |
| Blog | `blog.html` | News and updates |
| Give | `give.html` | Donation options |
| Contact | `contact.html` | Form, map, social links |
| Quick Links | `quick-links.html` | Navigation hub |

## Known Placeholders (pending client content)

The following items are intentionally left as placeholders and require real content before launch:

| Item | Location |
|------|----------|
| Placeholder images (`placehold.co`) | `ministries.html`, `mercy-kidz.html`, `community-impact.html`, `blog.html` |
| Social media footer links | All pages — replace `href="#"` with real profile URLs |
| Blog "Read More" links | `blog.html` — replace with real post URLs |
| Ministry "Learn More" links | `ministries.html` — replace with real page URLs |
| Quick link button URLs | `quick-links.html` — all 23 buttons use `href="#"` |
| Building Project CTA links | Multiple pages |
| Contact form submission | `contact.html` — add `action` URL or JS handler |
| Email subscription forms | `blog.html`, `give.html`, `watch-live.html` |
| Live stream embed | `watch-live.html` — replace placeholder with YouTube/Vimeo embed URL |
| Donation action buttons | `give.html` |
