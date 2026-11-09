/** Connect window edits from the embedded dialog to the 3D model. */

      window.VillaWindowModel={
        apply(values){reviewedWindowSettings=values;updateReviewedWindows();},
        show(id){const spec=PLAN_WINDOWS.find(w=>w.id===id);if(!spec)return;document.getElementById('window-review-dialog').close();setWallHeightPreset(Math.max(3.1,windowSize(spec).sill+windowSize(spec).height+.2));selectZoneFromDock(spec.zone);}
      };
      function openWindowReview(){closeAllPopovers();closeRadialLightMenu();document.getElementById('window-review-dialog').showModal();}
    