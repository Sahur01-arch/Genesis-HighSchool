# OpenJS — Dokumentasi Lengkap untuk Referensi AI

> Sumber: dokumentasi resmi https://openjs.wiki.gd/ + temuan praktis dari sesi debugging nyata.
> Ditulis untuk dibaca AI/asisten coding sebagai konteks penuh sebelum membantu development di project berbasis OpenJS.
> Bagian bertanda **[BELUM TERVERIFIKASI]** adalah asumsi/dugaan yang belum dikonfirmasi 100% dari sumber resmi — verifikasi manual sebelum dipakai di produksi.

---

## 1. Apa itu OpenJS

OpenJS (nama plugin: "OpenJavascript") adalah plugin scripting untuk server Minecraft **Bukkit/Spigot/Paper/Purpur/Folia** yang memakai **JavaScript (ES6)** sebagai bahasa scripting. Engine eksekusinya **Nashorn-compatible** (`importClass` setara `Java.type` dari API Nashorn) — bukan GraalJS/V8 modern, sehingga dukungan fitur ES6 terbaru (class, arrow function, template literal, dll) **kemungkinan parsial**, harus ditest per fitur sebelum dipakai luas.

Fitur inti:
- Hot-reload otomatis (config `AutoReloadScriptsOnChange`)
- Command `/oj` untuk manajemen plugin & script
- Storage bawaan (`DiskApi`)
- Dukungan eksplisit Folia (multithreading region-based)
- Bisa convert script jadi plugin JAR native (`/oj generatePlugin`, fitur ScriptPack — skema `info.json`-nya belum terverifikasi di sesi ini)

Compatible versi Minecraft: 1.13–1.21.8 (per rilis 1.2.0, cek rilis terbaru untuk update).

---

## 2. Instalasi & Struktur Folder

```
plugins/OpenJS/
├── scripts/
│   ├── main.js              <- entry point umum (opsional, bisa nama lain)
│   ├── libs/                 <- konvensi: modul/library reusable
│   │   ├── libkelas.js
│   │   ├── libluckperms.js
│   │   └── ...
│   └── handler/               <- konvensi: command handler
│       ├── kelas_command.js
│       └── ...
├── Libs/                      <- folder JAR eksternal untuk importLib() — HURUF BESAR, beda dari scripts/libs/
└── config.yml
```

**PENTING:** `scripts/libs/` (buatan sendiri, tempat modul `.js`) dan `plugins/OpenJS/Libs/` (bawaan plugin, tempat file `.jar` untuk `importLib()`) adalah **2 folder berbeda** — jangan tertukar meski namanya mirip.

Nama folder di dalam `scripts/` **bebas** (bukan reserved word) — beda dari LuaLink yang punya folder `libs/` khusus bawaan.

### Konfigurasi (`config.yml`)

| Opsi | Fungsi |
|---|---|
| `PrintScriptActivations` | Log saat script dimuat |
| `AutoReloadScriptsOnChange` | Hot-reload otomatis saat file berubah — **matikan saat debugging** kalau curiga ada duplikat event trigger dari filesystem watcher |
| `UseOldClassImporter` | JANGAN aktifkan — translasi class Java tidak akurat |
| `debugMode` | Makan performa signifikan, hanya untuk troubleshooting |
| `AllowFeatureFlags` | Kontrol on/off untuk semua `//!flag` |

---

## 3. Command Server (`/oj`)

| Command | Fungsi |
|---|---|
| `/oj reload [script]` | Reload semua / 1 script |
| `/oj load <script>` | Muat script |
| `/oj enable <script>` / `/oj disable <script>` | Aktif/nonaktif — lebih "bersih" dari `reload` untuk clear state lama |
| `/oj list [enabled\|disabled\|not_loaded]` | Daftar script |
| `/oj generatePlugin <scriptPack>` | Convert ScriptPack → plugin JAR native |

Permission: `openjs.use`.

**Temuan praktis:** kalau `reload` biasa tidak menyelesaikan bug (misal perubahan kode tidak "terasa" walau sudah save+reload), coba `disable` lalu `enable` — ini reset state lebih total. Kalau masih gagal, restart server penuh (JVM bisa cache compiled script di level yang tidak selalu ter-clear oleh reload command).

---

## 4. Aturan Resolusi Path — PALING SERING JADI SUMBER BUG

Ini **temuan kritis** dari debugging nyata, tidak eksplisit di dokumentasi resmi:

| Function | Base path resolusi |
|---|---|
| `LoadScript(path)` / `UnloadScript(path)` | Relatif dari **root `scripts/`** |
| `requireScript(path)` | Relatif dari **lokasi file yang memanggil**, BUKAN dari root `scripts/` |

Contoh kasus nyata: file `handler/command.js` yang memanggil `requireScript("libs/libkelas.js")` akan salah resolve jadi `handler/libs/libkelas.js` (path digabung ke folder file itu sendiri). Solusi: pakai `requireScript("../libs/libkelas.js")` (naik 1 folder dulu) dari dalam `handler/`.

