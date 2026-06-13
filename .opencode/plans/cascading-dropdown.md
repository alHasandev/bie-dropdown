# Plan: Fitur Cascading / Dependent Dropdown di bie-dropdown

## Objective

Menambahkan dukungan native untuk **cascading dropdown** (dropdown anak yang bergantung pada pilihan dropdown induk) ke komponen `bie-dropdown`, sekaligus menyediakan dokumentasi dan contoh penggunaan lengkap.

## Requirements Snapshot

- **R1:** User dapat mendeklarasikan hubungan dependensi antar dropdown (dropdown-2 tergantung pada dropdown-1) secara deklaratif (via property) atau imperatif (via event listener).
- **R2:** Dropdown anak otomatis menunggu dropdown induk memiliki nilai terpilih sebelum menampilkan atau memuat data.
- **R3:** Dropdown anak menerima nilai dari dropdown induk secara otomatis saat memanggil async loader (`items`), tanpa memerlukan wiring manual di luar komponen.
- **R4:** Dropdown anak otomatis **clear** (reset pilihan) ketika dropdown induk berubah nilainya.
- **R5:** Backward compatibility — API existing harus tetap berfungsi tanpa perubahan. Loader signature lama `(query: string) => items` tetap valid.
- **R6:** Dropdown anak menampilkan UI state yang jelas saat belum bisa digunakan (disabled trigger, placeholder kustom, atau pesan "empty state").
- **R7:** Dokumentasi README diperbarui dengan API baru dan contoh kasus cascading dropdown (minimal 2 contoh: vanilla JS dan framework-agnostic).

## Scope

- Modifikasi `src/bie-dropdown.ts` untuk menambahkan property dependensi, event listener, auto-clear, dan integrasi ke loader.
- Modifikasi tipe `ItemLoader` agar mendukung parameter `parentValue` (opsional, backward-compatible).
- Penambahan state visual (disabled trigger, empty state tergantung parent) di dalam shadow DOM.
- Update `README.md` dengan API baru dan contoh penggunaan.
- Penambahan demo contoh di `index.html` atau file demo terpisah (jika ada).

## Assumptions and Constraints

- Library adalah web component Lit dengan single-file bundle, tidak boleh menambahkan dependensi baru.
- Tidak ada slot content atau light DOM projection untuk trigger/option — semua visual di shadow DOM.
- Hanya ada satu event `bie-change` yang saat ini di-emit. Event baru boleh ditambahkan jika diperlukan, tapi sebaiknya minimal.
- `selected` property saat ini bisa di-set dari luar, tapi tidak ada reaksi visual otomatis via `willUpdate`. Perlu hati-hati agar `clear()` dan set `selected` tetap konsisten.
- Popover API dan anchor positioning tetap digunakan tanpa modifikasi struktur utama.
- Browser target tetap sama (Chrome 114+, Safari 17+, Firefox 125+).

## Risks and Areas Requiring Care

1. **Backward compatibility breaking change** — jika signature `items` berubah tanpa fallback, user yang sudah menggunakan async loader akan mengalami error. Harus gunakan deteksi arity atau object parameter.
2. **Memory leak** — event listener ke parent dropdown harus di-cleanup di `disconnectedCallback`.
3. **Race condition** — jika parent berubah saat child sedang loading, request lama harus di-abort dan state loading harus konsisten.
4. **Setter `selected` yang tidak sinkron** — `selected` adalah reactive property Lit, tapi ada `requestUpdate('selected', old)` manual di `_select`. Perlu pastikan `clear()` dan set `selected` trigger update visual.
5. **Circular dependency** — jika ada 2 dropdown yang saling `dependsOn`, bisa deadlock. Perlu validasi sederhana atau minimal dokumentasi.

## Core Concepts

### Konsep Dependensi (Parent → Child)

```html
<!-- Parent -->
<bie-dropdown id="country" placeholder="Pilih Negara..."></bie-dropdown>

<!-- Child -->
<bie-dropdown
  id="city"
  placeholder="Pilih Kota..."
  depends-on="#country"
  parent-key="id"
  empty-message="Pilih negara terlebih dahulu"
></bie-dropdown>
```

