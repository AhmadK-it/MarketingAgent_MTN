# Hi MTN AI — Refactor Notes

## Files Structure

```
App.tsx                          ← Main orchestrator (state + render)
src/
  types.ts                       ← All TypeScript types
  constants.ts                   ← Model names, LS keys, AI client
  platforms.tsx                  ← Platform definitions (JSX-safe)
  utils/
    soundUtils.ts                ← playSound()
    imageUtils.ts                ← dataURLToBlob, getCroppedImg, etc.
    exportUtils.ts               ← PDF, ZIP, clipboard, download
  api/
    strategyApi.ts               ← Strategy generation + regeneration
    mediaApi.ts                  ← Image gen, TTS, image analysis
  components/
    Header.tsx                   ← Sticky header + dark mode toggle
    ImageEditor.tsx              ← Crop / filter editor
    ModelSelector.tsx            ← sales / engagement / viral switcher
    ContentCard.tsx              ← Platform content card with actions
    Toast.tsx                    ← Non-blocking clipboard/success toast
```

---

## Bugs Fixed

### 1. `finally` always set error (CRITICAL)
**Before:** `setError("حدث خطأ...")` was inside the `finally` block —
meaning it fired even on successful generation, always showing an error.

**After:** `setError(...)` is only called inside `catch`. `finally` only
calls `setLoading(false)`.

---

### 2. Broken retry logic (CRITICAL)
**Before:**
```js
// var declarations (wrong scoping)
var MAX_RATE_LIMIT = 2;
var attempts = 0;
// ...
} catch (err) {
  if (attempts < MAX_RATE_LIMIT) {
    setTimeout(() => {
      generateStrategy(requestType, strategyData); // ← both args undefined
    }, 1000 * attempts);
  }
}
```
`generateStrategy` takes zero params; `strategyData` was never defined.
`attempts` was also never incremented before the catch ran.

**After:** Broken retry removed. Clean error state with user-visible message
and a dismiss button. Users can simply click "ابدأ الابتكار" again.

---

### 3. Wrong Gemini model name
**Before:** `"gemini-3-flash-preview"` — this model does not exist and will
throw a 404/invalid-model error on every call.

**After:** `"gemini-2.0-flash"` for strategy/text; `"gemini-2.5-flash-preview-05-20"`
for image generation; `"gemini-2.5-flash-preview-tts"` for TTS.
Model names centralized in `src/constants.ts` for easy updates.

---

### 4. Duplicate sidebar (layout overflow)
**Before:** The results grid had TWO `lg:col-span-3` sidebars plus a
`lg:col-span-9` main area = 15 columns on a 12-column grid, causing
layout overflow and element clipping.

**After:** One `lg:col-span-3` sidebar + `lg:col-span-9` main = 12 columns. ✓
Both sidebar sections (platform list + branding + feedback) merged into
one sticky card.

---

### 5. `React.cloneElement` on raw SVG (TikTok icon)
**Before:** `platform.icon` for TikTok was an inline `<svg>` element.
Calling `React.cloneElement(platform.icon, { className: '...' })` on it
can silently lose the className on some React versions, and adds unnecessary
complexity.

**After:** `TikTokIcon` is a proper `React.FC<{ className? }>` component
in `src/platforms.tsx`. All icons are used directly as JSX children — no
`cloneElement` calls anywhere.

---

### 6. `var` inside function scope
**Before:** `var MAX_RATE_LIMIT = 2; var attempts = 0;` inside an async
function — `var` leaks to function scope, not block scope.

**After:** Removed entirely (part of retry cleanup). All declarations use
`const` / `let`.

---

### 7. `alert()` for clipboard feedback
**Before:** `alert('تم النسخ إلى الحافظة!')` — a blocking browser dialog
that pauses JS execution and looks terrible.

**After:** State-driven `<Toast>` component that appears for 2.5 s then fades.
`copyToClipboard` is now `async` and uses the Clipboard API properly.

---

### 8. `confetti` double-imported in ImageEditor
**Before:** `canvas-confetti` was imported at the top of the file AND
dynamically re-imported inside `ImageEditor` with:
```js
import('canvas-confetti').then(confetti => confetti.default());
```

**After:** Top-level `import confetti from 'canvas-confetti'` used directly
in both the main component and `ImageEditor`. Dynamic import removed.

---

### 9. `platforms` array recreated every render
**Before:** `const platforms = [...]` was defined inside `App()` — on
every state change the entire array (with embedded JSX icons) was
re-created and a new reference was produced.

**After:** `PLATFORMS` is a module-level constant in `src/platforms.tsx`,
created once.

---

### 10. `response.text` JSON parse without null guard
**Before:** `JSON.parse(response.text)` would throw if `response.text`
was `null` or `undefined`.

**After:** `JSON.parse(response.text ?? '{}')` with typed fallback.

---

## ES2017+ Improvements Applied

- All functions use `async/await` with proper `try/catch/finally`
- Optional chaining (`?.`) replaces manual null checks throughout
- Nullish coalescing (`??`) replaces `||` where falsy-zero is a valid value
- `useCallback` wraps all handlers passed as props or called in effects
- No `var`; only `const` and `let`
- `as const` applied to literal tuple type arrays
- `Record<string, T>` replaces `{ [key: string]: T }` in types
