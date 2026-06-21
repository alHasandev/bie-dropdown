import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

/** Function signature for async / sync item loaders.
 *  When `dependsOn` is set, the second argument receives the parent value.
 */
export type ItemLoader = (
  query: string,
  parentValue?: unknown,
) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>;

/**
 * Searchable dropdown web component using Popover API and CSS Anchor Positioning.
 *
 * @element bie-dropdown
 *
 * @attr {Array|Function} items - Static array or async loader `(query, parentValue?) => items`.
 * @attr {string} label-key - Property key used for display text (default: "name").
 * @attr {string} search-keys - Comma-separated property keys for client-side filter.
 * @attr {string} placeholder - Trigger text when nothing is selected.
 * @attr {string} search-placeholder - Placeholder for the search input.
 * @attr {boolean} searchable - Enable/disable the search input.
 * @attr {Object} selected - The currently selected item (read-only).
 * @attr {string} depends-on - CSS selector for a parent dropdown this one depends on.
 * @attr {string} parent-key - Key to extract value from parent's selected item.
 * @attr {string} empty-message - Message shown when parent is not selected yet.
 * @attr {string} value-key - Object key used for the value property (default: "id").
 * @attr {string} label-template - Template string for display label (e.g. "{name} ({email})").
 *
 * @fires input - Standard input event for live form compatibility (e.g. wire:model.live).
 * @fires change - Standard change event for form compatibility (e.g. wire:model).
 *
 * @csspart trigger - The trigger button.
 * @csspart arrow - The dropdown arrow indicator.
 * @csspart label - The trigger label text.
 * @csspart popover - The popover container.
 * @csspart popover-inner - Inner wrapper inside the popover.
 * @csspart header - The popover header row.
 * @csspart header-title - The header title (mobile only).
 * @csspart close - The close button inside the header.
 * @csspart search - The search input wrapper.
 * @csspart search-input - The search input element.
 * @csspart options - The options list wrapper.
 * @csspart option - Individual option buttons.
 * @csspart summary - Wrapper around trigger and reset button.
 * @csspart reset - Button that clears the current selection.
 * @csspart empty - Empty state message.
 * @csspart loading - Loading indicator.
 * @csspart error - Error state message.
 *
 * @cssprop {Color} [--bie-bg=#fff] - Background color.
 * @cssprop {Color} [--bie-border=#d1d5db] - Border color.
 * @cssprop {Color} [--bie-text=#111827] - Text color.
 * @cssprop {Color} [--bie-hover-bg=#f3f4f6] - Hover / active background.
 * @cssprop {Color} [--bie-focus-ring=#3b82f6] - Focus ring color.
 * @cssprop {Length} [--bie-radius=0.5rem] - Border radius.
 */