```js
// Loader kota menerima parentValue sebagai parameter kedua
const cityDropdown = document.getElementById('city');
cityDropdown.items = async (query, parentValue) => {
  if (!parentValue) return []; // atau throw error
  const res = await fetch(`/api/cities?country=${parentValue}&q=${query}`);
  return res.json();
};
```

### Flow Kerja
1. **Inisialisasi**: Child menemukan element parent via `dependsOn`. Jika parent belum ada, throw warning atau tunggu DOM ready.
2. **Listen**: Child menambahkan `eventListener('bie-change', ...)` ke parent.
3. **On parent change**: Child otomatis `clear()`, `reload()` dengan `parentValue` baru.
4. **On child open**: Jika `dependsOn` di-set tapi parent belum punya `selected`, child bisa menampilkan `empty-message` (part `empty`) dan tidak memanggil loader.
5. **Loader invocation**: Signature diperluas jadi `ItemLoader(query, parentValue?)`. Child memanggil loader dengan argumen kedua jika `parentValue` tersedia.

## Sub-Tasks

### Sub-Task 1: Extend ItemLoader Signature & Type Definitions

- **Status:** Pending
- **Objective:** Memperluas tipe `ItemLoader` agar mendukung parameter `parentValue` tanpa merusak signature lama.
- **Related Requirements:** R3, R5
- **Dependencies and Preconditions:** —
- **In Scope for This Sub-Task:**
  - Ubah tipe `ItemLoader` dari `(query: string) => items` menjadi `(query: string, parentValue?: unknown) => items`.
  - Pastikan TypeScript tidak error pada user yang masih pakai signature lama (parameter kedua opsional).
  - Update JSDoc di `src/index.ts` (jika ada) atau `src/bie-dropdown.ts` untuk mencatat signature baru.
- **Out of Scope for This Sub-Task:** Implementasi logic pemanggilan loader baru, UI state, event listener.
- **Instructions:**
  - Buka `src/bie-dropdown.ts` dan `src/index.ts`.
  - Ubah baris: `export type ItemLoader = (query: string, parentValue?: unknown) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>;`
  - Update JSDoc untuk properti `items` agar mencatat: "Jika `dependsOn` di-set, loader akan dipanggil dengan argumen kedua berisi nilai dari parent."
- **Acceptance Criteria:**
  - `tsc --noEmit` (atau build) berhasil tanpa error pada kode existing dan contoh loader lama.
- **Cautionary Points (Risks & Edge Cases):** 
  - Hindari menggunakan `unknown` yang terlalu longgar jika bisa menggunakan tipe yang lebih spesifik, tapi karena parent value bisa berupa object/string/number, `unknown` adalah pilihan yang aman.
- **Implementation Suggestions:** Gunakan `parentValue?: unknown` agar TypeScript tidak mengharuskan user mengubah kode existing.
- **Testing Suggestions:** Jalankan `npm run build` untuk memastikan tidak ada TypeScript error.
- **Done When:** Tipe diperbarui, build lulus, dan JSDoc diperbarui.

### Sub-Task 2: Add Dependency Properties & Internal State

- **Status:** Pending
- **Objective:** Menambahkan property konfigurasi baru (`dependsOn`, `parentKey`, `emptyMessage`) dan state internal untuk tracking parent value.
- **Related Requirements:** R1, R2, R6
- **Dependencies and Preconditions:** Sub-Task 1 (agar tipe `parentValue` sudah ada, meskipun logic pemanggilan masih nanti).
- **In Scope for This Sub-Task:**
  - Tambahkan properti Lit baru:
    - `dependsOn`: `string` (CSS selector ke parent element) atau null. Reflected attribute `depends-on`.
    - `parentKey`: `string` (key untuk extract value dari `parent.selected`). Default `''` (artinys pakai seluruh object). Reflected attribute `parent-key`.
    - `emptyMessage`: `string` (pesan yang ditampilkan saat parent belum dipilih). Default `''` (fallback ke "No results found"). Reflected attribute `empty-message`.
  - Tambahkan internal state:
    - `_parentValue: unknown | null = null` (nilai yang diekstrak dari parent).
    - `_parentEl: HTMLElement | null = null` (cache reference ke parent element).
  - Update JSDoc class untuk mencatat property baru.
