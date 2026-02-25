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
- [x] ~~Verify OPENWEATHERMAP_API_KEY is set in Vercel env vars~~ → Removed OpenWeatherMap dependency entirely. Replaced with dateSchedule field + Claude prompt injection (commit 4a558af)
- [ ] Mobile responsiveness full audit (cannot test 390px in this browser)
- [ ] Cleanup unused mapEmbedUrl field (low priority, minimal impact)

## Review Notes
- Latest deploy: commit 5abdbaa (2026-02-24)
- Production URL: https://nightchill-sr5g.vercel.app/
- All TypeScript checks passing
- Hero image with responsive object-position for mobile
- Feature cards: no black bars, consistent white text
- Weather API removed; replaced with dateSchedule field (today/tomorrow/this-weekend/next-week/undecided) + Claude prompt context
- PR #47 closed as redundant
- Gemini image generated: centered couple, navy jacket + beige outfit, Tokyo evening street (session: gemini.google.com/app/36f13b3edd5eda72)

- [x] ~~Form UI redesign: 5-step flow (いつ→どこで→誰と→何をしたい→詳細)~~ (commit 87c6c5a)
  - Rewrote types.ts: new PlanRequest with dateStr/startTime/endTime/relationship/activities[]
  - Rewrote plan/page.tsx: 5-step wizard with progress indicator
  - Rewrote ai-planner.ts: improved system prompt for diversity, weather, minimum spot count
  - Rewrote route.ts: new validation for activities[] and relationship fields
  - Rewrote planner.ts: template fallback with new PlanRequest
  - Updated plan-encoder.ts: removed occasion/mood from CompactPlan
  - Updated results/page.tsx: removed occasion/mood display
  - Updated test files: new mock objects matching VenueFactData
  - Added globals.css: fadeIn animation + scroll-behavior smooth
  - Temperature increased to 0.95 for AI diversity
  - 10 files changed, 648 insertions(+), 1023 deletions(-)

## Review Notes (Phase 2)
- Latest deploy: commit 87c6c5a (2026-02-25)
- Production URL: https://nightchill-sr5g.vercel.app/plan
- All TypeScript checks passing (EXIT_CODE=0)
- Verified 5-step form on production: all steps render correctly
- Backup tag: v1.1.0-pre-form-refactor