**Aturan tambahan:** JANGAN pakai leading slash (`/`) di depan path manapun (`/libs/...`) — beberapa pengujian menunjukkan ini bisa membuat sistem salah resolve dan gagal load tanpa error yang jelas (`"Did not return anything"` meski file sebenarnya benar), meski mekanisme pastinya tidak terverifikasi dari source code.

**Perilaku `requireScript` yang perlu diingat:** script yang di-require **dieksekusi ulang** di environment yang sama tiap kali dipanggil dari script berbeda (bukan module cache global seperti Node.js). Kalau ingin hindari re-eksekusi berulang, simpan hasil `requireScript(...)` di variabel top-level file pemanggil (dipanggil sekali saat file itu load), jangan panggil di dalam handler yang sering dieksekusi (`onCommand`, dst).

---

## 4.5. 🔄 KOREKSI RESMI TERBARU (Diverifikasi Ulang dari Dokumentasi Official)

Bagian ini berisi **koreksi terkonfirmasi** dari dokumentasi resmi yang membetulkan asumsi-asumsi di versi awal file ini. Baca ini SEBELUM bagian 5 kalau ada konflik informasi.

### 🔴 PENTING: `DiskApi.saveFile()` MENGHAPUS DATA DARI MEMORI

Dari dokumentasi resmi (`openjs-components/in-build-classes/diskapi.md`):
> `saveFile` ... **This will also clear the data from the memory (ram)**

Artinya: setelah `saveFile(...)` dipanggil, kalau kamu langsung `getVar(...)` lagi **tanpa** `loadFile(...)` ulang, hasilnya balik ke `fallbackValue` — bukan data yang baru saja disimpan. Pola yang **salah**:
```js
DiskApi.setVar(fileName, key, value, false);
DiskApi.saveFile(fileName, false, false);
var cekLagi = DiskApi.getVar(fileName, key, null, false); // ❌ SALAH, kembali ke null!
```
Pola yang **benar** — load ulang dulu kalau butuh baca lagi setelah save:
```js
DiskApi.setVar(fileName, key, value, false);
DiskApi.saveFile(fileName, false, false);
DiskApi.loadFile(fileName, false, false); // WAJIB load ulang sebelum baca lagi
var cekLagi = DiskApi.getVar(fileName, key, null, false);
```

### 🔴 PENTING: Aturan `async` Parameter di DiskApi — Kebalikan dari Asumsi Sebelumnya

Dari dokumentasi resmi:
> If you're using `task.spawn(function() {})` to run your logic off the main thread, you **should set `async = false`** in your DiskApi methods. This avoids double-threading and ensures data is loaded and available in the same thread.

**Artinya:** kalau kode `DiskApi.loadFile`/`saveFile` sudah dipanggil di dalam `task.spawn(...)`, parameter `async` di method DiskApi itu sendiri **harus `false`**, BUKAN `true`. Menyetel `async=true` di dalam `task.spawn` menyebabkan **double-threading** (thread di dalam thread) yang bisa bikin data tidak sinkron.

**Banyak contoh kode di bagian bawah file ini (dan di kode yang pernah dibuat sebelumnya di project) memakai pola `task.spawn(function(){ DiskApi.loadFile(fileName, true, false); ... })` — ini SALAH menurut dokumentasi resmi.** Perbaikan: kalau sudah di dalam `task.spawn`, selalu `async=false`. Kalau **tidak** dibungkus `task.spawn` sama sekali (dipanggil langsung di handler), baru pertimbangkan `async=true` untuk operasi besar.

### 🟡 Sejak OpenJS 1.3.0: Auto-Load Folder dengan `main.js`/`Main.js`

Dari dokumentasi resmi (`archive/managing-and-organizing-scripts-with-folders.md`):
> Since OpenJS 1.3.0, scripts will get automatically loaded even if they are inside a folder and named main.js/Main.js.

Kalau versi OpenJS di server-mu **1.3.0 ke atas**, folder yang berisi `main.js`/`Main.js` di dalamnya otomatis ter-load, **nama script-nya jadi nama foldernya** (bukan `main.js`). Ini fitur yang lebih baru dari pola manual `//!loadmanually` + `main.js` sentral yang kita bangun manual sebelumnya — cek versi OpenJS-mu dulu sebelum pindah ke pola ini, karena kalau versi lebih lama, fitur ini tidak berlaku.

### 🟡 Path Relatif `".."` — Berlaku di "Fungsi Manapun yang Menerima Path"

Dokumentasi resmi mengonfirmasi:
> If you want to jump out of the path via any function that expects a path use ".."

Ini mengonfirmasi solusi `../libs/...` yang kita temukan lewat trial-error untuk `requireScript` memang benar secara resmi — dan berlaku umum untuk fungsi manapun yang menerima path, bukan cuma `requireScript`.

### 🟢 `task.entitySchedule()` — Pilihan LEBIH AMAN daripada `task.main()` untuk Cross-Compatibility