- **Out of Scope for This Sub-Task:** Event listener wiring, logic `clear()`, pemanggilan loader, render state disabled.
- **Instructions:**
  - Tambahkan `@property` di class dengan `type: String` dan attribute mapping yang benar.
  - Tambahkan `@state()` private `_parentValue` dan `_parentEl` (atau private tanpa `@state` jika tidak perlu trigger render).
- **Acceptance Criteria:**
  - Property bisa di-set via HTML attribute dan JavaScript.
  - Build lulus dan tidak ada error TypeScript.
- **Cautionary Points (Risks & Edge Cases):**
  - `_parentEl` mungkin tidak perlu reactive state jika hanya cache DOM. Jika pakai `@state()`, akan trigger render setiap kali reference berubah (tidak perlu). Gunakan private field biasa.
- **Implementation Suggestions:** Gunakan `type: String` untuk semua attribute baru. Pastikan nama attribute sesuai kebab-case ( Lit otomatis konversi camelCase ke kebab-case di default, tapi sebaiknya eksplisit).
- **Testing Suggestions:** Cek di browser console: `document.getElementById('child').dependsOn` dan `document.getElementById('child').parentKey`.
- **Done When:** Property baru ditambahkan, bisa di-set, dan build lulus.

### Sub-Task 3: Implement Parent Discovery, Event Listener, & Cleanup

- **Status:** Pending
- **Objective:** Menghubungkan child dropdown ke parent dropdown secara otomatis, mendengarkan `bie-change`, dan membersihkan listener saat disconnect.
- **Related Requirements:** R1, R4
- **Dependencies and Preconditions:** Sub-Task 2 (property `dependsOn` sudah ada).
- **In Scope for This Sub-Task:**
  - Implementasi method `_findParent()` yang resolve `dependsOn` selector ke element. Jika selector tidak valid atau tidak menemukan element, console.warn dan return null.
  - Implementasi method `_onParentChange(e: CustomEvent)` yang:
    1. Ekstrak `parentValue` dari `e.detail` menggunakan `parentKey` (jika `parentKey` ada, ambil `e.detail[parentKey]`, else ambil seluruh `e.detail`).
    2. Set `_parentValue`.
    3. Panggil `this.clear()` (reset selected).
    4. Panggil `this.reload()` (jika loader) atau filter ulang (jika static array — tapi static array cascading jarang dipakai, bisa kita skip reload untuk static array di sini karena static array tidak bergantung parentValue; yang penting adalah clear dan set parentValue agar loader di masa depan dapat parentValue).
  - Tambahkan listener di `connectedCallback()` jika `dependsOn` ter-set.
  - Hapus listener di `disconnectedCallback()`.
  - Pastikan listener hanya ditambahkan sekali (gunakan flag `_parentListenerAttached`).
- **Out of Scope for This Sub-Task:** Modifikasi render UI (disabled state, empty message), modifikasi `_fetchItems` untuk menerima `parentValue`.
- **Instructions:**
  - Di `connectedCallback()`, setelah `super.connectedCallback()`, tambahkan:
    ```ts
    if (this.dependsOn) {
      this._attachParentListener();
    }
    ```
  - Tambahkan method:
    ```ts
    private _attachParentListener() {
      if (this._parentListenerAttached) return;
      const parent = this._findParent();
      if (!parent) return;
      this._parentEl = parent;
      this._parentChangeHandler = this._onParentChange.bind(this);
      parent.addEventListener('bie-change', this._parentChangeHandler);
      this._parentListenerAttached = true;
      // Sync initial parent value jika parent sudah selected
      if (parent.selected) {
        this._parentValue = this._extractParentValue(parent.selected);
      }
    }
    ```
  - Di `disconnectedCallback()`:
    ```ts
    if (this._parentEl && this._parentChangeHandler) {
      this._parentEl.removeEventListener('bie-change', this._parentChangeHandler);
    }
    ```
