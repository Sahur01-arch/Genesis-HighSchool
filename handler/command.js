//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit");
const kelasManager = requireScript("../libs/libkelas.js");
const luck = requireScript("../libs/libluckperms.js");
const Tugas = requireScript("../libs/libtugas.js");
const config = requireScript("../libs/config.js");
const ClassSys = requireScript("../libs/libclass.js");
const EventSys = requireScript("../libs/libeventschool.js");
const ReportSys = requireScript("../libs/libreportcard.js");
const OrgSys = requireScript("../libs/liborganisasi.js");
const ExskulSys = requireScript("../libs/libextracurricular.js");
const KoperasiSys = requireScript("../libs/libcooperative.js");

// --- EVENT LISTENER (Cegah Siswa/Guru Mengambil Item dari Virtual Chest) ---
registerEvent("org.bukkit.event.inventory.InventoryClickEvent", function(event) {
    const title = event.getView().getTitle();
    if (title && title.indexOf(config.inventory.tugasTitlePrefix) === 0) {
        const player = event.getWhoClicked();
        // Allow teachers/staff with permission OR operators to interact
        if (player.hasPermission("server.tugas.guru") || player.isOp()) {
            return;
        }
        event.setCancelled(true); // Membatalkan aksi klik (read-only) untuk orang lain
    }
});

// --- COMMAND: /kelas ---
addCommand("kelas", {
  onCommand: function(sender, args) {
    try {
        const jsArgs = toArray(args);
        const aksi = jsArgs[0];
        const restArgs = jsArgs.slice(1);

        switch (aksi) {
        case "tambah":
            if (!restArgs[0]) {
                sender.sendMessage("§cGunakan: /kelas tambah <nama_kelas> [weight]");
                return;
            }
            kelasManager.addGroup(restArgs[0], restArgs[1] ? parseInt(restArgs[1]) : 0);
            sender.sendMessage("§aKelas " + restArgs[0] + " berhasil dibuat di LuckPerms.");
            break;
        case "hapus":
            if (!restArgs[0]) {
                sender.sendMessage("§cGunakan: /kelas hapus <nama_kelas>");
                return;
            }
            kelasManager.removeGroup(restArgs[0], sender);
            break;
        default:
            sender.sendMessage("§cGunakan: /kelas tambah|hapus");
        }
    } catch (e) {
        sender.sendMessage("§cTerjadi kesalahan saat memproses command kelas.");
        log.error("Command /kelas error: " + e);
    }
  }
}, "under.manage");

// --- COMMAND: /lpgroup ---
addCommand("lpgroup", {
  onCommand: function(sender, args) {
    if (args.length < 2) {
      sender.sendMessage("§cGunakan: /lpgroup setprefix|removeprefix <grup> [text]");
      return;
    }

    const jsArgs = toArray(args);
    const aksi = jsArgs[0];
    const groupName = jsArgs[1];
    const textPrefix = jsArgs.slice(2).join(" ");

    switch (aksi) {
      case "setprefix":
        if (!textPrefix) {
          sender.sendMessage("§cGunakan: /lpgroup setprefix <grup> <text>");
          return;
        }
        luck.setPrefix(groupName, textPrefix);
        sender.sendMessage("§aPrefix berhasil diterapkan.");
        break;

      case "removeprefix":
        luck.removePrefix(groupName);
        sender.sendMessage("§aPrefix berhasil dihapus.");
        break;

      default:
        sender.sendMessage("§cAksi tidak dikenali.");
    } 
  },

  onTabComplete: function(sender, args) {
    const jsArgs = toArray(args);
    if (jsArgs.length === 1) {
      return toJavaList(["setprefix", "removeprefix"]);
    }
    return toJavaList([]);
  }
}, "under.manage");

