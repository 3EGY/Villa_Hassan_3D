# Device organization

Existing simulated lighting lives in `lighting/`. Do not put shutter, curtain, speaker, or real-network logic in the lighting files. Add new device categories in dedicated folders when implemented, and keep simulation, UI, scene representation, and hardware integration separate.

See `../../docs/ARCHITECTURE.md` for the proposed extension contract. No physical device adapter is present in the current demo.
