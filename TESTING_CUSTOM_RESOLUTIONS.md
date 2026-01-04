# Testing Custom Resolutions in Modern Browsers

This guide explains how to test custom display resolutions (like Amazon FireTV's 1016x540) using browser developer tools.

## Why Custom Resolutions Matter

Different devices have unique display resolutions that may not be covered by standard responsive design breakpoints. For example:

- **Amazon FireTV**: 1016x540 (landscape)
- **Other streaming devices**: Various custom resolutions

Testing these specific resolutions ensures your UI displays correctly on all target devices.

## Chrome / Edge (Chromium-based)

### Method 1: Quick Custom Resize

1. Open DevTools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`)
2. Click the **Device Toolbar** button (`Ctrl+Shift+M` / `Cmd+Shift+M`) or the phone/tablet icon
3. In the device dropdown at the top, select **"Responsive"**
4. Click on the dimensions (e.g., "1920 x 1080") at the top
5. Type in your custom dimensions: `1016` x `540`
6. Press `Enter`

### Method 2: Add Custom Device (Persistent)

1. Open DevTools (`F12`)
2. Enable Device Toolbar (`Ctrl+Shift+M`)
3. Click the three dots menu (⋮) in the device toolbar
4. Select **"Settings"** (or go to DevTools Settings → Devices)
5. Click **"Add custom device..."**
6. Enter device details:
   - **Device name**: `Amazon FireTV` (or any name)
   - **Width**: `1016`
   - **Height**: `540`
   - **Device pixel ratio**: `1`
   - **User agent**: (optional, leave default)
7. Click **"Add"**
8. Your custom device will now appear in the device dropdown

## Firefox

### Method 1: Quick Custom Resize

1. Open Developer Tools (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I`)
2. Click the **Responsive Design Mode** button (`Ctrl+Shift+M` / `Cmd+Option+M`)
3. In the dimension dropdown, select **"Edit List..."**
4. Or simply type dimensions directly in the width/height fields: `1016` x `540`

### Method 2: Add Custom Device (Persistent)

1. Open Responsive Design Mode (`Ctrl+Shift+M`)
2. Click the device dropdown at the top
3. Select **"Edit List..."**
4. Click **"Add Custom Device"**
5. Enter device details:
   - **Name**: `Amazon FireTV`
   - **Width**: `1016`
   - **Height**: `540`
   - **Pixel Ratio**: `1`
6. Click **"Save"**
7. Your device will appear in the dropdown

## Safari

1. Enable Developer Tools:
   - Safari → Settings → Advanced → Check "Show Develop menu in menu bar"
2. Open Web Inspector (`Cmd+Option+I`)
3. Click the **Responsive Design Mode** button (computer/tablet icon)
4. Click on the dimensions at the top
5. Select **"Custom"** from the dropdown
6. Enter: `1016` x `540`

## Testing Tips

### Recommended Test Cases

When testing custom resolutions, verify:

- ✅ Layout switches to appropriate breakpoint (1016px width should use `md` breakpoint)
- ✅ Content fits within vertical space (540px height)
- ✅ Text is readable at the scaled size
- ✅ Images/photos display at appropriate sizes
- ✅ Buttons and interactive elements are properly sized
- ✅ Fixed/absolute positioned elements (like "Weekend Warrior" badge) don't overlap

### Known Issues: Amazon FireTV (1016x540)

The 1016x540 resolution falls just below the `lg` breakpoint (1024px) in Tailwind CSS, which can cause layout issues if you've designed primarily for mobile (`< 768px`) or desktop (`≥ 1024px`).

**Solution**: Ensure your `md` breakpoint (768px - 1023px) is properly configured for landscape mid-range displays:

- Use two-column layouts at `md` breakpoint
- Reduce padding/spacing to fit 540px height
- Scale fonts and images appropriately
- Test Weekend Warrior badge positioning

### Zoom/Scale Testing

After setting custom dimensions, also test at different zoom levels:

- 100% (default)
- 125% (common on high-DPI displays)
- 150%
- 67% / 75% (viewing full screen on smaller monitors)

## Tailwind CSS Breakpoints Reference

Our application uses these breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**1016x540 falls in the `md` range**, so ensure your `md:` utility classes are optimized for this display size.

## Additional Resources

- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [Firefox Responsive Design Mode](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
