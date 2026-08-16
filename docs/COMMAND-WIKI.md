# 📖 Genesis-HighSchool — Wiki Command Server

> Server: **Genesis** (Purpur 26.2)
> Repo custom feature: https://github.com/Sahur01-arch/Genesis-HighSchool
> Dokumen ini merangkum **seluruh command** yang tersedia di server: baik command **custom buatan sendiri** (folder `OpenJS/` di repo) maupun command bawaan **46 plugin** yang terpasang (5 Paper Plugins + 41 Bukkit Plugins, sesuai log panel server).

---

## 🏫 BAGIAN 1 — Sistem Sekolah (Custom, OpenJS + MySQL)

Semua command di bagian ini dibuat sendiri lewat script OpenJS (`main.js` → load `libs/` → load `handler/`), datanya tersimpan di MySQL.

### `/kelas` — Manajemen Kelas
| Sub-command | Kegunaan |
|---|---|
| `/kelas tambah <nama_kelas> [weight]` | Membuat kelas baru, opsional atur `weight` (prioritas urutan) |
| `/kelas hapus <nama_kelas>` | Menghapus kelas |
| `/kelas list` | Menampilkan daftar semua kelas |
| `/kelas info <nama_kelas>` | Info detail satu kelas |
| `/kelas siswa <nama_kelas>` | Menampilkan daftar siswa dalam kelas tsb |
| `/kelas masukkan <player> <nama_kelas>` | Memasukkan siswa ke kelas |
| `/kelas keluarkan <player> <nama_kelas>` | Mengeluarkan siswa dari kelas |
| `/kelas setweight <nama_kelas> <weight>` | Mengubah prioritas urutan kelas |

- `/kelasgui` — versi GUI (klik-klik) dari sistem kelas, alias dari `/kelas` (bisa dibuka lewat command yang sama juga)

### `/tugas` — Sistem Tugas (Virtual Chest)
| Command | Kegunaan |
|---|---|
| `/tugas` | Siswa membuka & submit tugas lewat GUI/chest virtual |
| `/tugas cek <kelas>` | Guru/staff memeriksa tugas yang sudah dikumpulkan sekelas |

> Chest tugas dikunci otomatis: hanya pemilik permission `server.tugas.guru` atau OP yang bisa mengubah isinya, player biasa hanya bisa lihat (read-only).

### `/absen` / `/attendance` & `/eks`
| Command | Kegunaan |
|---|---|
| `/absen` atau `/attendance` | Presensi harian siswa |
| `/eks` atau `/ekstrakurikuler` | Menu ekskul (lihat daftar ekskul yang diikuti) |
| `/absen ekskul <nama_ekskul> <hadir\|izin\|sakit\|alpha>` | Absen kehadiran ekskul |
| `/absen cek <nama_player>` | Cek riwayat absensi seorang player |
| `/eks admin approve\|remove\|deny <nama_ekskul>` | Staff menyetujui/menghapus/menolak pendaftaran ekskul |

### `/report` — Rapor Nilai
| Command | Kegunaan |
|---|---|
| `/report set <nama_player> <mapel> <nilai> [nama_kelas]` | Guru input nilai mapel siswa |
| `/report view <nama_player>` | Melihat rapor nilai siswa |

### `/organisasi` — OSIS / Organisasi Sekolah
| Sub-command | Kegunaan |
|---|---|
| `/organisasi buat <nama> [deskripsi]` | Membuat organisasi baru |
| `/organisasi hapus <nama>` | Menghapus organisasi |
| `/organisasi tambah <organisasi> <player> [jabatan]` | Menambah anggota + jabatan |
| `/organisasi keluar <organisasi>` | Keluar dari organisasi |
| `/organisasi jabatan <organisasi> <player> <jabatan>` | Mengubah jabatan anggota |
| `/organisasi lihat <organisasi>` | Melihat detail organisasi |
| `/organisasi daftar` | Daftar semua organisasi |
| `/organisasi saya` | Organisasi milik sendiri |

### `/event` — Event Sekolah
| Command | Kegunaan |
|---|---|
| `/event create <nama> <tanggal>` | Membuat event baru dengan nama & tanggal |