- **Acceptance Criteria:**
  - Jika parent dropdown di-click dan dipilih, child dropdown otomatis `clear()` dan `_parentValue` ter-set.
  - Tidak ada memory leak: setelah child di-remove dari DOM, listener di parent tidak ada (bisa diverifikasi dengan browser DevTools Event Listeners, atau dengan console.log).
- **Cautionary Points (Risks & Edge Cases):**
  - Jika parent element di-remove dari DOM lalu child masih ada, listener mungkin masih nempel di parent yang sudah tidak ada. Tapi karena kita attach ke element instance, bukan document, itu aman selama element masih ada di DOM. Jika parent di-remove, child tetap punya reference ke element parent yang lama (tapi element tersebut detached). Itu OK untuk memory leak, tapi jika parent di-reinsert, event masih akan fire ke child. Ini acceptable untuk MVP.
  - `_findParent()` harus dijalankan setelah DOM ready. Jika `connectedCallback` di-call saat parent belum ada di DOM (misal di-render bersamaan), gunakan `requestAnimationFrame` atau `setTimeout` untuk retry sekali.
- **Implementation Suggestions:** Gunakan `document.querySelector(this.dependsOn)` untuk resolve selector. Jika parent adalah `BieDropdown` instance, cek `parent.selected` langsung. Jika parent bukan BieDropdown, cek apakah parent punya `selected` property (duck typing) atau fallback ke `e.detail` dari event.
- **Testing Suggestions:**
  - Buat file HTML test sederhana: 2 dropdown, parent static, child dependsOn parent. Pilih parent, lihat child `selected` jadi null dan `_parentValue` terisi.
  - Cek DevTools → Elements → Event Listeners: pastikan setelah child di-remove, tidak ada listener 'bie-change' yang tersisa (bisa di-proxy dengan console.log di handler).
- **Done When:** Event listener bekerja, clear terjadi otomatis, cleanup berhasil, dan tidak ada error console.

### Sub-Task 4: Wire Parent Value into Loader & Open State

- **Status:** Pending
- **Objective:** Memastikan `parentValue` diteruskan ke loader saat child dropdown membuka atau search, serta menangani kasus parent belum selected.
- **Related Requirements:** R2, R3, R5
- **Dependencies and Preconditions:** Sub-Task 3 (parent listener dan `_parentValue` sudah tersedia).
- **In Scope for This Sub-Task:**
  - Modifikasi `_fetchItems(query: string)` menjadi `_fetchItems(query: string, parentValue?: unknown)`.
  - Saat memanggil loader: `const result = loader(query, this._parentValue ?? undefined);`.
  - Modifikasi `_onPopoverToggle`:
    - Jika `dependsOn` ter-set dan `_parentValue` masih null/undefined:
      - Tampilkan `_parentNotSelected` state (bisa dengan set `_error = this.emptyMessage || 'Please select parent first'` dan `_loading = false`), atau gunakan part `empty` yang spesifik.
      - Tidak memanggil loader.
    - Jika `dependsOn` ter-set dan `_parentValue` sudah ada:
      - Panggil `_fetchItems('', this._parentValue)`.
  - Modifikasi `_onSearchInput`:
    - Jika loader dan `_parentValue` null/undefined, tidak perlu debounce fetch — langsung return (atau tampilkan empty state).
    - Jika loader dan `_parentValue` ada, panggil `_debouncedFetch(this._searchQuery, this._parentValue)`.
  - Modifikasi `_debouncedFetch` dan `_fetchItems` untuk menerima dan meneruskan `parentValue`.
- **Out of Scope for This Sub-Task:** Visual styling disabled state (akan di Sub-Task 5).
- **Instructions:**
  - Ubah signature `_fetchItems(query: string, parentValue?: unknown)`.
  - Ubah signature `_debouncedFetch(query: string, parentValue?: unknown)`.
  - Pastikan di semua call site ( `_onPopoverToggle`, `_onSearchInput`, `reload()` ) `parentValue` diteruskan.
  - Untuk `reload()`: `this._fetchItems(this._searchQuery, this._parentValue ?? undefined);`
  - Jika `dependsOn` ter-set tapi parent belum selected, set `_error` atau custom state agar user melihat pesan. Jangan set `_loading = true` karena tidak ada request yang berjalan.