Dokumentasi resmi (`in-build-classes/scheduling.md`) menyebut eksplisit:
> You can still use `task.entitySchedule()` API on non-Folia servers — On traditional Bukkit/Spigot/Paper setups, `task.entitySchedule()` will simply run on the main server thread. This makes it ideal for writing cross-compatible scripts that work on both Folia and non-Folia servers **without needing code changes**.

**Rekomendasi update:** daripada selalu pakai `task.main(fn)` (yang eksplisit **tidak jalan di Folia**, perlu percabangan kode `if isFolia then entitySchedule else main`), lebih baik **default ke `task.entitySchedule(entity, fn)`** untuk kode yang terikat ke 1 entity/player tertentu — otomatis bekerja di kedua jenis server tanpa perlu tulis 2 versi kode. `task.main()` tetap dipakai untuk operasi **tidak terikat entity spesifik** (broadcast server-wide, dispatch command console, dll — yang memang tidak punya "entity" untuk dijadikan konteks).

### 🟢 `task.wait()` di Main Thread — Cuma Warning, Bukan Selalu Fatal

Dokumentasi resmi:
> **If called on the main server thread, a warning will be logged because this can freeze the server.**

Ini melunakkan klaim sebelumnya bahwa `task.wait()` di main thread selalu berbahaya fatal — kenyataannya cuma **warning log** + risiko freeze (bukan crash/ClassCastException otomatis). `ClassCastException` yang kita alami sebelumnya kemungkinan besar tetap disebabkan kombinasi spesifik (`task.waitForScript` + timing race saat startup plugin), bukan `task.wait()` biasa semata.

### 🟢 Exception di Script Tidak Mematikan Server

Dokumentasi resmi menegaskan:
> Errors in scripts are caught and logged; they won't crash the server.

Jadi error yang kita alami sebelumnya (`ClassCastException`, dll) **tidak** mematikan seluruh server — cuma menghentikan eksekusi script/fungsi yang error saat itu. Tetap penting pakai `try-catch` untuk kontrol alur (supaya modul lain tetap lanjut load), tapi tidak perlu takut 1 bug script bikin server down total.

---

## 5. Global API Lengkap

### 5.1 `script`
```js
script.Name           // nama script
script.RelativePath   // path relatif
script.File           // java.io.File
```

### 5.2 `log`
```js
log.info("pesan")
log.error("pesan")    // [BELUM TERVERIFIKASI penuh, tapi dipakai konsisten di banyak contoh kerja]
```
Selalu pakai `log`, bukan `java.util.logging.Logger` langsung — supaya sumber log jelas ter-tag `[OpenJS] [namafile.js]`.

### 5.3 `task` — Scheduler & Threading (paling kompleks, paling rawan bug)

```js
task.spawn(fn)                        // async: Bukkit=async scheduler, Folia=thread terpisah
task.main(fn)                          // jalan sinkron di main thread
task.entitySchedule(entity, fn)        // Folia-safe, terikat entity, alternatif task.main
task.thread(fn)                        // jalan paralel di thread terpisah
task.threadType()                      // "MAIN" | "THREAD" | "POOL"
task.delay(delaySec, fn)               // sekali jalan setelah delay (detik)
task.repeat(delaySec, periodTick, fn)  // delay awal (detik) + interval berulang (tick)
task.cancel(taskId)
task.bindToUnload(fn)                  // cleanup otomatis saat script di-unload/reload
task.wait(sec)                         // BLOCKING yield — HANYA aman di dalam task.thread/task.spawn
task.waitForScript(scriptName)         // ⚠️ TERBUKTI BERMASALAH — lihat bagian 8
task.waitForPlugin(pluginName)         // tunggu plugin lain siap, aman dipanggil di top-level
```

**`task.latch()`** — primitif sinkronisasi antar-thread:
```js
const latch = task.latch()
latch.wait()            // blok sampai invoke() dipanggil dari thread lain, return value-nya
latch.invoke(value)      // unblock semua wait(), trigger listener
latch.listen(fn)         // callback tiap kali di-invoke (berkali-kali)
latch.connect(fn)        // set handler tunggal untuk fire()
latch.fire(value)        // panggil handler yang ter-connect
latch.destroy()          // hancurkan latch, wait() pending terima null
latch.invoked            // boolean status
```

**ATURAN KRITIS THREAD-SAFETY** (berlaku di semua server Bukkit, bukan cuma Folia):
- Method Bukkit API (`Bukkit.dispatchCommand`, `Bukkit.broadcastMessage`, manipulasi world/entity/inventory) **wajib** dipanggil dari main thread.
- Kalau kode sedang berjalan di `onCommand`/`registerEvent` handler biasa → **sudah** di main thread, `task.main()` tidak perlu (malah menambah delay 1 tick tanpa perlu).
- Kalau kode berjalan di dalam `task.spawn`/`task.thread`/setelah `task.wait` → **wajib** bungkus `task.main()` sebelum sentuh Bukkit API.
- Cek cepat: `log.info("Thread: " + task.threadType())` — kalau `"MAIN"`, aman langsung; kalau `"THREAD"`/`"POOL"`, wajib `task.main()`.
- **`task.wait()` TIDAK BOLEH dipanggil di dalam callback `task.main()`** — `task.main` jalan sinkron di main thread (bukan konteks coroutine/thread), sementara `task.wait` didesain untuk yielding di thread terpisah. Kombinasi ini memicu `ClassCastException` (lihat bagian 8). Kalau butuh urutan sinkron (command A selesai sebelum command B), 2 `dispatchCommand` berurutan **dalam thread yang sama sudah otomatis sinkron** tanpa perlu `task.wait` sama sekali.

