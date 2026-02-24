# Multi-Format Support: Vinyl, Cassette & 8-Track

Rekkrd now catalogs more than vinyl. Scan a cassette tape or 8-track cartridge the same way you scan a record — point your camera, and the AI identifies the album and detects the physical format automatically.

---

## What Changed

### AI-Powered Format Detection
The scanner no longer assumes everything is vinyl. Gemini Vision analyzes the physical media in the photo and returns one of three formats: **Vinyl**, **Cassette**, or **8-Track**. Cassette tapes and 8-track cartridges look visually distinct from records, so detection is reliable without any extra user input.

### Color-Coded Format System
Each format has its own color throughout the app:

| Format | Color | Hex |
|--------|-------|-----|
| Vinyl | Orange | `#dd6e42` |
| Cassette | Mint | `#34D399` |
| 8-Track | Plum | `#A855F7` |

These colors appear on:
- **Grid cards** — format badge on non-vinyl items (top-left corner)
- **List view** — dedicated Format column with colored pill badges
- **Album detail** — format badge in the header, editable via button group
- **Scan confirmation** — detected format shown before you save
- **Cover search** — MusicBrainz results tagged with format from their metadata
- **Filter panel** — colored filter chips to isolate by format

### Filter & Sort by Format
The filter panel now includes a **Format** section with chips for All, Vinyl, Cassette, and 8-Track. There's also a new **format** sort option that groups your collection by media type.

### Cover Search — All Formats Welcome
Cover search no longer filters out cassette or 8-track releases from MusicBrainz. Results now include format badges so you can tell at a glance whether a cover comes from a vinyl pressing, cassette release, or 8-track edition.

### Discogs Import Compatibility
Albums imported from Discogs automatically map to the correct format. Discogs format strings like "Cassette" or "8-Track Cartridge" are normalized to our three values. Everything else defaults to Vinyl.

### Backward Compatible
Existing albums default to Vinyl — no data migration needed beyond the schema change. Users can reclassify any album from the detail modal.

---

## How It Works

### Scanning
1. Open the camera and point at any album — vinyl, cassette, or 8-track
2. AI identifies the artist, title, and physical format
3. The scan confirmation modal shows a color-coded format badge
4. If a Discogs match is selected, format is derived from the Discogs metadata
5. Album saves with the detected format

### Editing
Open any album's detail view. Below the tags section, a **Format** picker shows three buttons (Vinyl / Cassette / 8-Track). Tap to change — saves immediately.

### Filtering
Open the filter panel. The Format row shows colored chips. Tap one to filter your collection to that format. Tap "All" to clear the filter.

---

## Marketing Angle

### Before
> Rekkrd: AI-powered vinyl record collection manager

### After
> Rekkrd: AI-powered music collection manager for vinyl, cassette & 8-track

### Key Messaging
- **"Your whole collection, not just vinyl."** — Cassette collectors and 8-track enthusiasts are underserved by every other app in this space.
- **"Scan any format."** — Same camera workflow, AI detects the media type automatically. No extra steps.
- **"Color at a glance."** — Mint for cassette, plum for 8-track. Instantly see your collection's format mix without reading a label.
- **"Jazz on tape? We got you."** — Cassette culture is real, especially in jazz, indie, and lo-fi communities. This is a differentiator.

### Target Audiences Unlocked
- **Cassette collectors** — Growing community, especially in indie/underground/jazz scenes
- **Nostalgia buyers** — People inheriting or thrifting mixed-format collections
- **Completionists** — Collectors who own the same album on multiple formats
- **Record store owners** — Inventory management across all physical formats

### Social Proof Hooks
- "I cataloged my entire jazz cassette collection in an afternoon"
- "Finally an app that doesn't pretend cassettes don't exist"
- "The color coding makes it so easy to see what's vinyl vs tape"

---

## Technical Summary

### Files Added
- `constants/formatTypes.ts` — Format values, colors, default
- `components/FormatBadge.tsx` — Shared color-coded badge component

### Files Modified
- `types.ts` — `format` field on `NewAlbum` and `ScanConfirmation`
- `server/routes/identify.ts` — Gemini prompt detects format from image
- `server/routes/covers.ts` — Removed format exclusion, passes format metadata
- `services/geminiService.ts` — Returns format from identify and covers APIs
- `services/supabaseService.ts` — Format in UPDATABLE_FIELDS and INSERT
- `components/AlbumCard.tsx` — Format badge on grid cards
- `components/CollectionList.tsx` — Format column in table view
- `components/AlbumDetailModal.tsx` — Format display and editor
- `components/ScanConfirmModal.tsx` — Format badge on scan result
- `components/CoverPicker.tsx` — Format badges on cover search results
- `App.tsx` — Format in scan flow, filter chips, sort option
- `utils/discogsMapper.ts` — Normalize Discogs format strings

### Database
```sql
ALTER TABLE albums ADD COLUMN format TEXT DEFAULT 'Vinyl';
```
