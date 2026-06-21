# bie-dropdown

Searchable dropdown web component built with [Lit](https://lit.dev), using native **Popover API** and **CSS Anchor Positioning**.

- 🪶 **19.8 kB** bundled (5.0 kB gzipped) + `lit` as peer dependency
- 🔍 Built-in search/filter
- 🎯 Native popover — no z-index hacks
- ⌨️ Full keyboard navigation (↑↓ Enter Escape)
- 📱 Responsive — fullscreen bottom sheet on mobile
- 🎨 Customizable via CSS parts and custom properties
- 📦 Framework-agnostic — works with React, Vue, Angular, or vanilla HTML
- 🔗 **Cascading / dependent dropdown support** — child dropdown waits for parent selection

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

  dropdown.addEventListener('change', (e) => {
    console.log('Selected:', e.target.selected); // the full item object
    console.log('Value:', e.target.value);       // "1" (uses valueKey default "id")
  });
</script>
```

## API

### Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `items` | — | `Array<object> \| (query, parentValue?) => items` | `[]` | Static array or async loader function |
| `labelKey` | `label-key` | `string` | `"name"` | Object key used for display text (ignored if `labelTemplate` is set) |
| `labelTemplate` | `label-template` | `string` | `""` | Template string for display label (e.g. `"{name} ({email})"`). Supports nested fields up to depth 2. |
| `valueKey` | `value-key` | `string` | `"id"` | Object key used for the `value` property. Read by `wire:model`. |
| `value` | — | `string \| null` | — | Read/write string representation of current selection. Derived from `selected[valueKey]`. |
| `searchKeys` | `search-keys` | `string` | `""` | Comma-separated keys to search against (only for static arrays) |
| `placeholder` | `placeholder` | `string` | `"Select..."` | Text shown on trigger when nothing is selected |
| `searchPlaceholder` | `search-placeholder` | `string` | `"Search..."` | Placeholder for the search input |
| `searchable` | `searchable` | `boolean` | `true` | Show/hide the search input |
| `searchDebounce` | `search-debounce` | `number` | `300` | Debounce delay in ms (only for async loader) |
| `selected` | — | `object \| null` | `null` | Currently selected item. Use `value` + `change` event for form binding. |
| `dependsOn` | `depends-on` | `string` | `""` | CSS selector for a parent dropdown this one depends on |
| `parentKey` | `parent-key` | `string` | `""` | Key to extract value from parent's selected item (if empty, full object is passed) |
| `emptyMessage` | `empty-message` | `string` | `""` | Message shown when parent is not selected yet |

### Events

| Event | Description |
|---|---|
| `input` | Standard input event. Fires on every selection/clear. Used by `wire:model.live`. |
| `change` | Standard change event. Fires on every selection/clear. Used by `wire:model`. |
| `selected` (property) | Access `e.target.selected` for the full item object, or `e.target.value` for the string value. |

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

## Custom Option Template

Customise how each option is rendered by placing a `<template>` inside `<bie-dropdown>`.

```html
<bie-dropdown>
  <template slot="option-template">
    <div part="option-item">
      <p part="option-item-name">{name}</p>
      <p part="option-item-email">{email}</p>
    </div>
  </template>
</bie-dropdown>

<script type="module">
  import 'bie-dropdown';

  const dropdown = document.querySelector('bie-dropdown');
  dropdown.items = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];
</script>
```

**Notes:**
- Placeholder `{fieldName}` is replaced from item data. Nested fields (`{address.city}`) are supported up to depth 2.
- Replacement only works on **text nodes**, not HTML attributes.
- The template root element **must** have `part="option-item"` to be picked up by the component.
- Style the template elements via CSS parts (e.g., `bie-dropdown::part(option-item-name)`) or inline styles — class-based styling from outside the shadow DOM **does not** apply.
- **Checkmark slot:** add `<span slot="option-check">...</span>` in light DOM to customise the selected indicator.

**Styling the custom template:**

```css
bie-dropdown::part(option-item-name) {
  font-weight: 600;
}

bie-dropdown::part(option-item-email) {
  font-size: 0.75rem;
  color: #6b7280;
}
```

## Cascading Dropdown

Link a child dropdown to a parent dropdown so that the child waits for the parent selection and reloads automatically.

```html
<bie-dropdown id="country" placeholder="Select Country..."></bie-dropdown>
<bie-dropdown
  id="city"
  placeholder="Select City..."
  depends-on="#country"
  parent-key="id"
  empty-message="Please select a country first"
></bie-dropdown>
```

```js
const city = document.getElementById('city');
city.items = async (query, countryId) => {
  if (!countryId) return [];
  const res = await fetch(`/api/cities?country=${countryId}&q=${query}`);
  return res.json();
};
```

**Behavior:**
- When `dependsOn` is set, the child dropdown listens for `change` on the parent.
- When the parent changes, the child **auto-clears** its selection and **reloads** with the new parent value.
- The async loader receives the parent value as the **second argument** (`parentValue`).
- If `parentKey` is set, only that property is extracted from the parent's selected item. If empty, the full selected object is passed.
- While the parent has no selection, the popover still opens but shows `emptyMessage`.
- **Caching**: full results are cached per parent value. Re-opening the dropdown with the same parent selection does **not** refetch — cached data is displayed instantly. Search input and parent changes always fetch fresh data.

### Alpine.js Example

```html
<div x-data="{ selectedCountry: null }">
  <bie-dropdown
    id="country"
    placeholder="Select Country..."
    x-init="$el.items = [{id:1,name:'USA'},{id:2,name:'UK'}]"
    @change="selectedCountry = $event.target.selected"
  ></bie-dropdown>

  <bie-dropdown
    id="city"
    placeholder="Select City..."
    depends-on="#country"
    parent-key="id"
    empty-message="Please select a country first"
  ></bie-dropdown>
