# Lessons Learned

## Design & UI

### Gemini-generated images have letterbox black bars
- **Problem**: AI-generated images from Gemini Nano Banana Pro include cinematic letterbox (black bars) at top/bottom
- **Fix**: Use `scale-110` on `<Image>` with `object-cover` to crop the bars within `overflow-hidden` containers
- **Rule**: Always inspect AI-generated images for baked-in borders before using them

### Verify Image component actually exists in JSX
- **Problem**: Hero section had CSS gradients/bokeh but no `<Image>` component — image never rendered
- **Fix**: Must include `<Image src=... fill className="object-cover" />` for background images
- **Rule**: After updating design, visually verify on production that images actually load

### Font color consistency on image overlays
- **Problem**: Mixed `text-primary` (gold) and `text-white` on dark image backgrounds — inconsistent and some colors hard to read
- **Fix**: Use all white variants (`text-white`, `text-white/80`, `text-white/70`) for text on dark image overlays
- **Rule**: On dark backgrounds, stick to white text hierarchy. Reserve accent colors for light backgrounds

## String Matching in Scripts

### Exact string replacement vs regex
- **Problem**: Python `str.replace()` with multi-line strings often fails due to whitespace/indentation mismatches
- **Fix**: Use regex with `re.DOTALL` as fallback when exact string matching fails
- **Rule**: Always have a regex fallback for multi-line replacements, and print which path was taken

### sed vs Python for multi-line edits
- **Problem**: `sed -i` unreliable for complex multi-line patterns
- **Fix**: Use Python scripts for all multi-line file modifications
- **Rule**: Only use sed for simple single-line replacements

## API & External Services

### Gemini image URLs are session-specific
- **Problem**: `lh3.googleusercontent.com/gg-dl/` URLs require session cookies; curl downloads return HTML error pages
- **Fix**: Download images manually or use existing images in the repo
- **Rule**: Never rely on curl/wget for Google service URLs that require authentication

### Google Maps Platform policy compliance
- **Rule**: Don't localize "Google Maps" text (must remain in English)
- **Rule**: Use `translate="no"` HTML attribute on "Google Maps"
- **Rule**: Display photo author attributions (html_attributions from Places API)
- **Rule**: Show proper "Google Maps" text attribution (Roboto font)

### Places API (New) must be explicitly enabled
- **Problem**: Place Photos API returning 502 errors
- **Root cause**: "Places API (New)" not enabled in Google Cloud Console (only legacy "Places API" was enabled)
- **Rule**: Check Google Cloud Console API list when getting 5xx errors from Google APIs

## Deployment & Verification

### Always verify on production after deploy
- **Rule**: After every `git push`, wait for Vercel deployment to complete, then screenshot production site
- **Rule**: Check both visual appearance AND functional behavior

### TypeScript check before commit
- **Rule**: Always run `npx tsc --noEmit` before committing to catch type errors
- **Rule**: When adding new fields to types, update ALL test files that mock those types

## Project-Specific

### Business rules
- シーシャバー is a potential PR banner customer → show with age badge, never hide
- Users under 20 should not see bar/nightclub/居酒屋 recommendations
- UX philosophy: タイパ (time efficiency) and 外さない店 (reliable venues)
- Maps not needed — only travel time matters
- Reservation CTA is important (website link or phone fallback)

### Codespace management
- Codespace auto-stops after inactivity — click "Restart codespace" button
- Always verify git branch (`main` vs feature branches) before making changes