### 5.4 `registerEvent` / `unregisterEvent`
```js
var listener = registerEvent("org.bukkit.event.player.PlayerJoinEvent", function(event) {
    var player = event.getPlayer();
});
unregisterEvent(listener);
```
Bisa listen event custom dari plugin lain (nama class lengkap sebagai string).

### 5.5 `addCommand` / `removeCommand`
```js
addCommand("nama", {
    onCommand: function(sender, args) {
        // args = Java array, convert: var jsArgs = toArray(args)
    },
    onTabComplete: function(sender, args) {
        return toJavaList(["saran1", "saran2"]); // WAJIB Java List, bukan array JS biasa
    }
}, "permission.node.opsional");
```
Tanpa permission = command bisa dipakai semua player.

**Pola sub-command routing (direkomendasikan untuk sistem kompleks):**
```js
addCommand("kelas", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];
        var restArgs = jsArgs.slice(1);
        switch (aksi) {
            case "tambah": /* ... */ break;
            case "hapus": /* ... */ break;
            default: sender.sendMessage("§cAksi tidak dikenal.");
        }
    }
}, "server.kelas.manage");
```
Ini menghindari command sprawl (puluhan `addCommand` terpisah) — 1 permission node per sistem, bukan per aksi.

**Bug JS umum di sini:** lupa `:` setelah `case "..."` menghasilkan error syntax yang **pesannya menyesatkan** — nunjuk ke baris SETELAH case yang salah, bukan ke case-nya sendiri (`"Expected : but found ..."`).

### 5.6 `importClass` / `importLib`
```js
var Bukkit = importClass("org.bukkit.Bukkit")   // setara Java.type() Nashorn
```
```js
var loader = importLib("library-name.jar");     // baca dari plugins/OpenJS/Libs/ (huruf besar)
var JavaClass = loader.loadClass("com.example.MyClass");
var instance = JavaClass.getConstructor().newInstance();
```
Alternatif import via comment directive:
```js
//!import org.bukkit.Bukkit
var Bukkit = org.bukkit.Bukkit;
```
Catatan `importLib`: nama file harus persis, JAR harus kompatibel Java runtime server, hanya pakai JAR terpercaya (risiko keamanan), JAR besar bisa perlambat startup.

### 5.7 `requireScript`
```js
var Modul = requireScript("relative/path/dari/file/pemanggil.js");
```
File yang di-require **wajib** `return {...}` di top-level (bukan di dalam function/if) untuk hasilnya bisa diambil. Lupa `return` atau `return` terjebak di dalam blok menghasilkan warning `"Did not return anything"` tanpa crash fatal.

**Pola modul standar (mirip `module.exports` Node.js):**
```js
//!loadmanually

function fungsiA() { /* ... */ }
function fungsiB() { /* ... */ }

return {
    fungsiA: fungsiA,
    fungsiB: fungsiB
};
```

### 5.8 `setShared` / `getShared`
```js
setShared("key", value);       // dari script A
var value = getShared("key");   // dari script B
```
Berbagi variabel/fungsi antar script secara global. **Bukan** penyimpanan permanen — hilang saat restart. Script yang manggil `getShared` harus load **setelah** script yang `setShared`, atau hasilnya `undefined`.

### 5.9 `LoadScript` / `UnloadScript`
```js
LoadScript("path/relatif/dari/root/scripts.js")
UnloadScript("path/sama.js")
```
Lihat bagian 4 soal perbedaan resolusi path vs `requireScript`.

**PERINGATAN KRITIS:** memanggil `LoadScript()` terlalu awal (langsung di top-level script yang auto-load saat startup plugin) bisa memicu error eksplisit: `"Do not manually load scripts while they are being initialized!"` — diikuti `ClassCastException: Cannot cast ... JO16 to ... scriptTaskerApi`. Flag `//!waitForInit` **membantu tapi tidak selalu cukup**. Solusi yang terbukti bekerja: bungkus seluruh rangkaian `LoadScript` di dalam `task.thread(fn)` dengan `task.wait(n)` sebagai delay antar tahap (bukan `task.waitForScript`, yang punya bug sendiri — lihat bagian 8), dan bungkus tiap `LoadScript` dengan `try-catch` supaya 1 kegagalan tidak menghentikan seluruh rangkaian load.

### 5.10 `DiskApi` — Storage Persisten Bawaan

