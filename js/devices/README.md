# Device layer — v2.8

`registry.js` exposes `window.VillaDevices` as the central catalog and command router for 24 simulated devices on floor 1: **14 lights + 5 shutters + 5 curtains**. The registry does not import or depend on Three.js.

- Lights: `lighting/fixtures.js` maintains the original Three.js objects and `lighting/adapter.js` bridges them to the registry. The original light radial wheel remains intact.
- Shutters & curtains: `coverings/adapter.js` registers the 10 motors and executes `open`, `close`, `setPosition(0..100)` commands; `coverings/visuals.js` updates meshes and floating window controls; `coverings/controls.js` implements panels and the independent radial position arc.
- Local time schedules: `coverings/automation.js`, one schedule for each type.
- Optional voice commands: `../voice/voice-control.js`, browser SpeechRecognition and a text-input fallback.

`VillaDevices.list({kind:'shutter'})`, `VillaDevices.list({zoneId:'rightBedroom'})` and `await VillaDevices.execute('curtain_master','setPosition',50)` work in developer tools after starting the tour.

No physical devices or speakers are connected. Keep credentials and device addresses off GitHub Pages. For layout and schedule references, see `../../docs/COVERINGS_AND_VOICE.md` and `../../docs/DEVICE_SYSTEM.md`.
