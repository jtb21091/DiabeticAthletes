# Diabetic Athletes

An independent, community-built directory of athletes, musicians and actors living with type 1 diabetes, created by Joshua Brooks.

**Live site:** https://jtb21091.github.io/DiabeticAthletes/

## Features

- Search all people by name or field, filter by field and sort alphabetically.
- Keyboard-accessible floating profile readers with public links and shareable profile URLs.
- Responsive layouts and reliable initials when a photo is unavailable.
- Community resource links and a structured profile suggestion form.
- Quoted CSV parsing, safe public URL handling, and visible loading/error/empty states.

## Run locally

No build or installation is required. Serve the repository using a local HTTP server:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Opening index.html directly with a file URL will not support data fetching.

## Data and contributions

`T1Ds - Sheet1.csv` remains the directory’s source of names, images and links. It uses the columns `Name,ImageURL,Link1,...,Link24`. Quote fields containing commas; standard CSV tools do this automatically.

`profiles.json` holds fields, optional summaries, T1D sources and review dates keyed by the exact CSV name. Existing entries are community supplied and have not all been independently reverified. The nineteen October 2026 additions include public sources documenting T1D. Team URLs in historical entries may refer to earlier seasons; they are not claims about current affiliations.

Use [Suggest a person](https://github.com/jtb21091/DiabeticAthletes/issues/new?template=suggest-person.yml) to propose additions. Provide a public source explicitly confirming **type 1** diabetes; general references to diabetes are insufficient. Do not submit private health information. Link to public profiles and use only images you have permission to use. Corrections can be suggested from each profile.

## Validation

```sh
node --test tests/data.test.cjs
```

Checks quoted CSV fields, the Nacho Fernández comma-containing URL, data coverage, new-source metadata, search normalization and unsafe URL rejection.

## Deployment

The site is plain HTML, CSS, JavaScript, CSV and JSON and works with GitHub Pages at the repository subpath. Publish the root of `main` using the repository’s existing Pages configuration. Changes on a proposed branch do not update the live site until merged into the publishing branch.

Google Fonts is optional; system fonts provide a fallback. Profile images are external and fall back to initials if unavailable. Each profile includes an embedded reader and direct new-tab links. Sites that block framing must be opened in a new tab; browser cross-origin restrictions prevent reliable detection of blocked frames. Wikipedia thumbnails are looked up in the browser only when CSV ImageURL is empty, and are not written back to the CSV. Thumbnail attribution links to the source Wikipedia profile.

This project provides awareness and discovery, not individual medical advice. Inclusion does not imply endorsement.

The profile reader is nonmodal, so directory search and filters remain usable. Minimize, expand or close it from its title bar, or drag it on desktop. Escape closes the reader. Mobile uses a smaller floating panel.