// --- COMMAND: /tugas ---
addCommand("tugas", {
  onCommand: function(sender, args) {
    if (!(sender instanceof org.bukkit.entity.Player)) { 
      sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
      return;
    }

    const jsArgs = toArray(args);
    const aksi = jsArgs[0];

    // Subcommand: /tugas cek <kelas> (Guru/Staff saja)
    if (aksi === "cek") {
      if (!sender.hasPermission("server.tugas.guru")) {
        sender.sendMessage("§cKamu tidak memiliki izin untuk memeriksa tugas kelas.");
        return;
      }
      if (jsArgs.length < 2) {
        sender.sendMessage("§cGunakan: /tugas cek <kelas>");
        return;
      }
      task.main(function() {
        Tugas.bukaChestUntukGuru(sender, jsArgs[1]);
      });
      return;
    }

    // Default Command: /tugas (Pengumpulan mandiri siswa)
    if (!aksi) {
      // Fix: Prioritize teacher role, but allow OPs to bypass
      if (sender.hasPermission("server.tugas.guru") && !sender.isOp()) {
          sender.sendMessage("§cSebagai Guru/Staff, gunakan '/tugas cek <kelas>' untuk memeriksa tugas.");
          return;
      }

      const namaKelas = kelasManager.ambilKelasSiswa(sender.getUniqueId().toString());
      if (!namaKelas) {
        sender.sendMessage("§cKamu belum terdaftar di kelas manapun (Grup LuckPerms kosong).");
        return;
      }

      task.main(function() {
        const hasil = Tugas.submitTugas(sender, namaKelas);
        sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
      });
      return;
    }

    sender.sendMessage("§cGunakan: /tugas (untuk submit) atau /tugas cek <kelas> (khusus guru)");
  },
  onTabComplete: function(sender, args) {
    const jsArgs = toArray(args);
    if (jsArgs.length === 1 && sender.hasPermission("server.tugas.guru")) {
      return toJavaList(["cek"]);
    }
    return toJavaList([]);
  }
}, "server.tugas.use");

// --- COMMAND: /attendance ---
addCommand("attendance", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];

        if (aksi === "mark") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            var hasil = ClassSys.recordAttendance(sender.getUniqueId().toString(), "Hadir");
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "cek") {
            if (!sender.hasPermission("server.attendance.guru")) {
                sender.sendMessage("§cKamu tidak punya izin untuk melihat data absensi orang lain.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /attendance cek <nama_player>");
                return;
            }

            var targetName = jsArgs[1];
            var targetPlayer = Bukkit.getPlayer(targetName);

            if (!targetPlayer) {
                var offlinePlayers = Bukkit.getOfflinePlayers();
                for (var i = 0; i < offlinePlayers.length; i++) {
                    if (offlinePlayers[i].getName() != null && offlinePlayers[i].getName().equalsIgnoreCase(targetName)) {
                        targetPlayer = offlinePlayers[i];
                        break;
                    }
                }
            }

            if (!targetPlayer || !targetPlayer.hasPlayedBefore()) {
                sender.sendMessage("§cPlayer '" + targetName + "' tidak ditemukan.");
                return;
            }

            ClassSys.tampilkanAbsensi(sender, targetName, targetPlayer.getUniqueId().toString());
            return;
        }

        sender.sendMessage("§cGunakan: /attendance mark (siswa) atau /attendance cek <player> (guru)");
    },

    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            var opsi = ["mark"];
            if (sender.hasPermission("server.attendance.guru")) opsi.push("cek");
            return toJavaList(opsi);
        }
        if (jsArgs.length === 2 && jsArgs[0] === "cek") {
            var names = [];
            var players = Bukkit.getOnlinePlayers().toArray();
            for (var i = 0; i < players.length; i++) names.push(players[i].getName());
            return toJavaList(names);
        }
        return toJavaList([]);
    }
}, "server.attendance.use");

// --- COMMAND: /event ---
addCommand("event", {
    onCommand: function(sender, args) {
        const jsArgs = toArray(args);
        if (jsArgs[0] === "create") {
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /event create <nama> <tanggal>");
                return;
            }
            const hasil = EventSys.createEvent(jsArgs[1], jsArgs[2]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
        } else {
            sender.sendMessage("§cGunakan: /event create <nama> <tanggal>");
        }
    }
}, "server.event.manage");

