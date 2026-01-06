# Display Settings Architecture

## Component Hierarchy

```
SignageDisplay
├── useDisplaySettings() hook
│   ├── settings (scale, offsetX, offsetY, rotation)
│   ├── resolution (width, height, dpr)
│   └── Local Storage Interface
│
├── Content Container (with transforms)
│   ├── PlayerStatsCard
│   ├── MediaContent
│   └── CSS Transform Applied
│
└── DisplaySettingsPanel (conditional)
    ├── Resolution Info Display
    ├── Current Settings Display
    ├── Scale Controls
    ├── Position Controls
    ├── Rotation Controls
    ├── Drag Handlers
    └── Keyboard Shortcuts
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│                 Local Storage                       │
│         "signage-display-settings"                  │
│  { scale, offsetX, offsetY, rotation }              │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Load on mount
                   ↓
         ┌─────────────────────┐
         │ useDisplaySettings  │
         │      Hook           │
         └─────────┬───────────┘
                   │
         ┌─────────┼──────────┐
         │         │          │
         ↓         ↓          ↓
    settings   resolution  methods
         │         │          │
         │         │          │
         ↓         ↓          ↓
    ┌────────────────────────────┐
    │   SignageDisplay Component │
    └────────┬───────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ↓        ↓        ↓
Content  Settings  Transform
Display   Panel     Applied
```

---

## User Interaction Flow

### Opening Settings

```
User Action
    │
    ├─→ Ctrl+Alt+S ──┐
    │                │
    └─→ Long Press ──┤
       (3 seconds)   │
                     ↓
             setShowSettings(true)
                     │
                     ↓
         DisplaySettingsPanel Renders
                     │
                     ↓
              Overlay Displayed
```

### Adjusting Settings

```
User Interaction
    │
    ├─→ Keyboard (Arrow, +/-, [/])
    ├─→ Button Click
    └─→ Drag Content
         │
         ↓
    adjustScale() / adjustPosition() / adjustRotation()
         │
         ↓
    updateSettings(newSettings)
         │
         ├─→ setState(updated settings)
         │
         └─→ localStorage.setItem()
              │
              ↓
    CSS Transform Updated
         │
         ↓
    Content Repositioned/Scaled/Rotated
```

---

## Storage Schema

### Key

```
signage-display-settings
```

### Value (JSON)

```json
{
  "scale": 1.0, // 0.1 to 3.0 (10% to 300%)
  "offsetX": 0, // pixels, any number
  "offsetY": 0, // pixels, any number
  "rotation": 0 // degrees, 0 to 359
}
```

### Default Values

```json
{
  "scale": 1,
  "offsetX": 0,
  "offsetY": 0,
  "rotation": 0
}
```

---

## CSS Transform Composition

### Applied Transform

```css
transform: translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotation}deg);
transform-origin: center center;
transition: transform 0.1s ease-out;
```

### Example Values

**Default** (No adjustment):

```css
transform: translate(0px, 0px) scale(1) rotate(0deg);
```

**Smart TV with Overscan**:

```css
transform: translate(0px, 0px) scale(0.9) rotate(0deg);
```

**Portrait Display**:

```css
transform: translate(0px, 0px) scale(1) rotate(90deg);
```

**Offset and Scaled**:

```css
transform: translate(50px, -30px) scale(1.2) rotate(0deg);
```

---

## Event Handling

### Keyboard Events

```
Window KeyDown Event
    │
    ├─→ Ctrl+Alt+S → Toggle Panel
    │
    └─→ When Panel Open:
         ├─→ Arrow Keys → adjustPosition()
         ├─→ +/- → adjustScale()
         ├─→ [/] → adjustRotation()
         ├─→ R → resetSettings()
         └─→ ESC → Close Panel
```

### Touch/Mouse Events

```
Mouse/Touch Events
    │
    ├─→ MouseDown/TouchStart → Start Timer (3s)
    │       │
    │       └─→ Timer Complete → Toggle Panel
    │
    └─→ MouseUp/TouchEnd → Cancel Timer
         │
         └─→ When Panel Open:
              ├─→ MouseDown/TouchStart → Start Drag
              ├─→ MouseMove/TouchMove → Adjust Position
              └─→ MouseUp/TouchEnd → End Drag
```

---

## State Management

### Component State

```typescript
// SignageDisplay.tsx
const [showSettings, setShowSettings] = useState(false);
```

### Hook State

```typescript
// useDisplaySettings.ts
const [settings, setSettings] = useState<DisplaySettings>({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
});

const [resolution, setResolution] = useState({
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: window.devicePixelRatio || 1,
});
```

### Panel State

```typescript
// DisplaySettingsPanel.tsx
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
```

---

## Responsive Behavior

### Window Resize

```
Window Resize Event
    │
    ↓
Update resolution state
    │
    ↓
Re-render with new resolution info
    │
    ↓
Transform remains unchanged
(user's adjustments persist)
```

### Device Orientation Change

```
Orientation Change
    │
    ↓
Window Resize Fires
    │
    ↓
Resolution Updated
    │
    ↓
User may need to re-adjust
(settings don't auto-rotate)
```

---

## Error Handling

### Local Storage Access

```typescript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
} catch (error) {
  console.error('Failed to save:', error);
  // Continue with in-memory state
}
```

### Invalid Stored Data

```typescript
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  }
} catch (error) {
  console.error('Failed to load:', error);
  return DEFAULT_SETTINGS;
}
```

---

## Browser Compatibility

### Feature Detection

- ✅ CSS Transforms (all modern browsers)
- ✅ Local Storage (all modern browsers)
- ✅ Touch Events (mobile/tablet/smart TV)
- ✅ Keyboard Events (desktop)
- ✅ Device Pixel Ratio (all modern browsers)

### Graceful Degradation

- No transforms → Content displays normally
- No local storage → Settings work in-session only
- No touch support → Keyboard/mouse still works

---

## Performance Considerations

### Optimization Strategies

1. **Debounced Updates**: Transform updates use CSS transitions (0.1s)
2. **Hardware Acceleration**: CSS transforms use GPU
3. **Minimal Re-renders**: Settings updates don't affect content rotation
4. **Local Storage**: Async writes don't block UI
5. **Event Cleanup**: All listeners properly removed on unmount

### Memory Usage

- Settings object: ~100 bytes
- Resolution object: ~50 bytes
- Event handlers: Cleaned up on unmount
- No memory leaks from timers (cleared in cleanup)

---

## Testing Strategy

### Unit Tests (Recommended)

```typescript
// useDisplaySettings.test.ts
- Should load from localStorage on mount
- Should save to localStorage on update
- Should enforce scale limits (0.1 - 3.0)
- Should handle invalid localStorage data
- Should track resolution changes
```

### Integration Tests

```typescript
// DisplaySettingsPanel.test.ts
- Should toggle with Ctrl+Alt+S
- Should toggle with long-press
- Should update on button clicks
- Should update on keyboard input
- Should drag to reposition
- Should reset to defaults
```

### E2E Tests

```typescript
// signage-display.spec.ts
- Should persist settings across reload
- Should apply transforms correctly
- Should work on touch devices
- Should work with keyboard only
```

---

## Deployment Checklist

- [ ] Build client (`npm run build:client`)
- [ ] Test on desktop browser
- [ ] Test on mobile browser
- [ ] Test local storage persistence
- [ ] Test all keyboard shortcuts
- [ ] Test touch interactions
- [ ] Verify on Smart TV (if available)
- [ ] Check console for errors
- [ ] Test reset functionality
- [ ] Verify settings hint visibility
- [ ] Test with different screen sizes
- [ ] Verify transforms render correctly