- **Acceptance Criteria:**
  - Saat child dropdown dibuka tanpa parent selected, muncul pesan (bukan loading spinner) dan tidak ada network request.
  - Saat child dropdown dibuka dengan parent selected, loader dipanggil dengan argumen kedua berisi parent value.
  - Saat user mengetik di search, loader dipanggil dengan query + parent value.
  - Backward compatibility: loader lama yang hanya menerima 1 argumen tetap berfungsi (JavaScript tidak error jika function dipanggil dengan argumen lebih banyak dari parameter).
- **Cautionary Points (Risks & Edge Cases):**
  - Jika `parentValue` adalah object (misal `{id: 1, name: 'US'}`), pastikan tidak ada masalah dengan reference equality. Object tersebut berasal dari `e.detail` di parent, jadi reference sama. Tapi jika parent di-set ulang, bisa beda reference. Gunakan shallow copy atau value extraction via `parentKey` untuk menghindari masalah.
  - Race condition: jika parent berubah saat child sedang loading, `_fetchItems` harus memeriksa `signal.aborted` dan `_parentValue` terbaru. AbortController sudah ada, jadi cukup pastikan setelah await, kita cek apakah `_parentValue` masih sama dengan yang dikirim. Jika tidak, jangan update `_filteredItems`.
- **Implementation Suggestions:** Simpan `parentValue` lokal di `_fetchItems` dan bandingkan dengan `this._parentValue` setelah await untuk menghindari race condition:
  ```ts
  const currentParentValue = this._parentValue;
  // ... await result ...
  if (this._parentValue !== currentParentValue) return;
  ```
  Tapi perlu hati-hati jika `parentValue` adalah object — gunakan deep comparison atau lebih baik gunakan `parentKey` untuk extract primitive value. Dokumentasikan bahwa `parentKey` direkomendasikan untuk async loader.
- **Testing Suggestions:**
  - Buat test HTML: parent dropdown dengan items `[{id:1,name:'A'},{id:2,name:'B'}]`. Child dependsOn parent, parentKey="id", loader function `console.log(query, parentValue)`. Buka child sebelum parent selected → harus tidak ada log. Pilih parent, buka child → harus log `('', 1)` atau `('', 2)`.
- **Done When:** Loader menerima parentValue, child tidak memanggil loader tanpa parent, dan tidak ada error.

### Sub-Task 5: Add Visual States for Disabled / Waiting Parent

- **Status:** Pending
- **Objective:** Menampilkan UI state yang jelas saat child dropdown belum bisa digunakan karena parent belum dipilih.
- **Related Requirements:** R2, R6
- **Dependencies and Preconditions:** Sub-Task 4 (logic pembatasan loader sudah ada, state `_parentValue` dan pesan sudah ter-set).
- **In Scope for This Sub-Task:**
  - Tambahkan attribute `[disabled]` pada trigger button jika `dependsOn` ter-set dan parent belum selected. Atau set style `pointer-events: none` dan `opacity: 0.5`.
  - Gunakan `emptyMessage` atau `empty-message` untuk menampilkan pesan di dalam popover (part `empty` atau part baru `waiting`).
  - Pastikan jika trigger disabled, popover tidak bisa dibuka (button disabled mencegah click, tapi popovertarget masih bisa bekerja di beberapa browser — perlu di-test). Alternatif: jangan disabled trigger, tapi saat popover dibuka, langsung tampilkan pesan.
  - Jika trigger tidak disabled, mungkin lebih baik: trigger tetap clickable, tapi saat popover dibuka, isinya hanya pesan "Pilih parent terlebih dahulu" (part `empty`).
  - Pilih pendekatan: **trigger tetap clickable, popover menampilkan pesan empty** — ini lebih konsisten dengan UX popover dan tidak perlu khawatir popovertarget di disabled button.
  - Jika `emptyMessage` tidak di-set, fallback ke `Please select parent first` (atau `Pilih [parent placeholder] terlebih dahulu` jika bisa detect).
  - Pastikan pesan di-render via part yang bisa di-styling (gunakan part `empty` yang sudah ada, atau part `waiting` baru). Karena `empty` sudah ada, kita bisa pakai `empty` dengan teks dinamis.
