# Adding photographs

Two ways, both fine. Pick whichever suits your mood.

## The quick way

1. Put the image file in `public/photos/` (e.g. `public/photos/metsa-01.jpg`).
2. Run `npm run photos`.
3. Open `public/data/photos.json` and add a title and category to the new entry if you want them.

The script reads each file's dimensions so the page can reserve space before the
image loads (no jumping), and it also picks up the camera and the year from the
file's EXIF. Anything you have already written (title, category, location,
featured) is kept untouched.

## The manual way

Open `public/data/photos.json` and add one line:

```json
[
  { "file": "metsa-01.jpg", "title": "Metsä", "category": "Forest" },
  { "file": "joki-02.jpg", "title": "Joki", "category": "Forest" }
]
```

That is a complete, valid manifest. Width and height are optional — the site
works without them, the images just settle a moment later.

## What each field does

| field | what it does |
|---|---|
| `file` | **required** — filename inside `public/photos/` |
| `title` | shown under the photograph, and in the viewer |
| `category` | adds a filter button; leave it out and the photo shows under "All" |
| `featured` | `true` on one photo makes it the homepage hero |
| `date` | free text, shown as metadata (`2025`, `August 2025`, …) |
| `location` | free text, shown as metadata — type `Oslo` and the viewer says `Oslo · 2026 · Sony NEX-6` |
| `width` / `height` | filled in by `npm run photos`; only stops layout shift |
| `camera` | read by `npm run photos` from the file's EXIF (`Sony NEX-6`); edit it or delete the line freely |
| `focal` | focal length in mm, read from EXIF when the file still carries it |
| `year` | taken year, read from EXIF when the file still carries it |

Categories are not defined anywhere else — type any word and the filter row
picks it up, with a count. Keep the spelling consistent or you will get two
filters for the same thing.

## Quality

- Export at **long edge 2400px**, sRGB, JPEG quality ~85. Larger is wasted
  bandwidth; smaller gets soft on high-density screens.
- **Nothing is resized, re-compressed or cropped by this site.** The browser
  receives exactly the file you put in `public/photos/`.
- The layout keeps the full frame: 9:16 portraits and 16:9 landscapes both
  display uncropped, side by side.
- Orientation tags are read. A photo carrying an EXIF rotation (common from
  phone exports and PowerToys) gets its manifest dimensions swapped to the shape
  the browser actually displays, so tiles stay the right shape and the file
  itself is never re-encoded.

## Removing a photo

Delete the file from `public/photos/` and run `npm run photos` again — the
manifest is rebuilt from what is actually on disk. Or delete its line by hand.
