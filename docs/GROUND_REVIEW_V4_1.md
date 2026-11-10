# Ground Floor Review — v4.1

This module adds a dedicated review workflow for the ground floor so the user can validate and revise:

- doors
- windows
- sliding glass openings
- lighting points
- curtain / shutter assignment
- add / remove / verify status
- sill, height and head values

## Entry page

- `ground-review.html`

## Data files

- `js/floors/ground/review-data.js`
- `js/floors/ground/data.js`

## UI logic

- `js/review/ground-plan-review.js`
- `styles/ground-plan-review.css`

## Notes

- The review page stores edits in `localStorage` using the key:
  - `villa-hassan-ground-review-v1`
- Existing openings were seeded from the supplied `ground.html` model.
- Lighting points are provisional and intended for user review.
- New openings or light points can be added directly from the plan review UI.