// --- COMMAND: /report ---
addCommand("report", {
    onCommand: function(sender, args) {
        const jsArgs = toArray(args);
        const aksi = jsArgs[0];

        if (aksi === "set") {
            if (jsArgs.length < 4) {
                sender.sendMessage("§cGunakan: /report set <nama_player> <mapel> <nilai> [nama_kelas]");
                return;
            }
            
            const playerName = jsArgs[1];
            const subject = jsArgs[2];
            const grade = jsArgs[3];
            const groupName = jsArgs[4];
            
            var player = Bukkit.getPlayer(playerName);
            var uuid;
            if (player) {
                uuid = player.getUniqueId().toString();
            } else {
                var offlinePlayer = Bukkit.getOfflinePlayer(playerName);
                uuid = offlinePlayer.getUniqueId().toString();
            }
            
            const hasil = ReportSys.setGrade(uuid, playerName, subject, grade);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            
            const validGroups = ["kelasa", "kelasb", "kelasc", "kelasd"];
            if (groupName && validGroups.indexOf(groupName.toLowerCase()) !== -1) {
                luck.assignGroup(playerName, groupName.toLowerCase());
                sender.sendMessage("§aPemain " + playerName + " telah ditambahkan ke grup " + groupName);
            }
            
        } else if (aksi === "view") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /report view <nama_player>");
                return;
            }

            const playerName = jsArgs[1];
            var player = Bukkit.getPlayer(playerName);
            var uuid;
            if (player) {
                uuid = player.getUniqueId().toString();
            } else {
                var offlinePlayer = Bukkit.getOfflinePlayer(playerName);
                uuid = offlinePlayer.getUniqueId().toString();
            }

            // Memanggil fungsi getReport dari libreportcard.js
            const rapor = ReportSys.getReport(uuid);

            if (!rapor) {
                sender.sendMessage("§cData rapor untuk " + playerName + " tidak ditemukan.");
                return;
            }

            sender.sendMessage("§e=== RAPOR " + rapor.name.toUpperCase() + " ===");
            sender.sendMessage("§7UUID: " + rapor.uuid);
            sender.sendMessage("§6Daftar Nilai:");
            
            for (var mapel in rapor.grades) {
                sender.sendMessage(" §7- " + mapel + ": §f" + rapor.grades[mapel]);
            }
            sender.sendMessage("§bNilai Rata-rata: §e" + rapor.average);
            sender.sendMessage("§e========================");

        } else {
            sender.sendMessage("§cGunakan: /report set atau /report view");
        }
    },
    onTabComplete: function(sender, args) {
        const jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            return toJavaList(["set", "view"]); // Menambahkan 'view' di tab complete
        }
        if (jsArgs.length === 5 && jsArgs[0] === "set") {
            return toJavaList(["kelasa", "kelasb", "kelasc", "kelasd"]);
        }
        return toJavaList([]);
    }
}, "server.grade.manage");

