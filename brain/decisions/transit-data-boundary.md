# Transit data boundary

- Source: CTA Developer Center and City of Chicago Data Portal
- Confidence: high
- Reviewed: 2026-08-24

Rail Finder may use the keyless City of Chicago `8pix-ypme` station directory
for names, map identifiers, lines, coordinates, and accessibility flags. Cache a
successful normalized response locally so the directory can survive a temporary
network failure.

Do not label this directory as live service or predicted arrivals. CTA Train
Tracker arrivals, positions, and follow-train endpoints require an approved API
key under CTA's developer terms. A future live adapter must keep that key on the
local server, identify prediction freshness, preserve the official data/branding
terms, and fall back explicitly instead of fabricating arrival times.

- Directory: `https://data.cityofchicago.org/resource/8pix-ypme.json`
- Train Tracker overview: `https://www.transitchicago.com/developers/traintracker/`