</div>

<script>
  document.getElementById('city').items = async (query, countryId) => {
    if (!countryId) return [];
    // fetch cities...
  };
</script>
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
bie-dropdown::part(summary) { }      /* Wrapper around trigger and reset button */
bie-dropdown::part(reset) { }        /* Button to clear the current selection */
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

### Tailwind CSS (v4)

Style `bie-dropdown` with Tailwind v4's CSS-first approach via custom properties and parts.

#### Quick inline (arbitrary properties)

```html
<bie-dropdown
  class="[--bie-bg:var(--color-white)] [--bie-border:var(--color-gray-300)]
         [--bie-text:var(--color-gray-900)] [--bie-hover-bg:var(--color-gray-100)]
         [--bie-focus-ring:var(--color-blue-500)] [--bie-radius:var(--radius-lg)]"
></bie-dropdown>
```

#### Dark mode with `dark:` variant

```html
<bie-dropdown
  class="[--bie-bg:var(--color-white)] [--bie-text:var(--color-gray-900)]
         dark:[--bie-bg:var(--color-gray-900)] dark:[--bie-text:var(--color-gray-100)]
         dark:[--bie-border:var(--color-gray-700)] dark:[--bie-hover-bg:var(--color-gray-800)]"
></bie-dropdown>
```

#### Register design tokens with `@theme`

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-bie-bg: #ffffff;
  --color-bie-border: #d1d5db;
  --color-bie-text: #111827;
  --color-bie-hover-bg: #f3f4f6;
  --color-bie-focus-ring: #3b82f6;
  --radius-bie: 0.5rem;
}
```

```html
<bie-dropdown
  class="[--bie-bg:var(--color-bie-bg)] [--bie-border:var(--color-bie-border)]
         [--bie-text:var(--color-bie-text)] [--bie-hover-bg:var(--color-bie-hover-bg)]
         [--bie-focus-ring:var(--color-bie-focus-ring)] [--bie-radius:var(--radius-bie)]"
></bie-dropdown>
```

#### Customizing parts with global CSS

```css
@import "tailwindcss";

@layer components {
  bie-dropdown::part(trigger) {
    @apply rounded-lg px-4 py-2.5 text-sm font-medium;
  }

  bie-dropdown::part(option) {
    @apply px-4 py-2 text-sm hover:bg-gray-100;
  }

  bie-dropdown::part(reset) {
    @apply text-gray-400 hover:text-red-500 transition-colors;
  }
}
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
    @change="selected = $event.target.selected"
  ></bie-dropdown>

  <p x-show="selected" x-text="selected?.name"></p>
</div>
```

**Patterns:**

| Use case | Approach |
|---|---|
| Static items from Alpine data | `x-effect="$refs.dd.items = users"` |
| Async loader from Alpine | `x-init="$refs.dd.items = myLoaderFn"` |
| React to selection | `@change="selected = $event.target.selected"` |

### Livewire 4.x

`bie-dropdown` is natively compatible with Livewire 4.x `wire:model` via standard `input`/`change` events and the `value` property.

```blade
{{-- resources/views/livewire/user-selector.blade.php --}}
<div>
    <bie-dropdown
        wire:model="userId"
        :items="$users"
        value-key="id"
        label-template="{name} ({email})"
        placeholder="Select a user..."
    ></bie-dropdown>

    <p>Selected ID: {{ $userId }}</p>
</div>
```

```php
// app/Livewire/UserSelector.php
namespace App\Livewire;

use Livewire\Component;

class UserSelector extends Component
{
    public $userId = null;
    public $users = [];

    public function mount()
    {
        $this->users = User::select('id', 'name', 'email')->get()->toArray();
    }

    public function render()
    {
        return view('livewire.user-selector');
    }
}
```

#### With `wire:model.live`

```blade
{{-- Real-time updates as user selects --}}
<bie-dropdown
    wire:model.live="userId"
    value-key="id"
    placeholder="Search and select..."
></bie-dropdown>
```

#### Async Loader with Livewire

```blade
<div>
    <bie-dropdown
        id="user-search"
        wire:model.live="userId"
        value-key="id"
        placeholder="Type to search..."
        search-debounce="300"
    ></bie-dropdown>
</div>

@script
<script>
    const dd = document.getElementById('user-search');
    dd.items = async (query) => {
        return await $wire.searchUsers(query);
    };
</script>
@endscript
```

```php
public function searchUsers($query)
{
    return User::where('name', 'like', "%{$query}%")
        ->select('id', 'name', 'email')
        ->get()
        ->toArray();
}
```

#### Cascading with Livewire

```blade
<div>
    <bie-dropdown
        id="lw-country"
        wire:model="countryId"
        :items="$countries"
        value-key="id"
        placeholder="Select country..."
    ></bie-dropdown>

    <bie-dropdown
        wire:model="cityId"
        value-key="id"
        depends-on="#lw-country"
        parent-key="id"
        empty-message="Please select a country first"
        label-template="{name}, {countryName}"
        placeholder="Select city..."
    ></bie-dropdown>
</div>

@script
<script>
    document.querySelector('[depends-on="#lw-country"]').items = async (query, countryId) => {
        return await $wire.searchCities(query, countryId);
    };
</script>
@endscript
```

#### Programmatic `value` setter (bidirectional)

```blade
@script
<script>
    // Livewire sets value from server → dropdown auto-selects matching item
    $wire.$watch('userId', (value) => {
        document.querySelector('bie-dropdown').value = value;
    });

    // Dropdown selection → sync to Livewire
    document.querySelector('bie-dropdown').addEventListener('change', (e) => {
        // e.target.value already set — wire:model handles this automatically
    });
</script>
@endscript
```

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
