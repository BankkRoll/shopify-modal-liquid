# Universal Modal System for Shopify

A comprehensive, theme-agnostic modal system for Shopify stores that provides multiple trigger types, content formats, and responsive behavior. Works with any Shopify theme out of the box.

## Features

- **Multiple Trigger Types**: Time delay, scroll percentage, click events, exit intent, page load, or manual
- **Content Types**: Text, images, videos (YouTube/Vimeo), forms, or theme blocks
- **Smart Frequency Control**: Show always, once per session, daily, or weekly
- **Device Targeting**: Mobile and/or desktop specific display
- **Responsive Design**: Mobile-first approach with theme integration
- **Accessibility**: ARIA compliant with keyboard navigation
- **Development Mode**: Testing mode that bypasses frequency restrictions
- **Theme Integration**: Works with any Shopify theme's color schemes

## Installation

### 1. Copy Files to Your Theme

Copy these files to your Shopify theme:

```
assets/modal.js → assets/modal.js
snippets/modal.liquid → snippets/modal.liquid
sections/custom-modal.liquid → sections/custom-modal.liquid
```

### 2. Add the Section to Templates

In your theme editor, add the "Custom Modal" section to any template where you want modals to appear.

### 3. Configure Your Modal

Use the theme editor settings to configure:
- **Trigger**: How the modal opens
- **Content**: What the modal displays
- **Appearance**: Visual style and animation
- **Behavior**: Frequency and device targeting

## Quick Start Examples

### Welcome Modal (Time Triggered)
```liquid
{% render 'modal',
  modal_id: 'welcome-modal',
  trigger_type: 'time',
  trigger_value: '3',
  title: 'Welcome!',
  content: '<p>Thanks for visiting our store!</p>',
  frequency: 'once-per-session'
%}
```

### Newsletter Signup (Scroll Triggered)
```liquid
{% render 'modal',
  modal_id: 'newsletter-modal',
  trigger_type: 'scroll',
  trigger_value: '50',
  content_type: 'form',
  title: 'Stay Updated',
  frequency: 'once-per-week'
%}
```

### Product Video (Click Triggered)
```liquid
{% render 'modal',
  modal_id: 'product-video',
  trigger_type: 'click',
  trigger_value: '.video-trigger',
  content_type: 'video',
  video_url: 'https://www.youtube.com/watch?v=VIDEO_ID'
%}
```

## Configuration Options

### Core Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `modal_id` | String | Unique identifier | Required |
| `trigger_type` | String | How modal opens: `time`, `scroll`, `click`, `exit`, `page-load`, `manual` | `page-load` |
| `trigger_value` | String | Trigger value (seconds/percentage/selector) | `0` |
| `content_type` | String | Content format: `content`, `image`, `video`, `form` | `content` |
| `title` | String | Modal title | `''` |
| `content` | String | Modal content (HTML supported) | `''` |

### Appearance
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `modal_style` | String | Visual style: `default`, `minimal`, `promotional`, `warning` | `default` |
| `animation` | String | Entry animation: `fade`, `slide-up`, `slide-down`, `zoom` | `fade` |
| `color_scheme` | String | Theme color scheme to use | `scheme-1` |
| `content_width` | String | Container width: `page-width`, `full-width` | `page-width` |

### Behavior
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `frequency` | String | Display frequency: `always`, `once-per-session`, `once-per-day`, `once-per-week` | `once-per-session` |
| `delay_after_trigger` | Number | Additional delay after trigger (seconds) | `0` |
| `mobile_enabled` | Boolean | Show on mobile devices | `true` |
| `desktop_enabled` | Boolean | Show on desktop devices | `true` |
| `auto_close_after` | Number | Auto close timer (seconds, 0 = disabled) | `0` |
| `dev_mode` | Boolean | Development mode (ignores frequency) | `false` |

### Media Content
| Parameter | Type | Description |
|-----------|------|-------------|
| `image` | Object | Image asset for image modals |
| `video_url` | String | Video URL (YouTube, Vimeo, or direct) |
| `button_text` | String | Action button text |
| `button_link` | String | Action button URL |

## JavaScript API

### Basic Usage
```javascript
// Show a modal
ModalManager.show('modal-id');

// Hide a modal
ModalManager.hide('modal-id');

// Hide all modals
ModalManager.hideAll();

// Get modal status
ModalManager.getStatus('modal-id');
```

### Development Helpers
```javascript
// List all registered modals
ModalManager.listModals();

// Enable development mode for a modal
ModalManager.enableDevMode('modal-id');

// Reset frequency tracking
ModalManager.resetFrequency('modal-id');

// Force close (bypasses dev mode)
ModalManager.forceClose('modal-id');
```

## Debug Mode

Enable debug logging for development:

**Method 1**: Add to URL
```
?modal_debug=true
```

**Method 2**: Browser console
```javascript
localStorage.setItem('modal_debug', 'true');
```

## Theme Blocks Support

The modal system supports theme blocks for advanced layouts:

```liquid
{% render 'modal',
  modal_id: 'advanced-modal',
  blocks: section.blocks
%}
```

Supported block types:
- `@theme` - Any theme blocks
- `@app` - App blocks
- `text`, `button`, `image`, `video`, `spacer`, `icon`
- `group` - Grouped content
- `_divider` - Visual separators

## Styling Customization

The modal system uses CSS custom properties for easy theming:

```css
.modal {
  --color-background: /* Your theme's background color */;
  --color-foreground: /* Your theme's text color */;
  --color-button-primary: /* Your theme's primary button color */;
  --border-radius: /* Your theme's border radius */;
}
```

## Accessibility Features

- ARIA attributes for screen readers
- Keyboard navigation (Tab, Escape)
- Focus management
- Reduced motion support
- Semantic HTML structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- IE11+ (with polyfills for modern CSS features)

## License

MIT License - feel free to use in commercial projects.