@customElement('bie-dropdown')
export class BieDropdown extends LitElement {
  static override styles = css`
    :host {
      --_bg: var(--bie-bg, #fff);
      --_border: var(--bie-border, #d1d5db);
      --_text: var(--bie-text, #111827);
      --_hover-bg: var(--bie-hover-bg, #f3f4f6);
      --_focus-ring: var(--bie-focus-ring, #3b82f6);
      --_radius: var(--bie-radius, 0.5rem);

      display: inline-block;
      font-family: system-ui, sans-serif;
      font-size: 0.875rem;
      min-width: 10rem;
      user-select: none;
    }

    /* ---- Summary ---- */
    [part="summary"] {
      display: flex;
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      background: var(--_bg);
      padding: 1px;
    }

    [part='reset'] {
      display: none;
      background-color: var(--_bg);
    }

    [part='reset']:hover {
      background-color: color-mix(in srgb, var(--_text) 20%, transparent);
    }

    [part='summary'][data-selected] [part='reset'] {
      display: inline-block;
      padding: 0.5rem;
      border: none;
      border-radius: calc(var(--_radius) - 0.05rem);
      color: var(--_text);
      cursor: pointer;
      box-sizing: border-box;
      text-align: center;
      font: inherit;
      font-size: 0.625rem;
    }

    /* ---- Trigger ---- */

    [part='trigger'] {
      anchor-name: --dd-trigger;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
      padding: 0.5rem 0.75rem;
      background: var(--_bg);
      border: none;
      border-radius: var(--_radius);
      color: var(--_text);
      cursor: pointer;
      box-sizing: border-box;
      text-align: left;
      font: inherit;
      font-size: inherit;
    }

    [part='summary'][data-selected] [part='trigger'] {
      padding-right: 0;
    }

    [part='trigger']:focus-visible {
      outline: 2px solid var(--_focus-ring);
      outline-offset: 1px;
    }

    [part='arrow'] {
      transition: transform 0.2s ease;
      font-size: 0.625rem;
      flex-shrink: 0;
    }

    [part='trigger'][aria-expanded='true'] [part='arrow'] {
      transform: rotate(180deg);
    }

    [part='label'] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [part='label'][data-placeholder] {
      color: #9ca3af;
    }

    /* ---- Popover ---- */

    [part='popover'] {
      margin: 0;
      margin-top: 0.25rem;
      padding: 0;
      min-width: 20rem;

      position: absolute;
      position-anchor: --dd-trigger;
      top: anchor(bottom);
      left: anchor(left);
      width: anchor-size(width);

      background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      opacity: 0;
      translate: 0 -0.5rem;

      transition:
        opacity 0.15s ease,
        translate 0.15s ease,
        scale 0.15s ease,
        display 0.15s allow-discrete,
        overlay 0.15s allow-discrete;
      transition-behavior: allow-discrete;
    }

    [part='popover']:popover-open {
      opacity: 1;
      translate: 0 0;
      scale: 1;
    }

    @starting-style {
      [part='popover']:popover-open {
        opacity: 0;
        translate: 0 -0.5rem;
        scale: 0.97;
      }
    }

    /* ---- Anchor fallback (centered popover + visible header) ---- */

    @supports not (anchor-name: --dd-trigger) {
      [part='popover'] {
        position: fixed;
        inset: 0;
        margin: auto;
        width: 90vw;
        max-width: 24rem;
        height: fit-content;
        max-height: 85vh;
        border-radius: var(--_radius);
        translate: 0 0;
        scale: 0.95;
        overflow: hidden;
      }


      [part='popover']::backdrop {
        background: rgb(0 0 0 / 20%);
        backdrop-filter: blur(2px);
      }

      [part='popover']:popover-open {
        scale: 1;
      }

      @starting-style {
        [part='popover']:popover-open {
          scale: 0.95;
          opacity: 0;
        }
      }

      [part='options'] {
        max-height: 50vh;
        overflow: auto;
      }

      [part='header'] {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--_border);
      }

      [part='header-title'] {
        font-weight: 600;
        font-size: 0.9375rem;
      }
    }

    /* ---- Header (visible on mobile) ---- */

    [part='header'] {
      display: none;
    }

    [part='close'] {
      appearance: none;
      border: none;
      background: transparent;
      font-size: 1rem;
      cursor: pointer;
      color: var(--_text);
      padding: 0.25rem;
      line-height: 1;
      border-radius: 0.25rem;
    }

    [part='close']:hover {
      background: var(--_hover-bg);
    }

    /* ---- Search ---- */

    [part='search'] {
      padding: 0.5rem 0.75rem;
    }

    [part='search-input'] {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      font: inherit;
      font-size: inherit;
      color: var(--_text);
      background: var(--_bg);
      box-sizing: border-box;
      outline: none;
    }

    [part='search-input']:focus {
      border-color: var(--_focus-ring);
    }

    /* ---- Options ---- */

    [part='options'] {
      max-height: 18.75rem;
      overflow: auto;
    }

    [part~='option'] {
      appearance: none;
      width: 100%;
      border: none;
      background: transparent;
      display: flex;
      align-items: flex-start;
      text-align: left;
      font: inherit;
      font-size: inherit;
      cursor: pointer;
      padding: 0.5rem calc(1.5rem + 1px);
      color: var(--_text);
      position: relative;
    }

    [part~='option']:hover {
      background: var(--_hover-bg);
    }

    [part~='option'][data-active] {
      background: var(--_hover-bg);
      outline: none;
    }

    [part~='option'][aria-selected='true'] {
      font-weight: 600;
    }

    [part='option-check'] {
      color: color-mix(in srgb, var(--_text) 50%, transparent);
      position: absolute;
      top: 0.5rem;
      left: 0.75rem;
    }

    /* ---- States ---- */

    [part='loading'] {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem 0.75rem;
      color: #9ca3af;
      font-size: 0.8125rem;
    }

    [part='loading']::before {
      content: '';
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--_border);
      border-top-color: var(--_focus-ring);
      border-radius: 50%;
      animation: bie-spin 0.6s linear infinite;
    }

    @keyframes bie-spin {
      to { transform: rotate(360deg); }
    }

    [part='empty'] {
      padding: 1.5rem 0.75rem;
      text-align: center;
      color: #9ca3af;
      font-size: 0.8125rem;
    }

    [part='error'] {
      padding: 1.5rem 0.75rem;
      text-align: center;
      color: #ef4444;
      font-size: 0.8125rem;
    }

    /* ---- Responsive (mobile) ---- */

    @media (max-width: 767px) {
      [part='popover'] {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        margin: 0;
        border-radius: 0;
        translate: 0 100%;
      }

      [part='popover']:popover-open {
        translate: 0 0;
      }

      @starting-style {
        [part='popover']:popover-open {
          translate: 0 100%;
        }
      }

      [part='header'] {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.25rem 0.5rem 0.25rem 0.75rem;
        color: color-mix(in srgb, var(--_text) 40%, transparent);
      }

      [part='options'] {
        max-height: none;
        flex: 1;
        overflow: auto;
      }

      [part='popover-inner'] {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }
  `;