### `/koperasi` — Koperasi Sekolah (mini-ekonomi)
| Sub-command | Kegunaan |
|---|---|
| `/koperasi saldo` | Cek saldo koperasi |
| `/koperasi deposit <player> <jumlah>` | Setor saldo |
| `/koperasi tarik <jumlah>` | Tarik saldo |
| `/koperasi beli <nama_item>` | Beli item dari koperasi |
| `/koperasi menu` | Lihat menu/daftar item jual |
| `/koperasi tambahmenu <nama> <harga> [deskripsi]` | Tambah item ke menu (admin) |
| `/koperasi hapusmenu <nama_item>` | Hapus item dari menu (admin) |
| `/koperasi riwayat` | Riwayat transaksi |

### `/group` — Grup Custom (terpisah dari LuckPerms)
| Sub-command | Kegunaan |
|---|---|
| `/group create <nama_group> [weight]` | Buat grup baru |
| `/group delete <nama_group>` | Hapus grup |
| `/group info <nama_group>` | Info grup |
| `/group list` | Daftar grup |
| `/group setweight <nama_group> <weight>` | Atur prioritas grup |
| `/group assign <player> <nama_group>` | Masukkan player ke grup |
| `/group remove <player> <nama_group>` | Keluarkan player dari grup |
| `/group members <nama_group>` | Daftar anggota grup |
| `/group player <nama_player>` | Cek grup milik player tertentu |

### `/lpgroup` — Integrasi LuckPerms
| Command | Kegunaan |
|---|---|
| `/lpgroup setprefix <grup> <text>` | Set prefix grup LuckPerms |
| `/lpgroup removeprefix <grup>` | Hapus prefix grup LuckPerms |

### Hadiah & Toko
| Command | Kegunaan |
|---|---|
| `/setgift <nama_player> <dd/mm>` | Staff set tanggal ulang tahun player untuk sistem hadiah |
| `/ambilhadiah` | Player klaim hadiah ulang tahun |
| `/storeadmin` | Panel admin toko rank/gamepass |
| `/gamepass` | Membeli/melihat gamepass |
| `/rankbuy` | Membeli rank in-game |

---

## 🔌 BAGIAN 2 — Command Plugin (46 Plugin Terpasang)

### 💰 Ekonomi & Shop

**EconomyShopGUI**
| Command | Kegunaan |
|---|---|
| `/shop [section]` | Membuka menu toko (opsional langsung ke section tertentu) |
| `/sellall` | Jual semua item di inventory yang terdaftar di shop |
| `/sellall <material>` | Jual semua item dengan material tertentu |
| `/sellall hand` | Jual item yang sedang dipegang di tangan (dipakai di log: `_BHIMA_1871 issued /sellall hand`) |
| `/sellgui` | GUI drop item untuk dijual |
| `/sreload` | Reload plugin & data shop (admin) |
| `/editshop additem\|edititem\|deleteitem\|addhanditem\|addsection\|editsection\|deletesection` | Kelola isi & section toko (admin) |

**AuctionHouse**
| Command | Kegunaan |
|---|---|
| `/ah` | Membuka lelang, lihat listing item yang dijual player lain |
| `/ah sell <harga>` | Menjual item yang dipegang ke lelang |

**CrazyCrates**
| Command | Kegunaan |
|---|---|
| `/crates` atau `/cc` | Membuka menu crate |
| `/crazycrates give <player> <crate> <jumlah>` | Memberi key crate ke player (admin) |
| `/crazycrates debug <crate>` | Test isi hadiah crate (admin) |
| `/crazycrates reload` | Reload konfigurasi crate |
| `/crates mass-open` | Membuka banyak crate sekaligus (jika key mencukupi) |

**Vault** — plugin ekonomi backend, menjembatani semua plugin economy di atas dengan LuckPerms & saldo player; tidak punya command untuk player biasa.

### ⚔️ RPG & Skill

**AuraSkills**
| Command | Kegunaan |
|---|---|
| `/skills` (alias `/aura`) | Membuka menu skill & stats |
| `/<nama_skill>` (mis. `/farming`, `/mining`) | Melihat progres skill spesifik |
| `/skills lang [language]` | Mengganti bahasa personal |
| `/skills item ignore add\|remove` | Kelola item yang dikecualikan dari ability mana |