- **Out of Scope for This Sub-Task:** Dokumentasi styling, README update.
- **Instructions:**
  - Di `_renderOptionsContent`, tambahkan kondisi:
    ```ts
    if (this.dependsOn && !this._parentValue) {
      return html`<div part="empty">${this.emptyMessage || 'Please select parent first'}</div>`;
    }
    ```
    Tapi perlu diperhatikan: kondisi ini harus di-check sebelum loading/error dan sebelum list. Tapi jika `_parentValue` ada dan loading, tetap tampilkan loading. Jika `_parentValue` ada dan error, tetap tampilkan error. Jadi urutannya:
    1. `dependsOn` + no parentValue → empty message khusus
    2. loading → loading
    3. error → error
    4. empty results → empty
    5. list → list
  - Update CSS untuk part `empty` jika ingin styling berbeda, tapi itu optional karena user bisa override via CSS custom.
  - Jika ingin trigger disabled, bisa tambahkan `disabled` attribute di button trigger jika `dependsOn && !_parentValue`:
    ```ts
    <button part="trigger" ?disabled="${this.dependsOn && !this._parentValue}" ...>
    ```
    Tapi perlu test: apakah `disabled` attribute pada button dengan `popovertarget` masih bisa toggle popover? Di Chrome, disabled button tidak bisa di-click, tapi popovertarget mungkin tetap bekerja via keyboard atau programmatic. Jika risky, skip disabled trigger dan fokus ke empty message di popover.
- **Acceptance Criteria:**
  - Saat child dropdown dibuka tanpa parent selected, popover menampilkan pesan "Pilih parent terlebih dahulu" (atau pesan custom).
  - Saat parent sudah dipilih, child dropdown menampilkan loading / list / error seperti normal.
  - Build lulus.
- **Cautionary Points (Risks & Edge Cases):**
  - Jika `emptyMessage` di-set ke string kosong `""`, pesan akan kosong. Pastikan fallback hanya jika `this.emptyMessage` falsy, bukan hanya `=== ''`. Gunakan `this.emptyMessage || 'Please select parent first'`.
  - Jika `dependsOn` di-set tapi parent sudah selected saat child di-initialize, empty message tidak muncul (karena `_parentValue` sudah terisi dari sync initial di `_attachParentListener`).
- **Implementation Suggestions:** Gunakan pendekatan "popover tetap bisa dibuka, tapi isinya pesan empty" — ini paling aman dan tidak perlu modifikasi besar pada popover logic. Cukup tambahkan guard di `_renderOptionsContent` dan `_onPopoverToggle`.
- **Testing Suggestions:**
  - Visual test: buka child dropdown tanpa parent selected → harus muncul pesan di popover.
  - Pilih parent → buka child → harus normal loading/list.
- **Done When:** UI state menunggu parent terlihat jelas, build lulus, dan tidak ada error.

### Sub-Task 6: Update README & API Documentation

- **Status:** Pending
- **Objective:** Mendokumentasikan property baru dan memberikan contoh penggunaan cascading dropdown.
- **Related Requirements:** R7
- **Dependencies and Preconditions:** Sub-Task 5 (fitur sudah jadi, API stabil).
- **In Scope for This Sub-Task:**
  - Update tabel Properties di README dengan `dependsOn`, `parentKey`, `emptyMessage`.
  - Update tabel Events (jika ada event baru — tapi kita tidak menambahkan event baru, hanya memperluas perilaku `bie-change` yang sudah ada).
  - Update section Async Loader untuk mencatat parameter `parentValue`.
  - Tambahkan section baru "Cascading Dropdown" dengan minimal 2 contoh:
    - Vanilla JS: 2 dropdown, parent static, child async loader.
    - Alpine.js: jika ada, atau React/Vue ref pattern.
  - Jelaskan flow: `dependsOn` → listen `bie-change` → auto-clear → reload dengan `parentValue`.
  - Tambahkan penjelasan bahwa `parentValue` bisa berupa primitive (jika `parentKey` di-set) atau full object (jika `parentKey` kosong).
