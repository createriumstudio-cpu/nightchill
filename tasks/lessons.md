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

### Responsive object-position for hero images
- **Problem**: Hero image couple cropped out on mobile portrait viewports (object-cover centers by default)
- **Fix**: Use `object-[Xpct_center]` on mobile where X = subject horizontal position, `md:object-center` for desktop
- **Rule**: Always consider how `object-cover` crops on portrait vs landscape viewports. If the subject is off-center, add responsive object-position

### Browser window minimum size limitation
- **Problem**: `resize_window` tool cannot actually achieve narrow mobile widths (390px) — browser has minimum window size
- **Rule**: Cannot visually verify mobile layouts directly. Verify CSS logic is correct instead, and ask user to test on their device

### Check existing code before implementing features
- **Problem**: Created a todo for Weather API integration, but it was already fully implemented and merged to main
- **Fix**: Always check current codebase (`grep -rn`) before starting a feature implementation
- **Rule**: Search for existing implementations before writing new code


## Lesson: Gemini Image Download Limitation (2026-02-24)
- Gemini image URLs (lh3.googleusercontent.com/gg/) are session-authenticated
- Cannot download via curl from external environments (returns HTML login page)
- Canvas toDataURL fails (tainted canvas from cross-origin images)
- Fetch with credentials fails (CORS blocks cross-origin fetch)
- **Workaround**: User must manually download images from Gemini lightbox (click image → download icon in top-right)
- Alternative: Use the Gemini download button in the UI, then upload to repo manually

## Lesson: Gemini Multi-line Prompt Sending (2026-02-24)
- Enter key adds newline in Gemini input (does not send)
- Must click the send arrow button (▶) at bottom-right of input area
- In image creation mode, send button appears as blue arrow when text is present
- Stop button (■) appears while generating - can be confused with send button
- For reliability, send one image prompt at a time rather than multi-image prompts

## Lesson: Question API Necessity Before Implementation (2026-02-25)
- **Problem**: OpenWeatherMap API was fetching only current weather (not forecast), making it potentially misleading for date planning
- **Insight**: User pointed out that if you know the date and area, Claude can infer weather context from its training data (seasonal patterns, Tokyo climate)
- **Fix**: Removed OpenWeatherMap entirely. Added `dateSchedule` field (today/tomorrow/this-weekend/next-week/undecided) to the plan form. Claude's prompt now includes date context for weather-aware recommendations
- **Rule**: Before implementing/fixing an API integration, ask "Is this API actually necessary?" — sometimes the AI model itself can handle the context
- **Result**: Eliminated an external dependency, removed API key management overhead, and improved UX (user picks a date range instead of seeing weather data)

## Lesson: sed -i Syntax Differs Between macOS and Linux (2026-02-25)
- `sed -i '' 'command' file` — macOS (BSD sed, requires empty string for in-place)
- `sed -i 'command' file` — Linux (GNU sed, no empty string needed)
- GitHub Codespaces runs Linux, so use the Linux syntax
- **Rule**: For cross-platform scripts, prefer Python over sed for file manipulation

## Lesson: Python str.replace Fails on Multi-line Code Patterns (2026-02-25)
- **Problem**: `str.replace()` with hardcoded multi-line strings often fails because the actual file has different whitespace, line breaks, or formatting
- **Fix**: Use line-by-line iteration with pattern detection for surgical code modifications
- **Rule**: For multi-line code patches in terminals, use Python with `readlines()` + line-by-line scanning rather than whole-string `.replace()`

## Lesson: TypeScript Test Files Need Full Type Compliance (2026-02-25)
- **Problem**: After adding `dateSchedule` to `PlanRequest` type, all mock objects in test files also needed the field
- **Fix**: Used glob-based Python script to find and patch all test files
- **Rule**: When modifying a TypeScript type, search all `*.test.ts` files for mock objects of that type and update them too

## Lesson: Python File Manipulation Size Check (2026-02-25)
- **Problem**: Python `re.sub` with DOTALL on large files can cause catastrophic duplication (ai-planner.ts grew to 1.5GB)
- **Fix**: Always check output file size before writing: `if len(content) > 100000: raise Error`
- **Rule**: Never use regex replacement for multi-line code blocks. Use `readlines()` + line-by-line scanning instead