> ⚠️ **WAJIB BACA sebelum pakai `setVar`, atau `log.info`/`sendMessage` yang melibatkan objek/array:**
> Jangan pernah concat objek/array langsung ke string (`"teks " + objekAtauArray`) — JS akan mengubahnya jadi teks `[object Object]` yang merusak JSON. Selalu `JSON.stringify(objekAtauArray)` dulu. Detail lengkap + cara pemulihan file corrupt ada di **bagian 8.2b**.

```js
DiskApi.loadFile(fileName, async, global)              // WAJIB dipanggil sebelum getVar/setVar
DiskApi.saveFile(fileName, async, global)
DiskApi.getVar(fileName, key, fallback, global)
DiskApi.setVar(fileName, key, value, global)
```
- `fileName`: nama file data (tanpa perlu ekstensi eksplisit setahu dari contoh).
- `async`: `true` untuk operasi non-blocking (pakai bareng `task.spawn`) — disarankan untuk data besar/banyak player.
- `global`: `true` untuk data yang shared lintas-script, `false` untuk data spesifik 1 script (belum terverifikasi detail).
- Value bisa berupa object/array JS langsung (nested), tidak perlu manual `JSON.stringify`.

**Pola CRUD lengkap (contoh per-player, MENGIKUTI ATURAN RESMI async — lihat bagian 4.5):**
```js
// Dipanggil LANGSUNG (tidak di dalam task.spawn) -> boleh async=true untuk data besar
function simpan(uuid, data) {
    var fileName = "namadata";
    DiskApi.loadFile(fileName, false, false);
    DiskApi.setVar(fileName, uuid, data, false);
    DiskApi.saveFile(fileName, false, false);
    // INGAT: setelah saveFile, data terhapus dari RAM.
    // Kalau butuh baca lagi setelah ini, loadFile(...) dulu.
}

// Dipanggil DI DALAM task.spawn -> WAJIB async=false semua (cegah double-threading)
function simpanAsync(uuid, data) {
    task.spawn(function() {
        var fileName = "namadata";
        DiskApi.loadFile(fileName, false, false);  // false, BUKAN true, karena sudah di task.spawn
        DiskApi.setVar(fileName, uuid, data, false);
        DiskApi.saveFile(fileName, false, false);   // false juga
    });
}
```

**Pola index untuk "list semua record"** (DiskApi tidak punya method bawaan untuk enumerasi semua key):
```js
// simpan daftar ID di key khusus "_index" atau "_daftarX"
var daftarId = DiskApi.getVar(fileName, "_index", [], false);
if (daftarId.indexOf(idBaru) === -1) {
    daftarId.push(idBaru);
    DiskApi.setVar(fileName, "_index", daftarId, false);
}
```

**Kapan DiskApi cukup vs kapan perlu SQLite:** cukup untuk data ringan per-grup (kelas, jabatan, organisasi), skala kecil-menengah (puluhan-ratusan record). Migrasi ke SQLite (via JDBC, `importClass("java.sql.DriverManager")`) kalau butuh query relasional (`JOIN`, `WHERE` kompleks) atau data besar dengan histori panjang (nilai/raport lintas semester, transaksi koperasi bervolume tinggi).

### 5.11 `Services.get(name)`
```js
var inventoryApi = Services.get("InventoryApi")
var dialogApi = Services.get("DialogApi")
var placeholderApi = Services.get("PlaceholderApi")
var protocolLib = Services.get("ProtocolLib")
var fileManager = Services.get("FileManager")
```
**[BELUM TERVERIFIKASI]** — detail method tiap service ini belum berhasil dikonfirmasi dari dokumentasi resmi di sesi ini. Untuk GUI inventory, pola **Bukkit native Inventory API** (lihat bagian 7.3) terbukti bekerja dan lebih dapat diandalkan sebagai pengganti sementara sampai `InventoryApi` terverifikasi.

---

## 6. Feature Flags

Ditulis di **baris paling atas file** (sebelum kode apapun):

| Flag | Fungsi |
|---|---|
| `//!loadmanually` | Script tidak auto-load saat startup — WAJIB untuk semua file modul/handler yang urutannya dikontrol manual lewat `main.js` |
| `//!waitForInit` | Yield sampai plugin selesai init penuh — dipakai bareng `LoadScript` saat startup, tapi **tidak selalu cukup sendirian** (lihat bagian 5.9 dan 8) |
| `//!PlaceholderAPI` | Aktifkan dukungan `PlaceholderAPI.registerPlaceholder()` dkk |
| `//!ProtocolLib` | Aktifkan dukungan `ProtocolLib.registerListener()` dkk |
| `//!import <class>` | Import class Java tanpa `importClass()` |

Bisa dimatikan global via `AllowFeatureFlags: false` di config.

---

## 7. Pola Desain yang Terbukti Bekerja

### 7.1 Struktur Project Multi-Modul dengan `main.js` Sentral