**LuckPerms**
| Command | Kegunaan |
|---|---|
| `/lp user <player> ...` | Kelola permission & grup per-player |
| `/lp group <grup> ...` | Kelola permission per-grup |
| `/lp editor` | Membuka editor permission via web |

**Skript & SkBee** — engine scripting; tidak ada command langsung untuk player, dipakai developer untuk membangun fitur tambahan lewat file `.sk`.

### 🗣️ Sosial & Komunikasi

**DiscordSRV**
| Command | Kegunaan |
|---|---|
| `/discord link` | Menghubungkan akun Discord ↔ Minecraft |
| `/discord unlink` | Memutus koneksi akun |

**DiSky** — library scripting untuk bot Discord, dipakai bareng DiscordSRV; tidak ada command in-game langsung.

**SimpleVoiceChat / SimpleVoice-Geyser**
| Command | Kegunaan |
|---|---|
| `/voicechat` | Membuka pengaturan voice chat |
| `/svc` | Alias command singkat voicechat |

**TAB** — plugin tampilan tab-list, scoreboard, dan chat format; dikonfigurasi via config, tidak banyak command player-facing selain `/tab reload` (admin).

**TpaGui**
| Command | Kegunaan |
|---|---|
| `/tpa <player>` | Meminta teleport ke player lain |
| `/tpahere <player>` | Meminta player lain teleport ke kita |
| `/tpaccept` | Menerima permintaan teleport |
| `/tpadeny` | Menolak permintaan teleport |

**UltimateTeams**
| Command | Kegunaan |
|---|---|
| `/team create <nama>` | Membuat tim/guild |
| `/team invite <player>` | Mengundang anggota |
| `/team chat` | Chat khusus sesama anggota tim |

### 🧱 Build & Manajemen Dunia

**Multiverse-Core**
| Command | Kegunaan |
|---|---|
| `/mv create <nama> <environment>` | Membuat dunia baru |
| `/mvtp <dunia>` | Teleport ke dunia lain |
| `/mv list` | Daftar semua dunia |

**Chunky**
| Command | Kegunaan |
|---|---|
| `/chunky radius <angka>` | Atur radius pre-generate |
| `/chunky start` | Mulai pre-generate chunk |
| `/chunky pause` / `/chunky cancel` | Jeda / batalkan proses |

**FastAsyncWorldEdit (FAWE)**
| Command | Kegunaan |
|---|---|
| `//wand` | Ambil tool seleksi area |
| `//set <block>` | Isi area terpilih dengan block tertentu |
| `//copy` / `//paste` | Salin & tempel struktur |
| `//undo` / `//redo` | Batalkan/ulangi perubahan |

**WorldGuard**
| Command | Kegunaan |
|---|---|
| `/rg define <nama>` | Membuat region baru dari area terpilih |
| `/rg flag <nama> <flag> <value>` | Atur aturan (flag) region, mis. PvP, mob-spawning |
| `/rg info <nama>` | Info sebuah region |

**GriefPrevention**
| Command | Kegunaan |
|---|---|
| `/claim` | Klaim lahan (setelah shovel emas ditancapkan di 2 sudut) |
| `/trust <player>` | Beri izin akses ke lahan yang diklaim |
| `/untrust <player>` | Cabut izin akses |
| `/abandonclaim` | Melepas klaim lahan |

**Terraform Generator** — plugin world-generator custom (dipakai saat `/mv create` dengan generator ini), tidak ada command player-facing.

### 🌐 Cross-Platform (Bedrock & Versi Client)

**Geyser-Spigot** (+ **Floodgate**) — memungkinkan player Bedrock (HP/konsol) bergabung ke server Java; command utamanya untuk admin: `/geyser reload`, `/geyser dump`.

**ViaVersion / ViaBackwards**
| Command | Kegunaan |
|---|---|
| `/viaversion` | Info versi & status kompatibilitas client (admin) |

**SkinsRestorer**
| Command | Kegunaan |
|---|---|
| `/skin <nama_skin>` | Mengganti skin sendiri |
| `/skin clear` | Reset ke skin default |

### 🛠️ Admin, Anti-Cheat & Utilitas

**Essentials**
| Command | Kegunaan |
|---|---|
| `/tp <player>` | Teleport langsung ke player |
| `/gamemode <mode>` | Ganti gamemode |
| `/heal` / `/feed` | Pulihkan HP/lapar |
| `/fly` | Toggle mode terbang |
| `/warp <nama>` | Teleport ke warp point |