  // ---- Public properties ----

  /**
   * Items to display. Can be:
   * - **Array**: static items, filtered client-side using `searchKeys` / `labelKey`.
   * - **Function**: `(query: string, parentValue?: unknown) => Record<string, unknown>[] | Promise<...>`
   *   Called on open and on search (debounced 300 ms). Disables client-side filtering.
   *   If `dependsOn` is set, the second argument receives the extracted parent value.
   */
  @property({ attribute: false })
  items: Record<string, unknown>[] | ItemLoader = [];

  /**
   * Object key used for the display label of each item.
   * @default "name"
   */
  @property({ type: String, attribute: 'label-key' })
  labelKey = 'name';

  /**
   * Object key used for the value property (read by wire:model).
   * @default "id"
   */
  @property({ type: String, attribute: 'value-key' })
  valueKey = 'id';

  /**
   * Template string for display label, using {fieldName} placeholders.
   * Supports nested fields up to depth 2 (e.g. {address.city}).
   * Takes precedence over `labelKey` when set.
   * Example: "{name} ({email})"
   * @default ""
   */
  @property({ type: String, attribute: 'label-template' })
  labelTemplate = '';

  /**
   * Object keys to search against (comma-separated).
   * Only used when `items` is a static array. Ignored for loader functions.
   * If empty, only `labelKey` is used.
   */
  @property({ type: String, attribute: 'search-keys' })
  searchKeys = '';

  /**
   * Placeholder text on the trigger when no item is selected.
   */
  @property({ type: String })
  placeholder = 'Select...';

  /**
   * Placeholder text for the search input.
   */
  @property({ type: String, attribute: 'search-placeholder' })
  searchPlaceholder = 'Search...';

  /**
   * Whether the search input is shown.
   */
  @property({
    type: Boolean,
    converter: {
      fromAttribute: (value: string | null) =>
        value === null ? true : value !== 'false',
    },
  })
  searchable = true;

  /**
   * Debounce delay in milliseconds for async loader searches.
   * @default 300
   */
  @property({ type: Number, attribute: 'search-debounce' })
  searchDebounce = 300;

  /**
   * The currently selected item.
   * Use the `input` or `change` event + `value` property for form binding.
   */
  @property({ type: Object })
  selected: Record<string, unknown> | null = null;

  /**
   * String representation of the currently selected value.
   * Derived from `selected` using `valueKey` (default: "id").
   * If `valueKey` is empty, the full object is serialized as JSON.
   *
   * Compatible with wire:model — set this property from outside
   * to programmatically select an item, or read it after a change event.
   */
  get value(): string | null {
    if (!this.selected) return null;

    if (this.valueKey) {
      const val = this.selected[this.valueKey];
      if (val === undefined) {
        console.error(
          `[bie-dropdown] valueKey "${this.valueKey}" not found in selected item`,
        );
        return 'undefined';
      }
      return String(val);
    }

    return JSON.stringify(this.selected);
  }