```
scripts/
├── main.js                    <- entry point, tidak //!loadmanually
├── libs/
│   ├── libluckperms.js         //!loadmanually
│   ├── libkelas.js              //!loadmanually
│   ├── liborganisasi.js         //!loadmanually
│   └── libdatabase.js           //!loadmanually
└── handler/
    ├── kelas_command.js         //!loadmanually
    ├── organisasi_command.js    //!loadmanually
    └── tugas_command.js         //!loadmanually
```

`main.js` (versi teruji, dengan try-catch + tanpa `waitForScript`):
```js
//!waitForInit

const Bukkit = importClass("org.bukkit.Bukkit");

log.info("Init Startup.....")
task.waitForPlugin("LuckPerms")
log.info("Dependency Loaded!")

task.thread(function() {
    task.wait(1)

    try {
        LoadScript("libs/libluckperms.js");
        log.info("[1/N] libluckperms.js dimuat.");
    } catch (e) {
        log.info("ERROR libluckperms.js: " + e);
    }

    // ulangi pola try-catch untuk tiap modul berikutnya, urutan sesuai dependency
    // (library dasar dulu, baru command handler yang requireScript ke library itu)

    log.info("System Success startup!!") // taruh di AKHIR rangkaian, bukan di luar task.thread
})

task.bindToUnload(function() {
    // UnloadScript semua modul, urutan kebalikan dari load
})
```

### 7.2 Wrapper Command Privileged via Console Dispatch

Untuk command yang butuh privilege operator (LuckPerms, whitelist, dll) tanpa memberi player/staff status OP penuh:

```js
function jalankanSebagaiConsole(commandString) {
    task.main(function() {
        var Bukkit = importClass("org.bukkit.Bukkit");
        var console = Bukkit.getConsoleSender();
        Bukkit.dispatchCommand(console, commandString);
    });
}
```
**PENTING:** `dispatchCommand(sender, commandString)` cuma terima **2 parameter**. Bug yang pernah terjadi: `dispatchCommand(console, console, cmd)` (argumen console dobel) — Java gagal resolve method signature, error runtime.

Validasi input **wajib** dilakukan manual di level script SEBELUM dispatch, karena eksekusi sebagai console **bypass semua permission check** normal — kontrol akses sepenuhnya jadi tanggung jawab logic script, bukan sistem permission Bukkit.

### 7.3 Virtual Chest Persisten via Inventory Bukkit Native + Serialisasi

```js
const ByteArrayOutputStream = importClass("java.io.ByteArrayOutputStream");
const BukkitObjectOutputStream = importClass("org.bukkit.util.io.BukkitObjectOutputStream");
const ByteArrayInputStream = importClass("java.io.ByteArrayInputStream");
const BukkitObjectInputStream = importClass("org.bukkit.util.io.BukkitObjectInputStream");
const Base64 = importClass("java.util.Base64");

function serializeItems(itemArray) {
    var outStream = new ByteArrayOutputStream();
    var dataOutput = new BukkitObjectOutputStream(outStream);
    dataOutput.writeInt(itemArray.length);
    for (var i = 0; i < itemArray.length; i++) dataOutput.writeObject(itemArray[i]);
    dataOutput.close();
    return Base64.getEncoder().encodeToString(outStream.toByteArray());
}

function deserializeItems(base64String) {
    if (!base64String) return [];
    var bytes = Base64.getDecoder().decode(base64String);
    var dataInput = new BukkitObjectInputStream(new ByteArrayInputStream(bytes));
    var size = dataInput.readInt();
    var items = [];
    for (var i = 0; i < size; i++) items.push(dataInput.readObject());
    dataInput.close();
    return items;
}
```
Inventory Bukkit native (`Bukkit.createInventory`) **tidak persisten** by default (cuma di memori) — kombinasikan dengan serialisasi di atas + `DiskApi` untuk simpan/load isi chest antar restart server.

**Cegah pengambilan item dari GUI read-only:**
```js
registerEvent("org.bukkit.event.inventory.InventoryClickEvent", function(event) {
    var title = event.getView().getTitle();
    if (title && title.indexOf("Judul GUI Khusus") === 0) {
        event.setCancelled(true);
    }
});
```

### 7.4 Validasi Whitelist + Bypass Staff/Dev

Pola untuk sistem yang perlu membatasi akses ke grup tertentu (misal hanya `kelasA`–`kelasD`), tapi tetap beri jalur staff/dev testing tanpa perlu OP penuh:

```js
function cekAksesValid(sender, daftarValid, permissionBypass) {
    if (sender.isOp() || sender.hasPermission(permissionBypass)) {
        return { valid: true, khusus: "STAFF" };
    }
    var grup = ambilGrupUtama(sender); // implementasi sesuai kebutuhan (LuckPerms API, dll)
    if (!grup || daftarValid.indexOf(grup) === -1) {
        return { valid: false, khusus: null };
    }
    return { valid: true, khusus: grup };
}
```
Gunakan **permission node spesifik** (`server.fitur.bypass`), bukan cuma `isOp()` — supaya staff dapat akses granular tanpa privilege server penuh.

### 7.5 Tabel Master untuk Data Referensial (Cegah Duplikat/Typo)