**ExploitShield, packetevents, ProtocolLib** — lapisan anti-exploit & jembatan packet-level yang dipakai plugin lain (TAB, voicechat, dll); tidak ada command untuk player, hanya `reload`/`version` untuk admin.

**MinerTrack** (Anti X-Ray)
| Command | Kegunaan |
|---|---|
| `/mtrack verbose` | Toggle mode detail notifikasi untuk staff |
| `/mtrack check <player>` | Cek riwayat pelanggaran player |
| `/mtrack reset <player>` | Reset catatan pelanggaran |
| `/mtrack logs <file>` | Lihat file log deteksi |

**LagFixer** — plugin optimasi performa server berjalan otomatis di background; command umumnya hanya `/lagfixer reload` (admin).

**Maintenance**
| Command | Kegunaan |
|---|---|
| `/maintenance on\|off` | Menyalakan/mematikan mode maintenance |
| `/maintenance status` | Cek status maintenance |

**AntiRedstoneClock-Remastered** — mendeteksi & memblokir redstone clock spam otomatis (terlihat aktif di log server dengan tag `[REDSTONE]`); umumnya tanpa command player, hanya config threshold.

**GSit**
| Command | Kegunaan |
|---|---|
| `/sit` | Duduk di tempat |
| `/lay` | Berbaring |
| `/crawl` | Merangkak |

**ImageFrame**
| Command | Kegunaan |
|---|---|
| `/imageframe create <url> <nama>` | Memasang gambar custom ke item frame |
| `/imageframe remove <nama>` | Menghapus gambar |

**DecentHolograms**
| Command | Kegunaan |
|---|---|
| `/dh create <nama>` | Membuat hologram teks di lokasi player |
| `/dh addline <nama> <text>` | Menambah baris teks ke hologram |
| `/dh delete <nama>` | Menghapus hologram |

**BetterMOTD** — mengatur tampilan MOTD (pesan & ikon) server list; dikonfigurasi lewat file config, tidak ada command player.

**BetterRTP**
| Command | Kegunaan |
|---|---|
| `/rtp` | Random teleport ke lokasi aman |
| `/wild` | Alias umum untuk RTP di beberapa konfigurasi |

**RedeemCodes**
| Command | Kegunaan |
|---|---|
| `/redeem <code>` | Klaim reward dari kode voucher |
| `/redeemcodes create <code>` | Membuat kode voucher baru (admin) |

**PlaceholderAPI**
| Command | Kegunaan |
|---|---|
| `/papi ecloud download <expansion>` | Mengunduh expansion placeholder tambahan (admin) |
| `/papi reload` | Reload semua expansion |

> PlaceholderAPI sendiri tidak dipakai langsung oleh player — ia menyuplai data dinamis (nilai, saldo, kelas, dll dari sistem custom di atas) ke plugin lain seperti TAB & DiscordSRV.

**LPC** — kemungkinan besar add-on chat/format terkait LuckPerms (belum terverifikasi 100% fungsinya dari nama plugin saja; disarankan cek langsung `plugin.yml` di folder `plugins/LPC/` di server untuk memastikan command aslinya).

---

## 🗂️ Alur Teknis Singkat (untuk referensi developer)

1. `main.js` menunggu **LuckPerms** siap dulu (`task.waitForPlugin`)
2. Koneksi & init tabel **MySQL** dijalankan lebih dulu sebelum modul lain
3. Baru semua `libs/*.js` (logic/data layer) dan `handler/*.js` (command layer) dimuat berurutan dengan retry otomatis (maks 3x percobaan)
4. Setiap command custom di Bagian 1 sebenarnya modul terpisah yang saling terhubung lewat `requireScript(...)`, bukan satu file besar

---

*Dokumen ini digenerate berdasarkan isi repo [Genesis-HighSchool](https://github.com/Sahur01-arch/Genesis-HighSchool) (folder `OpenJS/`) dan daftar 46 plugin dari log panel server. Beberapa command plugin pihak ketiga bisa berbeda tergantung versi/config — cross-check ke `/plugins/<NamaPlugin>/config.yml` atau `/help <plugin>` in-game kalau ada yang tidak sesuai.*