  set value(val: string | null) {
    if (val == null || val === '') {
      this.clear();
      return;
    }

    const match = this._findItemByValue(this._getItemsArray(), val);
    if (match) {
      this.selected = match;
      this._pendingValue = null;
      return;
    }

    // No match found — queue for later when items become available
    this._pendingValue = val;
  }

  /**
   * CSS selector for a parent dropdown this one depends on.
   * When set, this dropdown waits for the parent to have a selection
   * before loading data. It also auto-clears when the parent changes.
   */
  @property({ type: String, attribute: 'depends-on' })
  dependsOn = '';

  /**
   * Key to extract from the parent dropdown's selected item.
   * If empty, the full selected object is passed to the loader.
   */
  @property({ type: String, attribute: 'parent-key' })
  parentKey = '';

  /**
   * Message shown inside the popover when the parent dropdown has not
   * been selected yet. Defaults to "Please select parent first".
   */
  @property({ type: String, attribute: 'empty-message' })
  emptyMessage = '';

  // ---- Internal state ----

  @state()
  private _open = false;

  @state()
  private _filteredItems: Record<string, unknown>[] = [];

  @state()
  private _highlightedIndex = -1;

  @state()
  private _searchQuery = '';

  @state()
  private _loading = false;

  @state()
  private _error = '';

  @state()
  private _parentValue: unknown | null = null;

  /** Guard to prevent re-entrant clear() calls from bubbling event loops. */
  private _clearing = false;

  /** Queued value for async setter when items aren't loaded yet. */
  private _pendingValue: string | null = null;

  // ---- Unique IDs ----

  private _uid = '';
  private _popoverId = '';

  // ---- Async helpers ----

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _abortController: AbortController | null = null;

  // ---- Parent dependency ----

  private _parentEl: HTMLElement | null = null;
  private _parentChangeHandler: ((e: Event) => void) | null = null;
  private _parentListenerAttached = false;

  /** Cache: last parentValue + full results to skip refetch on reopen. */
  private _cachedParentValue: unknown = undefined;
  private _cachedItems: Record<string, unknown>[] | null = null;

  // ---- Query refs ----

  @query('[part="popover"]')
  private _popoverEl!: HTMLElement | null;

  @query('[part="search-input"]')
  private _searchInputEl!: HTMLInputElement | null;

  @query('[part="options"]')
  private _optionsEl!: HTMLElement | null;

  private _templateOptionItem: HTMLTemplateElement | null = null;

  // ---- Lifecycle ----
  override connectedCallback() {
    super.connectedCallback();
    this._uid = crypto.randomUUID();
    this._popoverId = `dd-popover-${this._uid}`;
    if (!this._isLoader()) {
      this._filteredItems = [...this._getItemsArray()];
    }

    if (this.dependsOn) {
      this._attachParentListener();
    }

    this._templateOptionItem =
      this.querySelector('template[slot="option-template"]') ??
      this.querySelector('template');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cancelDebounce();
    this._abortController?.abort();
    this._detachParentListener();
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (!this._templateOptionItem) {
      this._templateOptionItem =
        this.querySelector('template[slot="option-template"]') ??
        this.querySelector('template');
    }

    if (changed.has('items') && !this._isLoader()) {
      this._filteredItems = this._clientFilter(this._searchQuery);
      this._highlightedIndex = -1;
    }

    if (changed.has('items')) {
      this._cachedItems = null;

      // Apply pending value if items are now available
      if (this._pendingValue) {
        const match = this._findItemByValue(
          this._getItemsArray(),
          this._pendingValue,
        );
        if (match) {
          this.selected = match;
          this._pendingValue = null;
        }
      }
    }

    if (changed.has('dependsOn')) {
      this._cachedItems = null;
      this._detachParentListener();
      if (this.dependsOn) {
        this._attachParentListener();
      }
    }
  }

  // ---- Render ----