// --- COMMAND: /organisasi ---
addCommand("organisasi", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];

        if (aksi === "buat") {
            if (!sender.hasPermission("server.org.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola organisasi.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /organisasi buat <nama> [deskripsi]");
                return;
            }
            var desc = jsArgs.slice(2).join(" ");
            var hasil = OrgSys.createOrganisation(jsArgs[1], desc);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "hapus") {
            if (!sender.hasPermission("server.org.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola organisasi.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /organisasi hapus <nama>");
                return;
            }
            var hasil = OrgSys.deleteOrganisation(jsArgs[1]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "tambah") {
            if (!sender.hasPermission("server.org.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola organisasi.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /organisasi tambah <organisasi> <player> [jabatan]");
                return;
            }
            var orgName = jsArgs[1];
            var playerName = jsArgs[2];
            var role = jsArgs[3] || "Anggota";

            var target = Bukkit.getPlayer(playerName);
            var uuid;
            if (target) {
                uuid = target.getUniqueId().toString();
            } else {
                var offline = Bukkit.getOfflinePlayer(playerName);
                if (!offline.hasPlayedBefore()) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
                uuid = offline.getUniqueId().toString();
            }
            var hasil = OrgSys.addMember(orgName, playerName, uuid, role);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "keluar") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /organisasi keluar <organisasi>");
                return;
            }
            var hasil = OrgSys.removeMember(jsArgs[1], sender.getName(), sender.getUniqueId().toString());
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "jabatan") {
            if (!sender.hasPermission("server.org.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengubah jabatan.");
                return;
            }
            if (jsArgs.length < 4) {
                sender.sendMessage("§cGunakan: /organisasi jabatan <organisasi> <player> <jabatan>");
                return;
            }
            var playerName = jsArgs[3];
            var target = Bukkit.getPlayer(playerName);
            var uuid;
            if (target) {
                uuid = target.getUniqueId().toString();
            } else {
                var offline = Bukkit.getOfflinePlayer(playerName);
                uuid = offline.getUniqueId().toString();
            }
            var hasil = OrgSys.setRole(jsArgs[1], playerName, uuid, jsArgs[4] || "Anggota");
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "lihat") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /organisasi lihat <organisasi>");
                return;
            }
            var org = OrgSys.getOrganisation(jsArgs[1]);
            if (!org) {
                sender.sendMessage("§cOrganisasi '" + jsArgs[1] + "' tidak ditemukan.");
                return;
            }
            sender.sendMessage("§6=== " + org.name.toUpperCase() + " ===");
            if (org.description) sender.sendMessage("§7" + org.description);
            sender.sendMessage("§fAnggota:");
            for (var uuid in org.members) {
                var m = org.members[uuid];
                sender.sendMessage(" §7- §f" + m.name + " §e(" + m.role + ")");
            }
            return;
        }

        if (aksi === "daftar") {
            var list = OrgSys.listOrganisations();
            if (list.length === 0) {
                sender.sendMessage("§eBelum ada organisasi yang terdaftar.");
                return;
            }
            sender.sendMessage("§6=== Daftar Organisasi ===");
            for (var i = 0; i < list.length; i++) {
                sender.sendMessage(" §7- §f" + list[i].name + " §7(" + list[i].members + " anggota)");
            }
            return;
        }

        if (aksi === "saya") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            var myOrgs = OrgSys.getOrganisationsForMember(sender.getUniqueId().toString());
            if (myOrgs.length === 0) {
                sender.sendMessage("§eKamu belum terdaftar di organisasi manapun.");
                return;
            }
            sender.sendMessage("§6=== Organisasiku ===");
            for (var i = 0; i < myOrgs.length; i++) {
                sender.sendMessage(" §7- §f" + myOrgs[i].name + " §e(" + myOrgs[i].role + ")");
            }
            return;
        }

        sender.sendMessage("§cGunakan: /organisasi buat|hapus|tambah|keluar|jabatan|lihat|daftar|saya");
    },
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            return toJavaList(["buat", "hapus", "tambah", "keluar", "jabatan", "lihat", "daftar", "saya"]);
        }
        if (jsArgs.length === 2 && (jsArgs[0] === "tambah" || jsArgs[0] === "jabatan")) {
            var names = [];
            var players = Bukkit.getOnlinePlayers().toArray();
            for (var i = 0; i < players.length; i++) names.push(players[i].getName());
            return toJavaList(names);
        }
        if (jsArgs.length === 5 && jsArgs[0] === "jabatan") {
            return toJavaList(["Ketua", "Wakil", "Sekretaris", "Bendahara", "Anggota"]);
        }
        return toJavaList([]);
    }
}, "server.org.use");