- **Out of Scope for This Sub-Task:** Perubahan kode source.
- **Instructions:**
  - Buka `README.md`.
  - Tambahkan baris di tabel Properties:
    ```markdown
    | `dependsOn` | `depends-on` | `string` | `""` | CSS selector for parent dropdown |
    | `parentKey` | `parent-key` | `string` | `""` | Key to extract value from parent's selected item |
    | `emptyMessage` | `empty-message` | `string` | `""` | Message shown when parent is not selected yet |
    ```
  - Update ItemLoader signature di README: `items: (query, parentValue?) => items`
  - Tambahkan section baru di bawah "Async Loader" atau di akhir:
    ```markdown
    ## Cascading Dropdown
    
    You can link a child dropdown to a parent dropdown so that the child waits for the parent selection and reloads automatically.
    
    ```html
    <bie-dropdown id="country" placeholder="Select Country..."></bie-dropdown>
    <bie-dropdown id="city" placeholder="Select City..." depends-on="#country" parent-key="id" empty-message="Please select a country first"></bie-dropdown>
    ```
    
    ```js
    const city = document.getElementById('city');
    city.items = async (query, countryId) => {
      if (!countryId) return [];
      const res = await fetch(`/api/cities?country=${countryId}&q=${query}`);
      return res.json();
    };
    ```
    ```
  - Jelaskan behavior auto-clear dan auto-reload.
- **Acceptance Criteria:**
  - README ter-update, tidak ada broken link, tabel konsisten.
  - Contoh kode bisa di-copy-paste dan dijalankan (asumsikan API endpoint dummy ada).
- **Cautionary Points (Risks & Edge Cases):**
  - Pastikan `emptyMessage` default di README sesuai dengan default di kode (yaitu `''` dengan fallback runtime, bukan default `''` yang ditampilkan sebagai `''` di tabel). Di tabel, deskripsikan default sebagai `""` (empty string) dan jelaskan fallback behavior di teks.
- **Implementation Suggestions:** Gunakan heading level 2 (`##`) untuk section baru. Jika ada `index.html` demo, tambahkan juga contoh di sana.
- **Testing Suggestions:** Baca README hasil dengan markdown preview untuk memastikan formatting benar.
- **Done When:** README ter-update dengan API baru dan contoh lengkap.

### Sub-Task 7: Add Demo Example (index.html or demo file)

- **Status:** Pending
- **Objective:** Menyediakan contoh interaktif cascading dropdown yang bisa dijalankan langsung di dev server.
- **Related Requirements:** R7
- **Dependencies and Preconditions:** Sub-Task 5 (fitur sudah jadi).
- **In Scope for This Sub-Task:**
  - Jika ada `index.html` atau `demo.html`, tambahkan section cascading dropdown.
  - Jika tidak ada, buat `demo/cascading.html`.
  - Demo harus menggunakan data dummy (static array untuk parent, mock loader untuk child) agar tidak perlu backend.
  - Pastikan demo menampilkan flow lengkap: buka child tanpa parent (pesan), pilih parent (child auto-clear), buka child (data muncul), ganti parent (child auto-clear lagi).
- **Out of Scope for This Sub-Task:** Perubahan kode production.
- **Instructions:**
  - Buka file demo (cari `index.html` atau `demo.html` atau buat `demo/cascading.html`).
  - Tambahkan 2 `<bie-dropdown>` dengan `depends-on` dan `parent-key`.
  - Gunakan `setTimeout` atau `Promise.resolve` untuk mock async loader child:
    ```js
    const cities = {
      1: [{id: 11, name: 'New York'}, {id: 12, name: 'Los Angeles'}],
      2: [{id: 21, name: 'London'}, {id: 22, name: 'Manchester'}],
    };
    cityDropdown.items = async (query, countryId) => {
      if (!countryId) return [];
      await new Promise(r => setTimeout(r, 300)); // simulate network
      return cities[countryId] || [];
    };
    ```
- **Acceptance Criteria:**
  - Demo bisa dijalankan dengan `npm run dev` dan menampilkan cascading dropdown yang berfungsi.
- **Cautionary Points (Risks & Edge Cases):**
  - Pastikan demo tidak mengganggu demo lain yang sudah ada. Tambahkan sebagai section baru atau halaman terpisah.