  override render() {
    const label = this._getLabel(this.selected);
    const waitingForParent = this.dependsOn && this._parentValue == null;

    return html`
      <div part="summary" ?data-selected="${!!this.selected}">
        <button
          part="trigger"
          type="button"
          popovertarget="${this._popoverId}"
          popovertargetaction="toggle"
          aria-expanded="${this._open}"
          ?data-waiting="${waitingForParent}"
        >
          <span
            part="label"
            ?data-placeholder="${!label}"
          >${label || this.placeholder}</span>
          <span part="arrow" aria-hidden="true">&#9660;</span>
        </button>
        <button
          part="reset"
          type="button"
          aria-label="Clear selection"
          @click="${this.clear}"
        >
          &#10005;
        </button>
      </div>

      <div
        id="${this._popoverId}"
        part="popover"
        popover="auto"
        @toggle="${this._onPopoverToggle}"
      >
        <div part="popover-inner">
          <!-- Header (mobile) -->
          <div part="header">
            <span part="header-title">${this.placeholder}</span>
            <button
              part="close"
              type="button"
              popovertarget="${this._popoverId}"
              popovertargetaction="hide"
              aria-label="Close"
            >
              &#10005;
            </button>
          </div>

          <!-- Search -->
          ${this.searchable && !waitingForParent
            ? html`
                <div part="search">
                  <input
                    part="search-input"
                    type="search"
                    .value="${this._searchQuery}"
                    placeholder="${this.searchPlaceholder}"
                    @input="${this._onSearchInput}"
                    @keydown="${this._onSearchKeydown}"
                  />
                </div>
              `
            : nothing}

          <!-- Options / States -->
          <div part="options" role="listbox">
            ${this._renderOptionsContent()}
          </div>
        </div>
      </div>
    `;
  }

  private _renderOptionsContent() {
    if (this.dependsOn && this._parentValue == null) {
      return html`<div part="empty">${this.emptyMessage || 'Please select parent first'}</div>`;
    }

    if (this._loading) {
      return html`<div part="loading">Loading...</div>`;
    }

    if (this._error) {
      return html`<div part="error">${this._error}</div>`;
    }

    if (this._filteredItems.length === 0) {
      return html`<div part="empty">No results found</div>`;
    }

    return this._filteredItems.map(
      (item, index) => {
        const parts = ['option'];
        const isSelected = item === this.selected
        if(isSelected) {
          parts.push('option-selected')
        }
        return html`
        <button
          part="${parts.join(' ').trim()}"
          type="button"
          role="option"
          aria-selected="${isSelected}"
          ?data-active="${index === this._highlightedIndex}"
          @click="${() => this._select(item)}"
        >
          ${when(isSelected, () => html`<slot name="option-check"><span part="option-check">✔</span></slot>`)}
          ${this._renderOptionItem(item)}
        </button>
      `
      },
    );
  }

