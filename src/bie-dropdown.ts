import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

/**
 * Searchable dropdown web component using Popover API and CSS Anchor Positioning.
 *
 * @element bie-dropdown
 *
 * @attr {Array} items - Array of objects to display as options.
 * @attr {string} label-key - Property key used for display text (default: "name").
 * @attr {string} search-keys - Comma-separated property keys to search against.
 * @attr {string} placeholder - Trigger text when nothing is selected.
 * @attr {string} search-placeholder - Placeholder for the search input.
 * @attr {boolean} searchable - Enable/disable the search input.
 * @attr {Object} selected - The currently selected item (read-only).
 *
 * @fires bie-change - Fired when an option is selected. `detail` contains the full item object.
 *
 * @csspart trigger - The trigger button.
 * @csspart arrow - The dropdown arrow indicator.
 * @csspart label - The trigger label text.
 * @csspart popover - The popover container.
 * @csspart popover-inner - Inner wrapper inside the popover.
 * @csspart header - The popover header row.
 * @csspart close - The close button inside the header.
 * @csspart search - The search input wrapper.
 * @csspart search-input - The search input element.
 * @csspart options - The options list wrapper.
 * @csspart option - Individual option buttons.
 * @csspart empty - Empty state message.
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

    /* ---- Trigger ---- */

    [part='trigger'] {
      anchor-name: --dd-trigger;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--_bg);
      border: 1px solid var(--_border);
      border-radius: var(--_radius);
      color: var(--_text);
      cursor: pointer;
      box-sizing: border-box;
      text-align: left;
      font: inherit;
      font-size: inherit;
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
        display 0.15s allow-discrete,
        overlay 0.15s allow-discrete;
      transition-behavior: allow-discrete;
    }

    [part='popover']:popover-open {
      opacity: 1;
      translate: 0 0;
    }

    @starting-style {
      [part='popover']:popover-open {
        opacity: 0;
        translate: 0 -0.5rem;
      }
    }

    /* ---- Header ---- */

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

    [part='option'] {
      appearance: none;
      width: 100%;
      border: none;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      font: inherit;
      font-size: inherit;
      cursor: pointer;
      padding: 0.5rem 0.75rem;
      color: var(--_text);
    }

    [part='option']:hover {
      background: var(--_hover-bg);
    }

    [part='option'][data-active] {
      background: var(--_hover-bg);
      outline: none;
    }

    [part='option'][aria-selected='true'] {
      font-weight: 600;
    }

    /* ---- Empty state ---- */

    [part='empty'] {
      padding: 1.5rem 0.75rem;
      text-align: center;
      color: #9ca3af;
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
   * Items to display in the dropdown. Each item is an object.
   * The property specified by `labelKey` is used for display.
   */
  @property({ type: Array })
  items: Record<string, unknown>[] = [];

  /**
   * Object key used for the display label of each item.
   * @default "name"
   */
  @property({ type: String, attribute: 'label-key' })
  labelKey = 'name';

  /**
   * Object keys to search against (comma-separated).
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
   * The currently selected item (read-only from outside).
   * Use the `bie-change` event to react to selections.
   */
  @property({ type: Object })
  selected: Record<string, unknown> | null = null;

  // ---- Internal state ----

  @state()
  private _open = false;

  @state()
  private _filteredItems: Record<string, unknown>[] = [];

  @state()
  private _highlightedIndex = -1;

  @state()
  private _searchQuery = '';

  // ---- Unique IDs ----

  private _uid = '';
  private _popoverId = '';

  // ---- Query refs ----

  @query('[part="popover"]')
  private _popoverEl!: HTMLElement | null;

  @query('[part="search-input"]')
  private _searchInputEl!: HTMLInputElement | null;

  @query('[part="options"]')
  private _optionsEl!: HTMLElement | null;

  // ---- Lifecycle ----

  override connectedCallback() {
    super.connectedCallback();
    this._uid = crypto.randomUUID();
    this._popoverId = `dd-popover-${this._uid}`;
    this._filteredItems = [...this.items];
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has('items')) {
      this._filteredItems = this._filter(this._searchQuery);
      this._highlightedIndex = -1;
    }
  }

  // ---- Render ----

  override render() {
    const label = this._getLabel(this.selected);

    return html`
      <button
        part="trigger"
        type="button"
        popovertarget="${this._popoverId}"
        popovertargetaction="toggle"
        aria-expanded="${this._open}"
      >
        <span
          part="label"
          ?data-placeholder="${!label}"
        >${label || this.placeholder}</span>
        <span part="arrow" aria-hidden="true">&#9660;</span>
      </button>

      <div
        id="${this._popoverId}"
        part="popover"
        popover="auto"
        @toggle="${this._onPopoverToggle}"
      >
        <div part="popover-inner">
          <!-- Header -->
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
          ${this.searchable
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

          <!-- Options -->
          <div part="options" role="listbox">
            ${this._filteredItems.length === 0
              ? html`<div part="empty">No results found</div>`
              : this._filteredItems.map(
                  (item, index) => html`
                    <button
                      part="option"
                      type="button"
                      role="option"
                      aria-selected="${item === this.selected}"
                      ?data-active="${index === this._highlightedIndex}"
                      @click="${() => this._select(item)}"
                      @mouseenter="${() =>
                        (this._highlightedIndex = index)}"
                    >
                      <span>${this._getLabel(item)}</span>
                    </button>
                  `
                )}
          </div>
        </div>
      </div>
    `;
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
    this.selected = null;
  }

  /** Returns whether the dropdown popover is currently open. */
  isOpen(): boolean {
    return this._open;
  }

  // ---- Private: popover control ----

  private _onPopoverToggle(e: Event) {
    const event = e as ToggleEvent;
    const isOpen = event.newState === 'open';
    this._open = isOpen;

    if (isOpen) {
      this._searchQuery = '';
      this._filteredItems = [...this.items];
      this._highlightedIndex = -1;
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

    this.dispatchEvent(
      new CustomEvent('bie-change', {
        detail: item,
        bubbles: true,
        composed: true,
      })
    );

    this.requestUpdate('selected', old);
  }

  // ---- Private: search / filter ----

  private _onSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._searchQuery = input.value;
    this._filteredItems = this._filter(this._searchQuery);
    this._highlightedIndex = -1;
  }

  private _filter(query: string): Record<string, unknown>[] {
    if (!query) return [...this.items];

    const q = query.toLowerCase();
    const keys = this._getSearchKeys();

    return this.items.filter((item) =>
      keys.some((key) => {
        const val = item[key];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      })
    );
  }

  // ---- Private: keyboard ----

  private _onSearchKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._highlightedIndex = Math.min(
          this._highlightedIndex + 1,
          this._filteredItems.length - 1
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

  private _getLabel(item: Record<string, unknown> | null): string {
    if (!item) return '';
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
