/**
 * Villa Hassan | Plan coordinates, window dimensions and approved settings
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */

        // ============================================================================
        // 1. ARCHITECTURAL DATA, ROOMS & INDIVIDUAL FURNITURE SPECS (1 unit = 1m = 100cm)
        // Reconstructed from "فيلا حسن بالاثاث الدور الاول ملون-Model.pdf"
        // ============================================================================
        // Reference image calibration: the dimensioned living-room window is 247 cm / 108 px.
        // Pixel-derived positions/widths are review estimates, not surveyed construction dimensions.
        const PLAN_SCALE = 2.47 / 108;
        const planX = p => (p - 282) * PLAN_SCALE - 1.45;
        const planZ = p => (p - 400) * PLAN_SCALE - 1.8;
        const PLAN_WINDOWS = VILLA_WINDOW_CONFIG.specs;
        const windowAssemblies = [];
        const APPROVED_WINDOW_SETTINGS = VILLA_WINDOW_CONFIG.approved;
        const WINDOW_SETTINGS_REVISION = VILLA_WINDOW_CONFIG.revision;
        let reviewedWindowSettings = JSON.parse(JSON.stringify(APPROVED_WINDOW_SETTINGS));
        // Earlier provisional settings cannot override this approved release.
        try {
            const saved=JSON.parse(localStorage.getItem(VILLA_WINDOW_CONFIG.storageKey)||'{}');
            if(saved.reference===VILLA_WINDOW_CONFIG.reference && saved.revision===WINDOW_SETTINGS_REVISION) {
                for(const spec of PLAN_WINDOWS) if(validWindowSettings(saved.windows?.[spec.id])) reviewedWindowSettings[spec.id]={...APPROVED_WINDOW_SETTINGS[spec.id],...saved.windows[spec.id]};
            }
        } catch (_) {}
        function validWindowSettings(v) {
            return v && Number.isFinite(v.sillCm) && v.sillCm>=0 && v.sillCm<=400 && Number.isFinite(v.heightCm) && v.heightCm>=20 && v.heightCm<=400 && v.sillCm+v.heightCm<=500;
        }
        function windowSize(spec) {
            const v=reviewedWindowSettings[spec.id];
            const approved=APPROVED_WINDOW_SETTINGS[spec.id];
            return validWindowSettings(v) ? {sill:v.sillCm/100,height:v.heightCm/100,confirmed:true} : {sill:approved.sillCm/100,height:approved.heightCm/100,confirmed:false};
        }
