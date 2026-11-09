/**
 * Villa Hassan | Transient user feedback
 * Classic browser script: shares the original global lexical scope across ordered files.
 * Keep the script order listed in index.html; no bundler required.
 */


        let toastTimer = null;
        function showToast(text) {
            const toast = document.getElementById('toast-msg');
            const toastText = document.getElementById('toast-text');
            if (!toast || !toastText) return;
            toastText.textContent = text;
            toast.classList.remove('opacity-0');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                toast.classList.add('opacity-0');
            }, 3400);
        }
