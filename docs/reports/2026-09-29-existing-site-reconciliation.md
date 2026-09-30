# Existing-site reconciliation and four-format video support

PROVEN — This is continuation of an existing website that predates the questionnaire. No retrospective intake or restart is required. Domain selection is deferred by the owner; this change is for private development and review.

PROVEN — Canonical structure is apps/web and packages/ui. The recovered website used a separate frontend directory outside its parent's normal source tracking. This candidate brings the public components, source-aware event selection, current-date filtering, water freshness handling and Best Of resource guide into the canonical frontend. Editorial ranking source is kept inside the frontend so a clean checkout does not import files from outside the repository.

PROVEN — Video presentation has four independent keys in brand.social_publish_config.video_variants: short_portrait, short_landscape, long_portrait, long_landscape. Values are HTTPS playback URLs. Portrait uses 9:16 and landscape 16:9 presentation. Supported YouTube links embed; MP4 URLs use browser video controls; other HTTPS destinations get an explicit open link. No URL means unavailable. A legacy latest-video URL remains separate and is not assumed to satisfy any named format.

BLOCKED — Playback support does not establish completed HeyGen renders, correctly composed source video, subtitles, current content or credit balance. Each actual video still needs source verification, format-specific visual review, narration and caption review before release. Do not fill missing URLs with sample videos.

PROVEN — Existing source standards research is recorded separately. Reference resources: https://vacationokoboji.com/about/industry-research/ ; https://lab.secondstreet.com/articles/best-of-ballot-best-practices/ ; https://www.w3.org/WAI/tutorials/page-structure/ . Accessed September 29, 2026. Tourism research informs candidate audience categories, not present-day popularity claims or invented award winners.

INFERRED — Extending the existing React frontend avoids a new CMS, subscription or database migration. The remaining operational burden is maintaining reliable events, source dates and publication links. No public release or change to database permissions is included.

## Verification and recovery

CANDIDATE — Required checks: npm ci, npm test, npm run lint, npm run typecheck, npm run build; private browser comparison against the existing website; verify guide search/reset and each unavailable video format. These commands are requirements, not a claim that all have passed.

PROVEN — Secrets belong only in ignored environment files. .env.example contains names and a non-secret brand slug. No raw chat archives, database dumps, media exports or machine-specific reports belong in this source change. Production remains a separate owner decision.

CANDIDATE — Recovery: leave the existing runtime intact while reviewing the branch. If rejected, stop the candidate runtime and continue the baseline. No database rollback is needed because this candidate does not migrate or seed data.

PROVEN — Local verification completed: clean dependency install with system certificate trust; three event-selection tests passed; lint, TypeScript and production build passed. Browser checks confirmed guide search, category filtering/reset and all four video selection states. No browser console errors were captured. Actual media playback has not been verified because format-specific published URLs are absent.

PROVEN — Candidate currently reads the existing configured backend. It is not an isolated staging database. Existing operator access and backend write policies must be reviewed before any public deployment. No database writes were performed for this reconciliation.
