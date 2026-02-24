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

## Pending
- [ ] Weather API integration (OpenWeatherMap) for date planning
- [ ] Swap Gemini-generated images (user may download manually from Gemini session)
- [ ] Hero video option (user may create video: 1920x1080, 16:9, 10-15s loop, <5MB WebM)
- [ ] Mobile responsiveness testing
- [ ] Close redundant PR #47 (fix/place-photo-debug)
- [ ] Cleanup unused fields: googleMapsUrl, mapEmbedUrl in VenueFactData
- [ ] Weather-appropriate clothing suggestions in AI planner

## Review Notes
- Latest deploy: commit 1f86d61 (2024-02-24)
- Production URL: https://nightchill-sr5g.vercel.app/
- All TypeScript checks passing
- Hero image renders correctly with daikanyama photo
- Feature cards: no black bars, consistent white text
