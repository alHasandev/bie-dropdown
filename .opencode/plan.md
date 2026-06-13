# Plan: Initialize Custom Web Component NPM Package (wui-dropdown)

## Objective

Membuat sebuah npm package untuk custom web component dropdown menggunakan Lit, TypeScript, dan Vite. Package ini siap di-publish ke npm registry dan dapat digunakan di berbagai framework (React, Vue, Angular, atau vanilla HTML).

## Requirements Snapshot

- **R1:** Project menggunakan Lit sebagai library web component.
- **R2:** Build tool menggunakan Vite dalam library mode.
- **R3:** Menggunakan TypeScript dengan konfigurasi yang tepat.
- **R4:** Package name adalah `wui-dropdown` (atau bisa diubah).
- **R5:** Komponen dropdown siap digunakan (minimal working component).

## Scope

- Inisialisasi npm project (`package.json`)
- Konfigurasi Vite untuk library mode
- Konfigurasi TypeScript
- Membuat komponen dropdown dengan Lit
- Setup HTML dev preview untuk testing lokal
- Struktur project yang siap publish ke npm

## Assumptions and Constraints

- Node.js sudah terinstall di environment
- Package name sementara: `wui-dropdown` (user bisa mengganti di package.json)
- Module format: ESM (ES Modules)
- Output folder: `dist/`
- Entry point: `src/index.ts`

## Risks and Areas Requiring Care

- Memastikan properti `@customElement` dan dekorator Lit bekerja dengan benar di TypeScript
- Konfigurasi `vite.config.ts` untuk library mode harus tepat agar bundle bisa di-import oleh consumer
- Type declarations (`.d.ts`) harus digenerate untuk TypeScript consumers

## Core Concepts

