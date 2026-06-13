# bie-dropdown

Searchable dropdown web component built with [Lit](https://lit.dev), using native **Popover API** and **CSS Anchor Positioning**.

- 🪶 **11.6 kB** bundled (3.4 kB gzipped) + `lit` as peer dependency
- 🔍 Built-in search/filter
- 🎯 Native popover — no z-index hacks
- ⌨️ Full keyboard navigation (↑↓ Enter Escape)
- 📱 Responsive — fullscreen bottom sheet on mobile
- 🎨 Customizable via CSS parts and custom properties
- 📦 Framework-agnostic — works with React, Vue, Angular, or vanilla HTML

## Install

```bash
npm install bie-dropdown lit
```

## Quick Start

```html
<bie-dropdown
  searchable
  label-key="name"
  search-keys="name,email"
  placeholder="Select a user..."
  search-placeholder="Search..."
></bie-dropdown>

<script type="module">
  import 'bie-dropdown';

  const dropdown = document.querySelector('bie-dropdown');
  dropdown.items = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  dropdown.addEventListener('bie-change', (e) => {
    console.log('Selected:', e.detail); // the full item object
  });
</script>
```

## API

### Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `items` | — | `Array<object> \| (query) => items` | `[]` | Static array or async loader function |
| `labelKey` | `label-key` | `string` | `"name"` | Object key used for display text |
| `searchKeys` | `search-keys` | `string` | `""` | Comma-separated keys to search against (only for static arrays) |
| `placeholder` | `placeholder` | `string` | `"Select..."` | Text shown on trigger when nothing is selected |
| `searchPlaceholder` | `search-placeholder` | `string` | `"Search..."` | Placeholder for the search input |
| `searchable` | `searchable` | `boolean` | `true` | Show/hide the search input |
| `searchDebounce` | `search-debounce` | `number` | `300` | Debounce delay in ms (only for async loader) |
| `selected` | — | `object \| null` | `null` | Currently selected item (read-only) |

### Events

| Event | Detail | Description |
|---|---|---|
| `bie-change` | The full item object | Fired when an option is selected |

### Methods

| Method | Description |
|---|---|
| `show()` | Programmatically open the dropdown |
| `hide()` | Programmatically close the dropdown |
| `clear()` | Reset selection to nothing |
| `isOpen()` | Returns `true` if dropdown popover is open |
| `reload()` | Manually reload items (useful with async loader) |

## Async Loader

Pass a function to `items` for server-side search. The function receives the current search query and returns items (sync or async).

```js
const dropdown = document.querySelector('bie-dropdown');

// Real API example (JSONPlaceholder)
dropdown.items = async (query) => {
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  const users = await res.json();

  // Filter locally (or pass `query` to your API)
  return users.filter(
    (u) =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
  );
};
```

**Behavior:**
- Called on popover open with `query = ''`
- Called on search input with debounce (default 300 ms, configurable via `search-debounce`)
- Previous in-flight request is automatically cancelled (AbortController)
- Loading state shown via `part="loading"` (spinner + text)
- Errors shown via `part="error"`

**With debounce control:**

```html
<bie-dropdown search-debounce="500"></bie-dropdown>
```

## Styling

### CSS Custom Properties

```css
bie-dropdown {
  --bie-bg: #ffffff;
  --bie-border: #d1d5db;
  --bie-text: #111827;
  --bie-hover-bg: #f3f4f6;
  --bie-focus-ring: #3b82f6;
  --bie-radius: 0.5rem;
}
```

### CSS Parts

```css
bie-dropdown::part(trigger) { }      /* Trigger button */
bie-dropdown::part(arrow) { }        /* Dropdown arrow icon */
bie-dropdown::part(label) { }        /* Trigger label text */
bie-dropdown::part(popover) { }      /* Popover container */
bie-dropdown::part(popover-inner) { }/* Inner popover wrapper */
bie-dropdown::part(header) { }       /* Popover header row (mobile) */
bie-dropdown::part(header-title) { } /* Header title (mobile) */
bie-dropdown::part(close) { }        /* Close button */
bie-dropdown::part(search) { }       /* Search input wrapper */
bie-dropdown::part(search-input) { } /* Search input */
bie-dropdown::part(options) { }      /* Options list wrapper */
bie-dropdown::part(option) { }       /* Individual option */
bie-dropdown::part(empty) { }        /* Empty state message */
bie-dropdown::part(loading) { }      /* Loading indicator */
bie-dropdown::part(error) { }        /* Error state message */
```

### Dark theme example

```html
<bie-dropdown style="
  --bie-bg: #1e1e2e;
  --bie-border: #45475a;
  --bie-text: #cdd6f4;
  --bie-hover-bg: #313244;
  --bie-focus-ring: #cba6f7;
"></bie-dropdown>
```

## Keyboard

| Key | Action |
|---|---|
| `Arrow Down` | Move highlight down / open if closed |
| `Arrow Up` | Move highlight up |
| `Enter` | Select highlighted option |
| `Escape` | Close popover |

## Browser Support

Requires **Popover API** and **CSS Anchor Positioning**:

| Browser | Version |
|---|---|
| Chrome | 114+ |
| Edge | 114+ |
| Safari | 17+ |
| Firefox | 125+ |

## Framework Integration

### Alpine.js

```html
<div x-data="{ users: [], selected: null }">
  <bie-dropdown
    x-ref="dd"
    x-effect="$refs.dd.items = users"
    @bie-change="selected = $event.detail"
  ></bie-dropdown>

  <p x-show="selected" x-text="selected?.name"></p>
</div>
```

**Patterns:**

| Use case | Approach |
|---|---|
| Static items from Alpine data | `x-effect="$refs.dd.items = users"` |
| Async loader from Alpine | `x-init="$refs.dd.items = myLoaderFn"` |
| React to selection | `@bie-change="selected = $event.detail"` |

### React / Vue / Others

As a standard custom element, `bie-dropdown` works in any framework:

```jsx
// React
<bie-dropdown ref={el => el && (el.items = data)} />

// Vue
<bie-dropdown :ref="el => el.items = data" />
```

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