Untuk data yang dirujuk berulang (nama mapel, kategori, dll), simpan sebagai daftar master terpisah, jangan biarkan jadi teks bebas berulang di tiap record:
```js
function tambahKeMaster(fileName, namaItem) {
    DiskApi.loadFile(fileName, false, false);
    var daftar = DiskApi.getVar(fileName, "_daftar", [], false);
    var sudahAda = daftar.some(function(x) { return x.toLowerCase() === namaItem.toLowerCase(); });
    if (sudahAda) return false;
    daftar.push(namaItem);
    DiskApi.setVar(fileName, "_daftar", daftar, false);
    DiskApi.saveFile(fileName, false, false);
    return true;
}
```

---

## 8. Bug/Quirks Terkonfirmasi dari Debugging Nyata

Bagian ini **tidak** ada di dokumentasi resmi — murni temuan empiris dari trial-error di lingkungan Paper/Purpur berjalan di proot Termux (Android).

### 8.1 `task.waitForScript()` — Melempar ClassCastException

**Gejala:**
```
[WARN]: Cannot cast org.openjdk.nashorn.internal.scripts.JO16 to coolcostupit.openjs.modules.scriptTaskerApi
```
Terjadi konsisten di berbagai konteks pemanggilan (langsung di top-level, di dalam `task.delay`, di dalam `task.thread`). Efeknya: exception tidak tertangkap menghentikan seluruh sisa fungsi yang memanggilnya — kalau dipakai untuk urutan load modul, modul setelah titik gagal **tidak pernah ter-load**, tanpa pesan error yang jelas menunjuk ke situ (kelihatannya "macet begitu saja").

**Solusi terbukti bekerja:** ganti seluruhnya dengan `task.wait(n)` (delay tetap, bukan menunggu kondisi spesifik) + bungkus tiap `LoadScript` dengan `try-catch` untuk isolasi kegagalan per-modul.

### 8.2 `LoadScript()` Ditolak Saat Masih Fase Inisialisasi Plugin

**Gejala:**
```
[ERROR]: Do not manually load scripts while they are being initialized!
[ERROR]: Exception: ClassCastException ... JO16 to ... scriptTaskerApi
```
Terjadi meski sudah pakai `//!waitForInit`. Kemungkinan race condition antara proses auto-load internal OpenJS dengan pemanggilan manual `LoadScript` yang terlalu cepat setelah startup.

**Solusi terbukti bekerja:** tunda eksekusi dengan `task.thread(fn)` + `task.wait(1)` di awal sebelum baris `LoadScript` pertama, memberi jeda proses inisialisasi plugin benar-benar selesai.

### 8.2b `[object Object]` Merusak Seluruh File JSON Storage — WAJIB `JSON.stringify()` Sebelum Concat/Log Objek

**Gejala:** semua sistem yang pakai `DiskApi` tiba-tiba gagal baca data bersamaan (LuckPerms, Kelas, Tugas, Organisasi — semuanya down sekaligus, bukan cuma 1 fitur), dengan pesan error semacam:
```
Unexpected token o in JSON at position X
```
Huruf `o` di pesan error itu petunjuk kuncinya — muncul dari kata **"o**bject" pada teks `[object Object]` yang nyasar masuk ke file JSON.

**Penyebab akar:** JavaScript otomatis mengubah objek jadi string `"[object Object]"` (bukan isi datanya) kalau objek itu di-**concat langsung** pakai `+` atau ditaruh di template literal, TANPA `JSON.stringify()` dulu:

```js
var data = { nama: "Budi", status: "Hadir" };

// ❌ SALAH — hasil string-nya "Data: [object Object]", bukan isi data
log.info("Data: " + data);
sender.sendMessage("Struktur: " + strukturOrganisasi);

// ✅ BENAR — WAJIB JSON.stringify() dulu kalau mau tampilkan isi objek/array sebagai teks
log.info("Data: " + JSON.stringify(data));
sender.sendMessage("Struktur: " + JSON.stringify(strukturOrganisasi));
```

**Kenapa efeknya menyeret SEMUA sistem sekaligus:** kalau teks `[object Object]` (tanpa tanda kutip pembungkus JSON yang valid) sempat ke-tulis ke **body file storage** (bukan cuma ke log console — misal lewat `DiskApi.setVar` yang menerima value hasil concat salah, atau kalau seluruh sistem berbagi 1 file storage fisik), itu merusak struktur JSON di titik itu. Parser JSON gagal baca **dari titik kerusakan itu ke seterusnya**, sehingga seluruh isi file jadi tidak terbaca — bukan cuma bagian yang barusan ditulis.

**Aturan wajib untuk SEMUA kode yang menyentuh `DiskApi`, `log.info`, atau `sender.sendMessage`:**
- Sebelum menaruh variabel ke dalam string (concat `+` atau template literal), **selalu cek dulu apakah variabel itu objek/array**. Kalau ya, WAJIB `JSON.stringify(variabel)` dulu.
- String, number, boolean **aman** langsung di-concat — cuma object/array yang berbahaya.
- Cara cepat cek tipe sebelum concat:
```js
function amanUntukLog(value) {
    if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
    }
    return String(value);
}
```