// --- COMMAND: /ekskul ---
addCommand("ekskul", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];

        if (aksi === "buat") {
            if (!sender.hasPermission("server.ekskul.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola ekstrakurikuler.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /ekskul buat <nama> [deskripsi] [jadwal]");
                return;
            }
            var desc = jsArgs[2] || "";
            var schedule = jsArgs[3] || "-";
            var hasil = ExskulSys.createExtracurricular(jsArgs[1], desc, schedule);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "hapus") {
            if (!sender.hasPermission("server.ekskul.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola ekstrakurikuler.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /ekskul hapus <nama>");
                return;
            }
            var hasil = ExskulSys.deleteExtracurricular(jsArgs[1]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "daftar") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /ekskul daftar <nama_ekskul>");
                return;
            }
            var hasil = ExskulSys.registerStudent(jsArgs[1], sender.getName(), sender.getUniqueId().toString());
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "keluar") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /ekskul keluar <nama_ekskul>");
                return;
            }
            var hasil = ExskulSys.unregisterStudent(jsArgs[1], sender.getName(), sender.getUniqueId().toString());
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "lihat") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /ekskul lihat <nama_ekskul>");
                return;
            }
            var ekskul = ExskulSys.getExtracurricular(jsArgs[1]);
            if (!ekskul) {
                sender.sendMessage("§cEkstrakurikuler '" + jsArgs[1] + "' tidak ditemukan.");
                return;
            }
            sender.sendMessage("§6=== " + ekskul.name.toUpperCase() + " ===");
            if (ekskul.description) sender.sendMessage("§7" + ekskul.description);
            sender.sendMessage("§fJadwal: §e" + ekskul.schedule);
            sender.sendMessage("§fAnggota (" + ekskul.members.length + "):");
            for (var i = 0; i < ekskul.members.length; i++) {
                sender.sendMessage(" §7- §f" + ekskul.members[i].name);
            }
            return;
        }

        if (aksi === "list") {
            var list = ExskulSys.listExtracurriculars();
            if (list.length === 0) {
                sender.sendMessage("§eBelum ada ekstrakurikuler yang terdaftar.");
                return;
            }
            sender.sendMessage("§6=== Daftar Ekstrakurikuler ===");
            for (var i = 0; i < list.length; i++) {
                sender.sendMessage(" §7- §f" + list[i].name + " §7| Jadwal: §e" + list[i].schedule + " §7| Anggota: §f" + list[i].members);
            }
            return;
        }

        if (aksi === "saya") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            var myEkskuls = ExskulSys.getExtracurricularsForMember(sender.getUniqueId().toString());
            if (myEkskuls.length === 0) {
                sender.sendMessage("§eKamu belum terdaftar di ekstrakurikuler manapun.");
                return;
            }
            sender.sendMessage("§6=== Ekskul-ku ===");
            for (var i = 0; i < myEkskuls.length; i++) {
                sender.sendMessage(" §7- §f" + myEkskuls[i].name + " §7| Jadwal: §e" + myEkskuls[i].schedule);
            }
            return;
        }

        sender.sendMessage("§cGunakan: /ekskul buat|hapus|daftar|keluar|lihat|list|saya");
    },
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            return toJavaList(["buat", "hapus", "daftar", "keluar", "lihat", "list", "saya"]);
        }
        return toJavaList([]);
    }
}, "server.ekskul.use");