### Lit Web Component Structure

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('wui-dropdown')
export class WuiDropdown extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) placeholder = 'Select an option';

  static styles = css`
    :host { display: inline-block; position: relative; }
  `;

  render() {
    return html`<slot></slot>`;
  }
}
```

### Vite Library Mode

Vite library mode membundle komponen sebagai library yang bisa di-import. Entry point utama mengekspor class komponen. Consumer cukup meng-import dan mendaftarkan custom element.

## Sub-Tasks

### Sub-Task 1: Initialize NPM Package and Project Structure

- **Status:** Pending
- **Objective:** Membuat `package.json` dan struktur folder dasar project.
- **Related Requirements:** R1, R4
- **Dependencies and Preconditions:** None
- **In Scope for This Sub-Task:**
  - Membuat `package.json` dengan metadata package
  - Membuat struktur folder: `src/`, `dist/`
  - Menentukan dependencies: `lit`
  - Menentukan devDependencies: `typescript`, `vite`
- **Out of Scope for This Sub-Task:** Konfigurasi detail Vite dan TypeScript (Sub-Task 2 & 3)
- **Instructions:**
  1. Buat `package.json` dengan `npm init` atau manual
  2. Install dependencies: `npm install lit`
  3. Install devDependencies: `npm install -D typescript vite`
  4. Buat folder `src/`
- **Acceptance Criteria:** `package.json` ada dengan dependencies `lit` dan devDependencies `typescript`, `vite`
- **Implementation Suggestions:** Gunakan `npm init -y` lalu edit manual, atau buat file `package.json` langsung.
- **Testing Suggestions:** `npm install` berhasil tanpa error
- **Done When:** Dependencies terinstall dan struktur folder siap.

### Sub-Task 2: Configure Vite for Library Mode

- **Status:** Pending
- **Objective:** Membuat `vite.config.ts` yang mengkonfigurasi Vite untuk membuild library web component.
- **Related Requirements:** R2
- **Dependencies and Preconditions:** Sub-Task 1 (package.json)
- **In Scope for This Sub-Task:**
  - Membuat `vite.config.ts`
  - Konfigurasi `build.lib` (entry, name, formats)
  - Pastikan `lit` tidak dibundle (eksternal) atau dibundle (self-contained)
  - Konfigurasi untuk mengenerate type declarations via `vite-plugin-dts` atau tsc
- **Out of Scope for This Sub-Task:** Konfigurasi TypeScript terpisah (Sub-Task 3)
- **Instructions:**
  1. Buat `vite.config.ts` di root
  2. Set `build.lib.entry` ke `src/index.ts`
  3. Set `build.lib.name` ke `WuiDropdown`
  4. Set `build.lib.formats` ke `['es']`
  5. Set `build.lib.fileName` ke `wui-dropdown`
  6. Externalize `lit` agar consumer yang resolve dependency-nya sendiri (rekomendasi umum untuk library)
  7. Atau bundle `lit` jika ingin self-contained (pertimbangan: bundle size vs dependency management)
- **Acceptance Criteria:** `npm run build` menghasilkan output di `dist/` dengan format ES module
- **Implementation Suggestions:** Gunakan library mode Vite standar. Untuk type declarations, gunakan `vite-plugin-dts` atau jalankan `tsc --emitDeclarationOnly` secara terpisah.
- **Testing Suggestions:** `npx vite build` berhasil, cek file output di `dist/`
- **Done When:** Build command selesai tanpa error dan menghasilkan file di `dist/`.

### Sub-Task 3: Configure TypeScript

- **Status:** Pending
- **Objective:** Membuat `tsconfig.json` yang sesuai untuk project Lit web component.
- **Related Requirements:** R3
- **Dependencies and Preconditions:** Sub-Task 1
- **In Scope for This Sub-Task:**
  - Membuat `tsconfig.json`
  - Target: `ES2021` atau `ESNext`
  - Module: `ESNext` dengan `moduleResolution: bundler`
  - Enable `experimentalDecorators` (jika menggunakan dekorator Lit)
  - `useDefineForClassFields: false` (Lit recommendation)
  - `strict: true`
  - Output declarations
- **Out of Scope for This Sub-Task:** -
- **Instructions:**
  1. Buat `tsconfig.json`
  2. Pastikan setting kompatibel dengan Lit:
     - `"experimentalDecorators": true`
     - `"useDefineForClassFields": false`
  3. Setup `include` dan `exclude`
- **Acceptance Criteria:** TypeScript tidak error saat dijalankan
- **Testing Suggestions:** `npx tsc --noEmit` berhasil tanpa error
- **Done When:** TypeScript check lulus

### Sub-Task 4: Create Lit Dropdown Component Source Code

- **Status:** Pending
- **Objective:** Membuat source code komponen dropdown menggunakan Lit.
- **Related Requirements:** R1, R5
- **Dependencies and Preconditions:** Sub-Task 1, 2, 3
- **In Scope for This Sub-Task:**
  - Membuat `src/wui-dropdown.ts` — komponen dropdown utama
  - Membuat `src/index.ts` — entry point export
  - Komponen memiliki properti dasar: `open`, `placeholder`, `options`
  - Styling dasar dropdown (CSS custom properties untuk theming)
  - Event emitters (e.g., `wui-change`) untuk interaksi
  - Keyboard navigation dasar (optional, tapi baik untuk aksesibilitas)
- **Out of Scope for This Sub-Task:** Dokumentasi lengkap, testing unit, aksesibilitas penuh (ARIA lengkap)
- **Instructions:**
  1. Buat `src/wui-dropdown.ts` dengan class `WuiDropdown` extends `LitElement`
  2. Daftarkan custom element dengan `@customElement('wui-dropdown')`
  3. Implementasi properti: `open`, `placeholder`, `options` (array), `value`
  4. Implementasi render: trigger button + dropdown list
  5. Toggle open/close saat klik trigger
  6. Emit custom event `wui-change` saat option dipilih
  7. Buat `src/index.ts` yang mengekspor class komponen
- **Acceptance Criteria:** Komponen bisa dirender di browser, dropdown bisa dibuka/tutup, option bisa dipilih
- **Implementation Suggestions:** Mulai dengan komponen sederhana — fokus pada fungsionalitas dasar dulu.
- **Testing Suggestions:** Build project, buka dev HTML preview, tes interaksi dropdown
- **Done When:** Komponen berfungsi di browser dev preview

### Sub-Task 5: Set Up Dev Preview and Verify

- **Status:** Pending
- **Objective:** Membuat file HTML untuk development preview dan memverifikasi komponen bekerja.
- **Related Requirements:** R5
- **Dependencies and Preconditions:** Sub-Task 4
- **In Scope for This Sub-Task:**
  - Membuat `index.html` atau `dev/index.html` untuk development preview
  - Setup script `dev` di package.json untuk Vite dev server
  - Setup script `build` untuk production build
  - Verifikasi komponen berfungsi
- **Out of Scope for This Sub-Task:** Testing otomatis (Vitest/Web Test Runner)
- **Instructions:**
  1. Buat `index.html` di root yang meng-import komponen
  2. Tambahkan contoh penggunaan `<wui-dropdown>`
  3. Tambahkan script di `package.json`: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`
  4. Jalankan `npm run dev` dan buka di browser
- **Acceptance Criteria:** Komponen tampil dan berfungsi di browser saat `npm run dev`
- **Testing Suggestions:** Buka browser, test interaksi dropdown
- **Done When:** Dev server berjalan dan komponen berfungsi

## Final Integration & Verification

- **System-Wide Test:** `npm run build` + `npm run dev` berhasil, komponen dropdown berfungsi penuh di browser
- **Completion Checklist:**
  - [ ] `package.json` dengan metadata lengkap
  - [ ] `tsconfig.json` terkonfigurasi dengan benar
  - [ ] `vite.config.ts` library mode
  - [ ] `src/wui-dropdown.ts` komponen Lit
  - [ ] `src/index.ts` entry point
  - [ ] `index.html` dev preview
  - [ ] `npm run build` sukses
  - [ ] `npm run dev` sukses dan komponen berfungsi

## Open Questions

- Apakah package akan dipublish secara publik di npm atau private? (Tidak mempengaruhi setup, hanya metadata)
- Apakah perlu dukungan CommonJS selain ESM? (Asumsi: ESM only)
- Apakah dropdown perlu fitur spesifik seperti multi-select, search, grouped options? (Asumsi: basic single-select dulu)
