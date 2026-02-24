# Project Todo

## Completed
- [x] Place-photo API 502 error → enabled Places API (New) in Google Cloud
- [x] Google Maps Platform policy compliance (attributions, translate="no")
- [x] Cache TTL reduction + browser cache busting
- [x] English version SpotPhoto + Google Maps links
- [x] Date plan venue recommendation (Anthropic API)
- [x] Google Maps embed → replaced with GBP photos + CTA
- [x] GBP photo links (not reviews), clickable photos
- [x] Date type selection (食事のみ/半日/終日/お泊まり)
- [x] Age verification (20歳未満/20歳以上)
- [x] Alcohol venue badges (🔞)
- [x] Top page hero background image
- [x] Photo-based feature cards with dark overlay
- [x] Fix hero image not displaying (missing Image component)
- [x] Fix feature card letterbox black bars (scale-110 crop)
- [x] Fix inconsistent font colors on feature cards (unified white)
- [x] Create tasks/lessons.md and tasks/todo.md
- [x] Weather API integration (OpenWeatherMap) — already in main
- [x] Mobile hero responsive object-position (35% for portrait crop)
- [x] Close redundant PR #47 (fix/place-photo-debug)

## Pending
- [ ] Swap hero image with Gemini-generated 4K centered couple image (user to download from Gemini session: gemini.google.com/app/36f13b3edd5eda72)
  - Hero: couple in red lantern Tokyo alley at twilight (1024x687)
  - Omotesando feature card: tree-lined avenue at golden hour (1024x572)  
  - Ginza feature card: luxurious evening scene with crystal-lit buildings (1024x572)
  - Shibuya feature card: vibrant crossing + cozy izakaya window (1024x572)
  - Download each image, rename to match: daikanyama-stylish-date-hero.png, omotesando-date-hero.png, ginza-luxury-date-hero.png, shibuya-casual-date-hero.png
  - Place in public/images/ and commit
- [ ] Hero video option (user may create video: 1920x1080, 16:9, 10-15s loop, <5MB WebM)
- [ ] Verify OPENWEATHERMAP_API_KEY is set in Vercel env vars
- [ ] Mobile responsiveness full audit (cannot test 390px in this browser)
- [ ] Cleanup unused mapEmbedUrl field (low priority, minimal impact)

## Review Notes
- Latest deploy: commit 5abdbaa (2026-02-24)
- Production URL: https://nightchill-sr5g.vercel.app/
- All TypeScript checks passing
- Hero image with responsive object-position for mobile
- Feature cards: no black bars, consistent white text
- Weather API fully integrated in ai-planner.ts
- PR #47 closed as redundant
- Gemini image generated: centered couple, navy jacket + beige outfit, Tokyo evening street (session: gemini.google.com/app/36f13b3edd5eda72)