// --- COMMAND: /koperasi ---
addCommand("koperasi", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];

        if (aksi === "saldo") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            var balance = KoperasiSys.getBalance(sender.getUniqueId().toString());
            sender.sendMessage("§6Saldo kamu: §e" + balance);
            return;
        }

        if (aksi === "deposit") {
            if (!sender.hasPermission("server.koperasi.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk deposit.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /koperasi deposit <player> <jumlah>");
                return;
            }
            var playerName = jsArgs[1];
            var amount = parseInt(jsArgs[2]);
            if (isNaN(amount) || amount <= 0) {
                sender.sendMessage("§cJumlah harus berupa angka positif.");
                return;
            }
            var target = Bukkit.getPlayer(playerName);
            var uuid;
            if (target) {
                uuid = target.getUniqueId().toString();
            } else {
                var offline = Bukkit.getOfflinePlayer(playerName);
                if (!offline.hasPlayedBefore()) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
                uuid = offline.getUniqueId().toString();
            }
            var hasil = KoperasiSys.deposit(uuid, playerName, amount);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "tarik") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /koperasi tarik <jumlah>");
                return;
            }
            var amount = parseInt(jsArgs[1]);
            if (isNaN(amount) || amount <= 0) {
                sender.sendMessage("§cJumlah harus berupa angka positif.");
                return;
            }
            var hasil = KoperasiSys.withdraw(sender.getUniqueId().toString(), sender.getName(), amount);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "beli") {
            if (!(sender instanceof org.bukkit.entity.Player)) {
                sender.sendMessage("§cCommand ini hanya bisa dijalankan di in-game.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /koperasi beli <nama_item>");
                return;
            }
            var itemName = jsArgs.slice(1).join(" ");
            var hasil = KoperasiSys.buyItem(sender.getUniqueId().toString(), sender.getName(), itemName);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "menu") {
            var menu = KoperasiSys.getMenu();
            var items = [];
            for (var key in menu) items.push(menu[key]);
            if (items.length === 0) {
                sender.sendMessage("§eMenu kantin kosong.");
                return;
            }
            sender.sendMessage("§6=== Menu Kantin ===");
            for (var i = 0; i < items.length; i++) {
                sender.sendMessage(" §7- §f" + items[i].name + " §7: §e" + items[i].price + " §7" + (items[i].description ? "(" + items[i].description + ")" : ""));
            }
            return;
        }

        if (aksi === "tambahmenu") {
            if (!sender.hasPermission("server.koperasi.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola menu.");
                return;
            }
            if (jsArgs.length < 4) {
                sender.sendMessage("§cGunakan: /koperasi tambahmenu <nama> <harga> [deskripsi]");
                return;
            }
            var desc = jsArgs.slice(3).join(" ");
            var hasil = KoperasiSys.addItemMenu(jsArgs[1], desc, jsArgs[2]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "hapushmenu") {
            if (!sender.hasPermission("server.koperasi.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola menu.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /koperasi hapusmenu <nama_item>");
                return;
            }
            var hasil = KoperasiSys.removeItemMenu(jsArgs[1]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "riwayat") {
            if (!sender.hasPermission("server.koperasi.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk melihat riwayat.");
                return;
            }
            var count = jsArgs[1] ? parseInt(jsArgs[1]) : 10;
            var logs = KoperasiSys.getTransactionLog(count);
            if (logs.length === 0) {
                sender.sendMessage("§eBelum ada transaksi.");
                return;
            }
            sender.sendMessage("§6=== Riwayat Transaksi (" + logs.length + ") ===");
            for (var i = 0; i < logs.length; i++) {
                var t = logs[i];
                var icon = t.type === "DEPOSIT" ? "§a+" : (t.type === "WITHDRAW" ? "§c-" : "§e-");
                var detail = t.type === "BUY" ? (" §7beli §f" + t.item) : "";
                sender.sendMessage("§7" + t.date + " " + icon + t.amount + " §7" + t.player + detail + " §7→ Saldo: §f" + t.balanceAfter);
            }
            return;
        }

        sender.sendMessage("§cGunakan: /koperasi saldo|deposit|tarik|beli|menu|tambahmenu|hapusmenu|riwayat");
    },
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            return toJavaList(["saldo", "deposit", "tarik", "beli", "menu", "tambahmenu", "hapusmenu", "riwayat"]);
        }
        if (jsArgs.length === 2 && jsArgs[0] === "deposit") {
            var names = [];
            var players = Bukkit.getOnlinePlayers().toArray();
            for (var i = 0; i < players.length; i++) names.push(players[i].getName());
            return toJavaList(names);
        }
        return toJavaList([]);
    }
}, "server.koperasi.use");

