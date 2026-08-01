# UnderCity-Core — Tutorial Pemasangan

## Persyaratan

| Komponen | Versi Minimum | Keterangan |
|---|---|---|
| Server Minecraft | Paper/Purpur 1.13 - 1.21.8 | Bukan Spigot vanilla, harus Paper/Folia |
| OpenJS Plugin | 1.2.0+ | Plugin scripting JavaScript |
| LuckPerms Plugin | 5.4+ | Manajemen permission & group |
| Java | 8+ | JVM yang menjalankan server |

---

## Langkah 1: Pasang OpenJS

1. Download JAR OpenJS dari https://openjs.wiki.gd/ atau sumber resmi lainnya
2. Copy file JAR ke folder `plugins/` server kamu
3. Restart server sekali untuk generate folder structure:
   ```
   plugins/OpenJS/
   ├── scripts/
   ├── Libs/
   └── config.yml
   ```

## Langkah 2: Copy UnderCity-Core

1. Copy seluruh isi folder `scripts/` dari project ini ke `plugins/OpenJS/scripts/`:

   Yang harusnya ada di `plugins/OpenJS/scripts/`:
   ```
   scripts/
   ├── main.js
   ├── libs/
   │   ├── libluckperms.js
   │   ├── libkelas.js
   │   ├── libtugas.js
   │   ├── libclass.js
   │   ├── libeventschool.js
   │   ├── libreportcard.js
   │   ├── liborganisasi.js
   │   ├── libextracurricular.js
   │   ├── libcooperative.js
   │   ├── libgroup.js
   │   └── config.js
   └── handler/
       └── command.js
   ```

2. Pastikan tidak ada file yang tertimpa tanpa sengaja. Kalau ada file lama yang namanya sama, backup dulu.

## Langkah 3: Install LuckPerms

1. Download LuckPerms dari https://luckperms.net/
2. Copy ke folder `plugins/`
3. Restart server
4. Tunggu LuckPerms selesai inisialisasi (cek console: `[LuckPerms] Finished enabling`)

## Langkah 4: Konfigurasi OpenJS

Edit `plugins/OpenJS/config.yml`:

```yaml
PrintScriptActivations: true
AutoReloadScriptsOnChange: false   # Matikan saat debugging
UseOldClassImporter: false
debugMode: false
AllowFeatureFlags: true
```

**PENTING:** `AutoReloadScriptsOnChange: false` sangat disarankan saat pertama kali setup supaya tidak ada reload ganda.

## Langkah 5: Restart Server

Restart server kamu. Di console harusnya muncul:
```
[OpenJS] [main.js] [System] Initializing startup sequence...
[OpenJS] [main.js] [System] Dependencies loaded.
[OpenJS] [main.js] [System] Successfully loaded: libs/libluckperms.js
[OpenJS] [main.js] [System] Successfully loaded: libs/libkelas.js
...
[OpenJS] [main.js] [System] All modules initialized successfully.
```

Kalau ada error `[System] Failed to load ...`, cek bagian Troubleshooting di bawah.

## Langkah 6: Setup Kelas Pertama

Masuk ke server, jalankan command:

```
/kelas tambah kelasa
/kelas tambah kelasb
/kelas tambah kelasc
/kelas tambah kelasd
```

Untuk set prefix tiap kelas:
```
/lpgroup setprefix kelasa &a[Kelas A]
/lpgroup setprefix kelasb &b[Kelas B]
/lpgroup setprefix kelasc &e[Kelas C]
/lpgroup setprefix kelasd &c[Kelas D]
```

## Langkah 7: Set Permission Guru/Staff

Di LuckPerms, set permission untuk akun guru:

```
/lp user <nama_player> permission set server.tugas.guru true
/lp user <nama_player> permission set server.attendance.guru true
/lp user <nama_player> permission set server.org.manage true
/lp user <nama_player> permission set server.ekskul.manage true
/lp user <nama_player> permission set server.koperasi.manage true
/lp user <nama_player> permission set server.event.manage true
/lp user <nama_player> permission set server.grade.manage true
/lp user <nama_player> permission set server.group.manage true
/lp user <nama_player> permission set server.npc.manage true
/lp user <nama_player> permission set server.writecode.manage true
```