## Lesson: CompactPlan/Encoder Must Match DatePlan Interface (2026-02-25)
- **Problem**: When removing fields from DatePlan (occasion, mood), CompactPlan interface and toCompact/fromCompact must also be updated
- **Fix**: Use `grep -n` to find exact line numbers and `sed -i 'Nd'` to delete specific lines
- **Rule**: After modifying an interface, grep for all references across the codebase: `grep -rn 'fieldName' src/`

## Lesson: TypeScript Record Indexing Requires Exact Key Type (2026-02-25)
- **Problem**: `Record<DateSchedule, string>[request.dateStr]` fails when dateStr is `string` not `DateSchedule`
- **Fix**: Cast to `Record<string, string>` or add fallback: `(labels as Record<string, string>)[key] || key`
- **Rule**: When changing a field's type (e.g., from enum to free-form string), check all Record lookups using that field

## Lesson: AI Prompt Engineering for Diversity (2026-02-25)
- **Problem**: AI generates the same 2 stores every time despite temperature=0.95
- **Fix**: Added random seed to prompt, explicit diversity rules, relationship×mood cross-matching rules, minimum spot count by duration, season/weather rules
- **Rule**: High temperature alone doesn't guarantee diversity. The system prompt needs explicit "vary your output" instructions, and the user prompt needs a random element

## Lesson: Multi-day Date Form Design (2026-02-25)
- **Problem**: Travel/overnight dates need start and end dates, but endDate field is in Step 1 while travel selection is in Step 4
- **Fix**: Conditionally show endDate when travel activity is selected. User can go back to Step 1 to fill it in
- **Rule**: Consider form flow order when adding conditional fields that depend on later steps

