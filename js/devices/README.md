# Device layer — v2.7

`registry.js` exposes the globally available `window.VillaDevices` catalog and command router. The existing 14 simulated lights are bound in `lighting/adapter.js` while the UI and geometry keep using `lighting/fixtures.js` and `lighting/radial-menu.js`.

- Query: `VillaDevices.list({ zoneId: 'livingRoom' })` or `{ kind: 'light' }`.
- Command: `await VillaDevices.execute('bulb_living', 'setBrightness', 50)`.
- Events: `const unsubscribe = VillaDevices.subscribe(({type,device}) => { ... })`.
- New type: create a folder with definitions and an adapter, then add scene and UI representations independently.

No real hardware, curtains, shutters or speakers are connected yet. See `../../docs/DEVICE_SYSTEM.md` for the contract, tests and future integration boundaries.
