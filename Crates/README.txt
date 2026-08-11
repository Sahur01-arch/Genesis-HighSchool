CrazyCrates Survival Economy pack (v4 - hologram fix + key usage)
====================================================================

Files: Basic.yml, Normal.yml, Epic.yml, Legend.yml, Mythic.yml, Immortal.yml
(Immortal = tier tertinggi, MythicPlus sudah dihapus)

Perbaikan v4 (dicek langsung ke docs.crazycrew.us & changelog resmi):

1. Tag <bold><light_purple>...</bold> di field Name/PhysicalKey/BroadCast/
   Preview TERNYATA BUKAN bug - itu persis pola di contoh resmi CrazyCrates
   sendiri (Advanced Crate docs). MiniMessage tidak wajib tutup tag terbalik
   di luar strict-mode. Field-field ini di-render langsung oleh CrazyCrates
   (Adventure/MiniMessage) jadi hex <color:#HEX> di situ sudah benar dan
   TIDAK diubah lagi.

2. Bug yang SEBENARNYA ada di "Hologram: Message:" - field ini tidak
   di-render oleh CrazyCrates, tapi dilempar mentah-mentah ke plugin
   hologram pihak ketiga (CMI/DecentHolograms/FancyHolograms dst).
   Changelog resmi CrazyCrates bilang: "CMI/DecentHolograms do not support
   MiniMessage so you still have to use legacy color codes for that."
   Makanya di layar muncul tulisan mentah <bold><color:>...</color></bold>
   tidak ke-parse. Sekarang khusus baris Hologram > Message diganti ke
   format legacy hex ("&" + "#RRGGBB", contoh: "&#FF4040&lImmortal Crate")
   yang didukung CMI/DecentHolograms tanpa perlu MiniMessage:
     Basic &#C0C0C0 | Normal &#55FF7F | Epic &#B266FF | Legend &#FFAA00
     Mythic &#FF66C4 | Immortal &#FF4040

3. RequiredKeys diturunkan dari 10 -> 1 di SEMUA crate (Basic s/d Immortal).
   Cocok untuk skema shop-only-key: 1 key beli di shop = 1x buka crate,
   StartingKeys tetap 0 (player tidak dapat key gratis).

Catatan:
- Kalau nanti key masih bisa didapat dari isi Prizes tier bawah (mis. Basic
  bisa drop "Normal Key"), itu TIDAK diubah/dihapus - tetap ada sebagai
  bonus dari crate, di luar shop. Kalau kamu mau full shop-only (key sama
  sekali tidak bisa didapat dari drop), tinggal bilang, nanti item "Key"
  di dalam Prizes tiap crate saya hapus/ganti.
- Money rewards: eco give %player% AMOUNT
- Key rewards: cc give physical %player% CRATE 1