## Lesson: Shell Heredoc + Backtick Safety (2026-02-25)
- **Problem**: Python heredoc (`<< 'PYEOF'`) with `\`` for backticks outputs literal `\` + backtick, not just backtick
- **Rule**: For TypeScript template literals with backticks, write content to separate temp files using bash `<< 'EOF'` (quoted EOF prevents shell interpretation including backticks), then use Python to splice them into the target file
- **Rule**: Always use `chr(96)` for backtick in Python `python3 -c "..."` commands

## Lesson: TypeScript Interface Field Addition (2026-02-25)
- **Problem**: Adding required fields to an interface breaks all existing object literals that don't include them
- **Rule**: After adding fields to TypeScript interfaces, search all usages with `grep -rn "InterfaceName\|fieldName" src/` and update every instance
- **Rule**: For inline object literals, use regex `re.sub()` to insert new fields before a known field like `tip:`
- **Rule**: For compact/encoded types, also update the compact interface definition


## Lesson: GitHub Web Editor CodeMirror Workarounds (2026-03-02)
- **Problem**: GitHub Web Editor uses CodeMirror which autocompletes JSX closing tags, causing duplications when using the `type` action
- **Workaround 1**: Use `document.execCommand('insertText', false, content)` to bypass autocomplete
- **Workaround 2**: Use Clipboard API (`navigator.clipboard.writeText()`) + `cmd+v` to paste
- **Workaround 3**: Always clear editor first with `cmd+a` + `Backspace` before pasting (CodeMirror's selectAll may not select everything)
- **Rule**: NEVER use `type` action for JSX/TSX in GitHub Web Editor
- **Rule**: After pasting content, verify no duplicate old content remains at end of file
- **Rule**: For multi-file PRs: commit first file to new branch → edit second file on same branch → create PR from comparison page

## Lesson: GitHub Web Editor URL Encoding for Dynamic Routes (2026-03-02)
- **Problem**: `/edit/branch/src/app/[city]/page.tsx` returns 404
- **Fix**: URL-encode brackets as `%5Bcity%5D` → `/edit/branch/src/app/%5Bcity%5D/page.tsx`
- **Rule**: Always URL-encode square brackets in GitHub edit URLs for Next.js dynamic route files

## Lesson: Claude Code gh CLI Not Available (2026-03-03)
- **Problem**: Claude Code sandbox doesn't have `gh` CLI installed (Exit code 127: command not found)
- **Workaround**: Code changes (commit + push) work fine. Create PR manually from GitHub comparison page: `/compare/main...branch-name`
- **Rule**: Don't rely on `gh` CLI in Claude Code. Code-level changes work; PR creation needs manual step or GitHub API

## Lesson: Claude Code Session Stability (2026-03-02 ~ 2026-03-03)
- **Problem**: Claude Code sessions sometimes fail to initialize (orange spinner) or drop connection ("接続を再試行")
- **Workaround**: Try creating session. If it fails, fall back to GitHub Web Editor workflow
- **Note**: When session DOES work, it's more efficient (reads files, runs checks, commits automatically)
- **Rule**: Have GitHub Web Editor as fallback plan always ready
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

### Responsive object-position for hero images
- **Problem**: Hero image couple cropped out on mobile portrait viewports (object-cover centers by default)
- **Fix**: Use `object-[Xpct_center]` on mobile where X = subject horizontal position, `md:object-center` for desktop
- **Rule**: Always consider how `object-cover` crops on portrait vs landscape viewports. If the subject is off-center, add responsive object-position

### Browser window minimum size limitation
- **Problem**: `resize_window` tool cannot actually achieve narrow mobile widths (390px) — browser has minimum window size
- **Rule**: Cannot visually verify mobile layouts directly. Verify CSS logic is correct instead, and ask user to test on their device

### Check existing code before implementing features
- **Problem**: Created a todo for Weather API integration, but it was already fully implemented and merged to main
- **Fix**: Always check current codebase (`grep -rn`) before starting a feature implementation
- **Rule**: Search for existing implementations before writing new code


## Lesson: Gemini Image Download Limitation (2026-02-24)
- Gemini image URLs (lh3.googleusercontent.com/gg/) are session-authenticated
- Cannot download via curl from external environments (returns HTML login page)
- Canvas toDataURL fails (tainted canvas from cross-origin images)
- Fetch with credentials fails (CORS blocks cross-origin fetch)
- **Workaround**: User must manually download images from Gemini lightbox (click image → download icon in top-right)
- Alternative: Use the Gemini download button in the UI, then upload to repo manually

## Lesson: Gemini Multi-line Prompt Sending (2026-02-24)
- Enter key adds newline in Gemini input (does not send)
- Must click the send arrow button (▶) at bottom-right of input area
- In image creation mode, send button appears as blue arrow when text is present
- Stop button (■) appears while generating - can be confused with send button
- For reliability, send one image prompt at a time rather than multi-image prompts

## Lesson: Question API Necessity Before Implementation (2026-02-25)
- **Problem**: OpenWeatherMap API was fetching only current weather (not forecast), making it potentially misleading for date planning
- **Insight**: User pointed out that if you know the date and area, Claude can infer weather context from its training data (seasonal patterns, Tokyo climate)
- **Fix**: Removed OpenWeatherMap entirely. Added `dateSchedule` field (today/tomorrow/this-weekend/next-week/undecided) to the plan form. Claude's prompt now includes date context for weather-aware recommendations
- **Rule**: Before implementing/fixing an API integration, ask "Is this API actually necessary?" — sometimes the AI model itself can handle the context
- **Result**: Eliminated an external dependency, removed API key management overhead, and improved UX (user picks a date range instead of seeing weather data)

## Lesson: sed -i Syntax Differs Between macOS and Linux (2026-02-25)
- `sed -i '' 'command' file` — macOS (BSD sed, requires empty string for in-place)
- `sed -i 'command' file` — Linux (GNU sed, no empty string needed)
- GitHub Codespaces runs Linux, so use the Linux syntax
- **Rule**: For cross-platform scripts, prefer Python over sed for file manipulation

## Lesson: Python str.replace Fails on Multi-line Code Patterns (2026-02-25)
- **Problem**: `str.replace()` with hardcoded multi-line strings often fails because the actual file has different whitespace, line breaks, or formatting
- **Fix**: Use line-by-line iteration with pattern detection for surgical code modifications
- **Rule**: For multi-line code patches in terminals, use Python with `readlines()` + line-by-line scanning rather than whole-string `.replace()`

## Lesson: TypeScript Test Files Need Full Type Compliance (2026-02-25)
- **Problem**: After adding `dateSchedule` to `PlanRequest` type, all mock objects in test files also needed the field
- **Fix**: Used glob-based Python script to find and patch all test files
- **Rule**: When modifying a TypeScript type, search all `*.test.ts` files for mock objects of that type and update them too

## Lesson: Python File Manipulation Size Check (2026-02-25)
- **Problem**: Python `re.sub` with DOTALL on large files can cause catastrophic duplication (ai-planner.ts grew to 1.5GB)
- **Fix**: Always check output file size before writing: `if len(content) > 100000: raise Error`
- **Rule**: Never use regex replacement for multi-line code blocks. Use `readlines()` + line-by-line scanning instead

## Lesson: CompactPlan/Encoder Must Match DatePlan Interface (2026-02-25)
- **Problem**: When removing fields from DatePlan (occasion, mood), CompactPlan interface and toCompact/fromCompact must also be updated
- **Fix**: Use `grep -n` to find exact line numbers and `sed -i 'Nd'` to delete specific lines
- **Rule**: After modifying an interface, grep for all references across the codebase: `grep -rn 'fieldName' src/`

## Lesson: TypeScript Record Indexing Requires Exact Key Type (2026-02-25)
- **Problem**: `Record<DateSchedule, string>[request.dateStr]` fails when dateStr is `string` not `DateSchedule`
- **Fix**: Cast to `Record<string, string>` or add fallback: `(labels as Record<string, string>)[key] || key`
- **Rule**: When changing a field's type (e.g., from enum to free-form string), check all Record lookups using that field

## Lesson: AI Prompt Engineering for Diversity (2026-02-25)
- **Problem**: AI generates the same 2 stores every time despite temperature=0.95
- **Fix**: Added random seed to prompt, explicit diversity rules, relationship×mood cross-matching rules, minimum spot count by duration, season/weather rules
- **Rule**: High temperature alone doesn't guarantee diversity. The system prompt needs explicit "vary your output" instructions, and the user prompt needs a random element

## Lesson: Multi-day Date Form Design (2026-02-25)
- **Problem**: Travel/overnight dates need start and end dates, but endDate field is in Step 1 while travel selection is in Step 4
- **Fix**: Conditionally show endDate when travel activity is selected. User can go back to Step 1 to fill it in
- **Rule**: Consider form flow order when adding conditional fields that depend on later steps

## Lesson: Shell Heredoc + Backtick Safety (2026-02-25)
- **Problem**: Python heredoc (`<< 'PYEOF'`) with `\`` for backticks outputs literal `\` + backtick, not just backtick
- **Rule**: For TypeScript template literals with backticks, write content to separate temp files using bash `<< 'EOF'` (quoted EOF prevents shell interpretation including backticks), then use Python to splice them into the target file
- **Rule**: Always use `chr(96)` for backtick in Python `python3 -c "..."` commands

## Lesson: TypeScript Interface Field Addition (2026-02-25)
- **Problem**: Adding required fields to an interface breaks all existing object literals that don't include them
- **Rule**: After adding fields to TypeScript interfaces, search all usages with `grep -rn "InterfaceName\|fieldName" src/` and update every instance
- **Rule**: For inline object literals, use regex `re.sub()` to insert new fields before a known field like `tip:`
- **Rule**: For compact/encoded types, also update the compact interface definition


## Lesson: GitHub Web Editor CodeMirror Workarounds (2026-03-02)
- **Problem**: GitHub Web Editor uses CodeMirror which autocompletes JSX closing tags, causing duplications when using the type action
- **Workaround 1**: Use execCommand('insertText', false, content) to bypass autocomplete
- **Workaround 2**: Use Clipboard API (navigator.clipboard.writeText()) + cmd+v to paste
- **Workaround 3**: Always clear editor first with cmd+a + Backspace before pasting (CodeMirror selectAll may not select everything)
- **Rule**: NEVER use type action for JSX/TSX in GitHub Web Editor
- **Rule**: After pasting content, verify no duplicate old content remains at end of file
- **Rule**: For multi-file PRs: commit first file to new branch, edit second file on same branch, create PR from comparison page

## Lesson: GitHub Web Editor URL Encoding for Dynamic Routes (2026-03-02)
- **Problem**: /edit/branch/src/app/[city]/page.tsx returns 404
- **Fix**: URL-encode brackets as %5Bcity%5D
- **Rule**: Always URL-encode square brackets in GitHub edit URLs for Next.js dynamic route files

## Lesson: Claude Code gh CLI Not Available (2026-03-03)
- **Problem**: Claude Code sandbox does not have gh CLI installed (Exit code 127: command not found)
- **Workaround**: Code changes (commit + push) work fine. Create PR manually from GitHub comparison page: /compare/main...branch-name
- **Rule**: Do not rely on gh CLI in Claude Code. Code-level changes work; PR creation needs manual step

## Lesson: Claude Code Session Stability (2026-03-02 ~ 2026-03-03)
- **Problem**: Claude Code sessions sometimes fail to initialize (orange spinner) or drop connection
- **Workaround**: Try creating session. If it fails, fall back to GitHub Web Editor workflow
- **Note**: When session DOES work, it is more efficient (reads files, runs checks, commits automatically)
- **Rule**: Have GitHub Web Editor as fallback plan always ready