**Cara cari file yang sudah terlanjur corrupt:**
```bash
grep -rn "\[object Object\]" plugins/OpenJS/
```
Baris yang ketemu itu titik kerusakannya — file storage tersebut kemungkinan perlu diperbaiki manual (hapus/perbaiki baris yang rusak) atau restore dari backup, karena bagian setelah titik itu sudah tidak terbaca parser JSON.

**Pencegahan ke depan:** selalu backup folder data OpenJS secara berkala (`cp -r plugins/OpenJS/data plugins/OpenJS/data.backup.$(date +%s)`), supaya kalau kejadian ini terulang, tidak perlu rekonstruksi manual dari nol.

### 8.3 Path Resolution Berbeda Antara `LoadScript` dan `requireScript`

Lihat bagian 4 — ini penyebab paling sering dari warning `"Did not return anything"` padahal file sudah benar isinya.

### 8.4 Leading Slash pada Path Menyebabkan Resolusi Salah

Path yang diawali `/` (misal `/libs/file.js`) terindikasi menyebabkan sistem gagal resolve ke lokasi yang benar. Selalu pakai path relatif tanpa leading slash, konsisten dengan semua contoh resmi dokumentasi.

### 8.5 File Watcher / Auto-Reload Bisa Trigger Ganda di Lingkungan Termux/proot

Editor yang menyimpan file dengan pola write-then-rename (umum di Vim/Neovim) bisa terdeteksi filesystem watcher sebagai 2 event terpisah, memicu reload 2x dari 1x save. Kalau curiga ini terjadi (log menunjukkan reload berulang tanpa aksi eksplisit), matikan `AutoReloadScriptsOnChange` sementara saat debugging, pakai `/oj reload` manual saja.

### 8.6 Warna/Format Code Tidak Berlaku di `log.info`

Kode warna (`&a`, `&l`, dll) hanya berfungsi di `sendMessage`/chat, **tidak** dirender di console log — akan muncul sebagai karakter literal. Jangan pakai kode warna di `log.info`.

### 8.7 Bug Sintaks JS yang Sering Lolos Mata

- Lupa `:` setelah `case "..."` di `switch` — pesan error menunjuk ke baris SETELAHNYA, bukan ke case yang salah.
- Lupa operator `+` antar concatenation string — error syntax langsung, biasanya jelas.
- String literal kosong (`""`) yang lupa disisipi variabel (`+ variabel +`) — TIDAK error, tapi hasilnya diam-diam salah (variabel diabaikan). Selalu cek ulang string yang dibangun dengan banyak concatenation.

---

## 9. Checklist Debugging Umum

Kalau modul tidak berfungsi seperti yang diharapkan setelah edit kode:

1. Cek isi file **di disk langsung** (`cat namafile.js`) — pastikan editor benar-benar menyimpan versi terbaru, terutama di lingkungan dengan filesystem tidak standar (SAF Android, proot).
2. Reload **semua file yang bergantung**, bukan cuma file yang diedit — `requireScript` hasil di-cache di variabel top-level pemanggil, tidak otomatis refresh.
3. Kalau reload manual tidak cukup, coba `/oj disable` + `/oj enable`.
4. Tambahkan `log.info("DEBUG ...")` di titik-titik kunci untuk memastikan asumsi tentang alur eksekusi benar, sebelum menyimpulkan letak bug.
5. Restart server penuh sebagai upaya terakhir, HANYA setelah instrumentasi debug sudah terpasang (supaya restart tidak sia-sia kalau bug masih muncul).

---

## 10. Ringkasan Referensi Cepat Semua Global

| Global | Fungsi |
|---|---|
| `script` | Info script aktif |
| `log` | Logging ke console (tanpa dukungan kode warna) |
| `task` | Scheduler, threading, `latch()` — lihat bagian 5.3 untuk aturan thread-safety |
| `importClass(name)` | Import class Java |
| `importLib(jarFile)` | Load JAR dari `plugins/OpenJS/Libs/` |
| `registerEvent` / `unregisterEvent` | Event listener Bukkit/custom |
| `addCommand` / `removeCommand` | Command custom, dengan `onTabComplete` |
| `requireScript(path)` | Modul, path relatif ke FILE PEMANGGIL, wajib `return {...}` top-level |
| `setShared` / `getShared` | Variabel global antar script, hilang saat restart |
| `LoadScript` / `UnloadScript` | Load/unload script lain, path relatif ke ROOT scripts/ |
| `DiskApi` | Storage persisten flat-file, wajib `loadFile` sebelum `getVar`/`setVar` |
| `Services.get(name)` | FileManager, DialogApi, InventoryApi, PlaceholderApi, ProtocolLib — detail belum terverifikasi |
| `toArray(javaArray)` | Convert Java array → array JS |
| `toJavaList(jsArray)` | Convert array JS → Java List (wajib untuk return `onTabComplete`) |