- **Implementation Suggestions:** Gunakan data dummy yang simple. Jika `index.html` sudah ada, append section baru.
- **Testing Suggestions:** Jalankan `npm run dev`, buka demo, interact dengan 2 dropdown, verify behavior sesuai requirement.
- **Done When:** Demo ada, berfungsi, dan bisa diakses dari dev server.

### Sub-Task 8: Full Build & End-to-End Verification

- **Status:** Pending
- **Objective:** Memastikan semua perubahan tidak merusak build, tidak ada regression, dan fitur cascading berfungsi end-to-end.
- **Related Requirements:** R5, R7
- **Dependencies and Preconditions:** Sub-Task 1-7 semua selesai.
- **In Scope for This Sub-Task:**
  - Jalankan `npm run build` dan pastikan tidak ada error.
  - Jalankan `npm run dev` dan buka demo.
  - Verifikasi manual:
    1. Dropdown tanpa `dependsOn` tetap berfungsi normal (static array dan loader).
    2. Dropdown dengan `dependsOn` tapi parent belum selected: buka popover, harus muncul pesan empty.
    3. Pilih parent: child auto-clear (selected jadi null), reload dipanggil.
    4. Buka child setelah parent selected: loader dipanggil dengan parentValue.
    5. Search di child: loader dipanggil dengan query + parentValue.
    6. Ganti parent: child auto-clear lagi.
    7. Keyboard navigation tetap berfungsi.
    8. Mobile (responsive) tetap berfungsi.
  - Cek ukuran bundle: seharusnya tidak bertambah signifikan (estimasi < 1 KB gzipped tambahan).
- **Out of Scope for This Sub-Task:** Perubahan kode baru.
- **Instructions:**
  - `npm run build`
  - `npm run dev` (buka browser)
  - Test scenarios di atas.
  - Cek `dist/bie-dropdown.js` ukuran (bandingkan dengan sebelumnya jika ada baseline).
- **Acceptance Criteria:**
  - Build sukses.
  - Semua scenario E2E berfungsi.
  - Tidak ada error di console browser.
  - Ukuran bundle tidak naik drastis.
- **Cautionary Points (Risks & Edge Cases):**
  - Periksa event listener leak: buka DevTools → Memory → Take heap snapshot, cari detached `BieDropdown` instances.
  - Periksa AbortController: pastikan tidak ada unhandled rejection jika request di-abort.
- **Implementation Suggestions:** Siapkan checklist di `.opencode/plan.md` ini untuk dicentang saat verifikasi.
- **Testing Suggestions:** Gunakan Chrome DevTools Performance dan Memory tab untuk quick smoke test.
- **Done When:** Build lulus, E2E lulus, ukuran bundle acceptable.

## Final Integration & Verification

- **System-Wide Test:**
  - Semua sub-task selesai.
  - `npm run build` lulus tanpa error.
  - Demo cascading dropdown berfungsi lengkap.
  - README ter-update.
  - Tidak ada regression pada dropdown biasa.
- **Completion Checklist:**
  - [ ] Tipe `ItemLoader` diperbarui dengan `parentValue?`
  - [ ] Property `dependsOn`, `parentKey`, `emptyMessage` ditambahkan
  - [ ] Event listener ke parent berfungsi dan auto-clear
  - [ ] Loader menerima `parentValue` dan tidak dipanggil tanpa parent
  - [ ] UI state menunggu parent terlihat jelas
  - [ ] README diperbarui dengan API baru dan contoh
  - [ ] Demo cascading dropdown ditambahkan
  - [ ] Build & E2E verifikasi lulus
  - [ ] Ukuran bundle tidak naik signifikan

## Open Questions

- Apakah perlu menambahkan event baru seperti `bie-clear` ketika auto-clear terjadi? (Tidak di-scope MVP, bisa di-request terpisah).
- Apakah perlu support `dependsOn` yang menunggu lebih dari 1 parent? (Tidak di-scope MVP, gunakan `dependsOn` single selector saja).
- Apakah perlu menambahkan method `setDependsOn(selector)` secara imperatif? (Bisa, tapi property `dependsOn` yang reactive sudah cukup untuk MVP).