---

## Daftar Command

### Siswa
| Command | Fungsi |
|---|---|
| `/kelas` | Lihat info kelas sendiri |
| `/tugas` | Submit tugas (pegang Written Book) |
| `/attendance mark` | Absen hadir hari ini |
| `/attendance cek <player>` | Cek absensi siswa lain |
| `/report view <player>` | Lihat rapor sendiri |
| `/event` | Lihat daftar event |
| `/organisasi saya` | Lihat organisasi yang diikuti |
| `/ekskul daftar <nama>` | Daftar ekskul |
| `/ekskul saya` | Lihat ekskul yang diikuti |
| `/koperasi saldo` | Cek saldo |
| `/koperasi beli <item>` | Beli item kantin |
| `/koperasi menu` | Lihat menu kantin |

### Guru/Staff (butuh permission)
| Command | Fungsi |
|---|---|
| `/kelas tambah\|hapus\|list\|info\|siswa` | Kelola kelas |
| `/tugas cek <kelas>` | Buka chest tugas kelas |
| `/attendance cek <player>` | Lihat rekap absensi |
| `/report set\|view` | Set/view nilai rapor |
| `/event create` | Buat event baru |
| `/organisasi buat\|tambah\|jabatan` | Kelola organisasi |
| `/ekskul buat\|hapus` | Kelola ekskul |
| `/koperasi deposit\|tarik\|tambahmenu\|riwayat` | Kelola koperasi |
| `/group create\|delete\|info\|listmembers` | Kelola group

---

## Struktur Data

Semua data disimpan di folder `plugins/OpenJS/data/` via DiskApi:

| File | Isi |
|---|---|
| `attendance_data` | Riwayat absensi per UUID |
| `grade_data` | Nilai rapor per UUID |
| `event_data` | Daftar event |
| `organisasi_data` | Data organisasi & anggota |
| `ekskul_data` | Data ekstrakurikuler & anggota |
| `koperasi_balance` | Saldo koperasi per UUID |
| `koperasi_menu` | Menu item kantin |
| `koperasi_log` | Riwayat transaksi |

---

## Troubleshooting

### Script gagal load
```
[ERROR] [System] Failed to load libs/libkelas.js: ...
```
**Solusi:** Cek apakah LuckPerms sudah terinstall. Cek juga syntax error di file yang gagal load.

### Error `getUniqueId is not a function`
**Solusi:** Command dijalankan dari console tapi butuh Player. Jalankan dari in-game.

### Error `padStart is not a function`
**Solusi:** Nashorn engine tidak support ES6 `padStart`. Pastikan pakai versi lib terbaru yang sudah pakai `padTwo()`.

### Data tidak tersimpan
**Solusi:** Cek apakah folder `plugins/OpenJS/data/` ada dan writable. Jangan edit file data langsung saat server jalan.

### Reload tidak berefek
**Solusi:** Pakai `/oj disable <script>` lalu `/oj enable <script>`. Atau restart server.

---

## Permissions Lengkap

| Permission | Fungsi |
|---|---|
| `under.manage` | Akses /kelas dan /lpgroup |
| `server.tugas.use` | Akses /tugas (siswa) |
| `server.tugas.guru` | Akses /tugas cek (guru) |
| `server.attendance.use` | Akses /attendance mark |
| `server.attendance.guru` | Akses /attendance cek |
| `server.grade.manage` | Akses /report set |
| `server.event.manage` | Akses /event create |
| `server.org.use` | Akses /organisasi |
| `server.org.manage` | Akses /organisasi buat/tambah/jabatan |
| `server.ekskul.use` | Akses /ekskul |
| `server.ekskul.manage` | Akses /ekskul buat/hapus |
| `server.koperasi.use` | Akses /koperasi saldo/beli/tarik |
| `server.koperasi.manage` | Akses /koperasi deposit/tambahmenu |
| `server.group.manage` | Akses /group ||