  private _interpolateTemplate(
    element: Node,
    data: Record<string, unknown>,
  ) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
    );

    let node: Text | null;
    // console.log(walker.nextNode().nextSibling, data)

    while ((node = walker.nextNode() as Text | null)) {
      node.textContent = this._dotItem(data, node.textContent);
    }

    return element;
  }

  private _dotItem(item: Record<string, unknown>, content: string)
  {
    if (!item) return '';
    if(!content) return '';


    return content.replace(/\{([\w.]+)\}/g, (_, path) => {
      const keys = path.split('.');
      if (keys.length > 2) return '';

      let val = item[keys[0]];
      if (keys.length === 2 && val && typeof val === 'object') {
        val = (val as Record<string, unknown>)[keys[1]];
      }

      return typeof val === 'string' ? val : String(val ?? '');
    });
  } 

  private _renderOptionItem(item: Record<string, unknown>) {
    if(!this._templateOptionItem) {
      return html`<span part="option-item">${this._getLabel(item)}</span>`
    }

    const optionItem = this._templateOptionItem.content.querySelector('[part="option-item"]')?.cloneNode(true)
    if(!optionItem) {
      return html`<span part="option-item">${this._getLabel(item)}</span>`
    }

    this._interpolateTemplate(optionItem, item);
    return optionItem
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('_highlightedIndex')) {
      this._scrollToHighlighted();
    }
  }

  // ---- Public methods ----

  /** Programmatically show the dropdown. */
  show() {
    this._popoverEl?.showPopover();
  }

  /** Programmatically hide the dropdown. */
  hide() {
    this._popoverEl?.hidePopover();
  }

  /** Reset selection to nothing. */
  clear() {
    if (this._clearing) return;
    this._clearing = true;
    this.selected = null;
    this._pendingValue = null;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this._clearing = false;
  }

  /** Returns whether the dropdown popover is currently open. */
  isOpen(): boolean {
    return this._open;
  }

  /** Manually reload items (useful when `items` is a loader function). */
  reload() {
    this._fetchItems(this._searchQuery, this._parentValue ?? undefined);
  }

  // ---- Private: popover control ----

  private _onPopoverToggle(e: Event) {
    const event = e as ToggleEvent;
    const isOpen = event.newState === 'open';
    this._open = isOpen;

    if (isOpen) {
      this._searchQuery = '';
      this._highlightedIndex = -1;
      this._error = '';

      if (this.dependsOn && this._parentValue == null) {
        // Parent not selected yet — show empty state immediately
        this._filteredItems = [];
        this._loading = false;
      } else if (this._isLoader()) {
        // Use cache if parent value hasn't changed (avoids unnecessary refetch)
        if (this._cachedItems !== null && this._parentValue === this._cachedParentValue) {
          this._filteredItems = this._cachedItems;
          this._loading = false;
        } else {
          this._fetchItems('', this._parentValue ?? undefined);
        }
      } else {
        this._filteredItems = [...this._getItemsArray()];
      }

      requestAnimationFrame(() => {
        this._searchInputEl?.focus();
      });
    }
  }

  // ---- Private: selection ----

  private _select(item: Record<string, unknown>) {
    const old = this.selected;
    this.selected = item;
    this._popoverEl?.hidePopover();

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    this.requestUpdate('selected', old);
  }

  // ---- Private: search / data loading ----

  private _onSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._searchQuery = input.value;
    this._highlightedIndex = -1;

    if (this._isLoader()) {
      if (this.dependsOn && this._parentValue == null) {
        // Do nothing — parent not selected
        return;
      }
      this._debouncedFetch(this._searchQuery, this._parentValue ?? undefined);
    } else {
      this._filteredItems = this._clientFilter(this._searchQuery);
    }
  }

  private _isLoader(): boolean {
    return typeof this.items === 'function';
  }

  private _getItemsArray(): Record<string, unknown>[] {
    return Array.isArray(this.items) ? this.items : [];
  }

  private _debouncedFetch(query: string, parentValue?: unknown) {
    this._cancelDebounce();
    this._debounceTimer = setTimeout(() => {
      this._fetchItems(query, parentValue);
    }, this.searchDebounce);
  }

  private async _fetchItems(query: string, parentValue?: unknown) {
    // Cancel any in-flight request
    this._abortController?.abort();
    this._abortController = new AbortController();

    this._loading = true;
    this._error = '';

    const currentParentValue = this._parentValue;

    try {
      const loader = this.items as ItemLoader;
      const result = loader(query, parentValue);

      // Handle both sync and async loaders
      const items = result instanceof Promise ? await result : result;

      // Don't update if request was aborted
      if (this._abortController.signal.aborted) return;

      // Guard against parent value changing while loading
      if (this._parentValue !== currentParentValue) return;

      this._filteredItems = items;

      // Apply pending value if one was queued while loading
      if (this._pendingValue) {
        const match = this._findItemByValue(items, this._pendingValue);
        if (match) {
          this.selected = match;
          this._pendingValue = null;
        }
      }

      // Cache full results for reuse when reopen with same parent value
      if (query === '' && !this._abortController.signal.aborted) {
        this._cachedParentValue = currentParentValue;
        this._cachedItems = items;
      }
    } catch (err) {
      if (this._abortController.signal.aborted) return;
      this._error = err instanceof Error ? err.message : 'Failed to load items';
      this._filteredItems = [];
    } finally {
      if (!this._abortController.signal.aborted) {
        this._loading = false;
      }
    }
  }

  private _cancelDebounce() {
    if (this._debounceTimer != null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  /** Client-side filtering (only used when `items` is a static array). */
  private _clientFilter(query: string): Record<string, unknown>[] {
    const items = this._getItemsArray();
    if (!query) return [...items];

    const q = query.toLowerCase();
    const keys = this._getSearchKeys();

    return items.filter((item) =>
      keys.some((key) => {
        const val = item[key];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      }),
    );
  }

  // ---- Private: parent dependency ----

  private _findParent(): HTMLElement | null {
    if (!this.dependsOn) return null;
    try {
      const el = (this.getRootNode() as Document | ShadowRoot).querySelector(this.dependsOn) as HTMLElement | null;
      if (!el) {
        console.warn(
          `[bie-dropdown] dependsOn "${this.dependsOn}" did not match any element`,
        );
      }
      return el;
    } catch {
      console.warn(
        `[bie-dropdown] Invalid dependsOn selector: "${this.dependsOn}"`,
      );
      return null;
    }
  }

  private _extractParentValue(parentSelected: Record<string, unknown>): unknown {
    if (this.parentKey) {
      return parentSelected[this.parentKey];
    }
    return parentSelected;
  }

  private _attachParentListener() {
    if (this._parentListenerAttached) return;
    const parent = this._findParent();
    if (!parent) return;

    this._parentEl = parent;
    this._parentChangeHandler = this._onParentChange.bind(this);
    parent.addEventListener('change', this._parentChangeHandler);
    this._parentListenerAttached = true;

    // Sync initial parent value if parent already has a selection
    const parentDropdown = parent as BieDropdown;
    if (parentDropdown.selected) {
      this._parentValue = this._extractParentValue(parentDropdown.selected);
    }
  }

  private _detachParentListener() {
    if (this._parentEl && this._parentChangeHandler) {
      this._parentEl.removeEventListener('change', this._parentChangeHandler);
    }
    this._parentEl = null;
    this._parentChangeHandler = null;
    this._parentListenerAttached = false;
  }

  private _onParentChange() {
    if (!this._parentEl) return;
    const parentDropdown = this._parentEl as BieDropdown;
    const parentSelected = parentDropdown.selected;

    if (parentSelected === null) {
      this._parentValue = null;
    } else {
      this._parentValue = this._extractParentValue(parentSelected);
    }
    this._cachedItems = null;
    this._pendingValue = null;
    this.selected = null; // reset silently — parent already dispatched events
    this.reload();
  }

  // ---- Private: keyboard ----

  private _onSearchKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._highlightedIndex = Math.min(
          this._highlightedIndex + 1,
          this._filteredItems.length - 1,
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        this._highlightedIndex = Math.max(this._highlightedIndex - 1, 0);
        break;

      case 'Enter':
        e.preventDefault();
        if (this._highlightedIndex >= 0) {
          this._select(this._filteredItems[this._highlightedIndex]);
        }
        break;

      case 'Escape':
        this._popoverEl?.hidePopover();
        break;
    }
  }

  private _scrollToHighlighted() {
    const container = this._optionsEl;
    if (!container) return;

    const options = container.querySelectorAll('[part="option"]');
    const active = options[this._highlightedIndex] as HTMLElement | undefined;
    if (!active) return;

    active.scrollIntoView({ block: 'nearest' });
  }

  // ---- Private: helpers ----

  private _findItemByValue(
    items: Record<string, unknown>[],
    val: string,
  ): Record<string, unknown> | undefined {
    if (this.valueKey) {
      return items.find(
        (item) => String(item[this.valueKey]) === val,
      );
    }

    try {
      const parsed = JSON.parse(val);
      return items.find(
        (item) => JSON.stringify(item) === JSON.stringify(parsed),
      );
    } catch {
      return undefined;
    }
  }

  private _getLabel(item: Record<string, unknown> | null): string {
    if (!item) return '';

    if (this.labelTemplate) {
      return this.labelTemplate.replace(/\{([\w.]+)\}/g, (match, path) => {
        const keys = path.split('.');
        if (keys.length > 2) return '';

        let val = item[keys[0]];
        if (keys.length === 2 && val && typeof val === 'object') {
          val = (val as Record<string, unknown>)[keys[1]];
        }

        return typeof val === 'string' ? val : String(val ?? '');
      });
    }

    // Fallback to labelKey
    const val = item[this.labelKey];
    return typeof val === 'string' ? val : String(val ?? '');
  }

  private _getSearchKeys(): string[] {
    const trimmed = this.searchKeys.trim();
    if (!trimmed) return [this.labelKey];
    return trimmed
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bie-dropdown': BieDropdown;
  }
}
