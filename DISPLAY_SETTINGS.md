# Display Settings - Interactive Positioning & Scaling

## Overview

The signage display now includes an interactive mode that allows you to adjust the position, scale, and rotation of content to fit any display device (Smart TVs, PCs, Mobile, etc.). All settings are automatically saved to browser local storage and persist across page reloads.

## How to Access Settings

### Method 1: Keyboard Shortcut (PCs)

Press **Ctrl+Alt+S** (or **Cmd+Alt+S** on Mac) to toggle the settings panel.

### Method 2: Long Press (Touch Devices)

Press and hold anywhere on the screen for **3 seconds** to toggle the settings panel.

## Settings Panel Features

### Resolution Display

- Shows current screen resolution (width × height)
- Displays device pixel ratio (DPR)
- Shows physical pixel resolution (for high-DPI displays)

### Current Settings

- **Scale**: Current zoom level (percentage)
- **Position**: X and Y offset in pixels
- **Rotation**: Current rotation angle in degrees

## Controls

### Keyboard Shortcuts

When the settings panel is open, you can use:

| Key            | Action                          |
| -------------- | ------------------------------- |
| **Arrow Keys** | Move content up/down/left/right |
| **+** or **=** | Increase scale                  |
| **-**          | Decrease scale                  |
| **[**          | Rotate counter-clockwise (5°)   |
| **]**          | Rotate clockwise (5°)           |
| **R**          | Reset all settings to default   |
| **ESC**        | Close settings panel            |

### Mouse/Touch Controls

#### Scale

- Use the **+** and **-** buttons
- Large buttons: ±5% scale
- Small buttons: ±1% scale (fine-tuning)

#### Position

- **Directional buttons**: Move content 10px at a time
- **Center button (●)**: Does nothing (placeholder for future centering)
- **Drag anywhere**: Click and drag (or touch and drag) to freely reposition content

#### Rotation

- **↶ 5°**: Rotate 5 degrees counter-clockwise
- **↷ 5°**: Rotate 5 degrees clockwise

### Action Buttons

- **Reset**: Restores all settings to default (scale: 100%, position: 0,0, rotation: 0°)
- **Done**: Closes the settings panel and saves current settings

## Use Cases

### Smart TVs

1. Open settings with long-press (3s)
2. Use on-screen buttons to adjust
3. Common adjustment: Scale down to fit overscan areas

### Desktop Monitors

1. Press Ctrl+Alt+S
2. Use keyboard shortcuts for precise adjustments
3. Use mouse drag for quick repositioning

### Mobile Devices

1. Long-press for 3 seconds
2. Touch and drag to reposition
3. Use on-screen buttons for scale/rotation

### Multi-Display Setups

Each browser/display maintains its own settings in local storage, so you can configure different displays independently.

## Storage

All settings are stored in the browser's local storage under the key `signage-display-settings`. This means:

- Settings persist across page reloads
- Settings are device/browser-specific
- Clearing browser data will reset settings
- Different browsers on the same device will have independent settings

## Troubleshooting

### Settings not saving

- Check browser local storage permissions
- Ensure you're not in private/incognito mode
- Try clearing cache and reloading

### Content appears distorted

- Press **R** in the settings panel to reset
- Or manually adjust scale back to 100%

### Can't access settings panel

- Try the alternate method (keyboard if touch doesn't work, or vice versa)
- Check browser console for JavaScript errors
- Ensure the page has fully loaded

### Display looks wrong on specific device

- Smart TVs often have overscan - scale down to 90-95%
- Portrait displays may need rotation adjustment
- Ultra-wide monitors may need position offset

## Technical Details

- **Transform Origin**: All transformations (scale, position, rotation) are applied from the center of the screen
- **Transition**: Smooth 0.1s ease-out transition for adjustments
- **Limits**: Scale is limited to 10% - 300% to prevent extreme distortion
- **Rotation**: Supports full 360° rotation

## Future Enhancements

Potential future features:

- Auto-detect overscan and suggest adjustments
- Save multiple presets
- Aspect ratio lock
- Grid overlay for alignment
- Remote configuration via admin panel
