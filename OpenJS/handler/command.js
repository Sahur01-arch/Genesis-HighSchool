//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit");
const LuckPermsProvider = importClass("net.luckperms.api.LuckPermsProvider");
const kelasManager = requireScript("../libs/libkelas.js");
const luck = requireScript("../libs/libluckperms.js");
const Tugas = requireScript("../libs/libtugas.js");
const config = requireScript("../libs/config.js");
const EventSys = requireScript("../libs/libeventschool.js");
const ReportSys = requireScript("../libs/libreportcard.js");
const OrgSys = requireScript("../libs/liborganisasi.js");
const KoperasiSys = requireScript("../libs/libcooperative.js");
const GroupSys = requireScript("../libs/libgroup.js");
const SistemHadiah = requireScript("../libs/libgift.js");

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

// --- EVENT LISTENER (Simpan Virtual Chest saat Guru menutupnya) ---
registerEvent("org.bukkit.event.inventory.InventoryCloseEvent", function(event) {
    const title = event.getView().getTitle();
    if (title && title.indexOf(config.inventory.tugasTitlePrefix) === 0) {
        const namaKelas = title.substring(config.inventory.tugasTitlePrefix.length);
        Tugas.simpanChestInventory(namaKelas, event.getInventory());
    }
});

// --- COMMAND: /kelas ---
addCommand("kelas", {
  onCommand: function(sender, args) {
    try {
        const jsArgs = toArray(args);
        const aksi = jsArgs[0];

        if (aksi === "tambah") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola kelas.");
                return;
            }
            if (!jsArgs[1]) {
                sender.sendMessage("§cGunakan: /kelas tambah <nama_kelas> [weight]");
                return;
            }
            kelasManager.addGroup(jsArgs[1], jsArgs[2] ? parseInt(jsArgs[2]) : 0);
            sender.sendMessage("§aKelas " + jsArgs[1] + " berhasil dibuat di LuckPerms.");
            return;
        }

        if (aksi === "hapus") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola kelas.");
                return;
            }
            if (!jsArgs[1]) {
                sender.sendMessage("§cGunakan: /kelas hapus <nama_kelas>");
                return;
            }
            kelasManager.removeGroup(jsArgs[1], sender);
            return;
        }

        if (aksi === "list") {
            var kelasList = ["jurusan_redstone", "jurusan_build", "dkv"];
            var lp = LuckPermsProvider.get();
            sender.sendMessage("§6=== Daftar Kelas ===");
            for (var i = 0; i < kelasList.length; i++) {
                var group = lp.getGroupManager().getGroup(kelasList[i]);
                if (group) {
                    sender.sendMessage("§7- §f" + kelasList[i].toUpperCase() + " §7(Weight: §e" + (group.getWeight() || 0) + "§7)");
                } else {
                    sender.sendMessage("§7- §f" + kelasList[i].toUpperCase() + " §c(tidak ada)");
                }
            }
            return;
        }

        if (aksi === "info") {
            if (!jsArgs[1]) {
                sender.sendMessage("§cGunakan: /kelas info <nama_kelas>");
                return;
            }
            var lp = LuckPermsProvider.get();
            var group = lp.getGroupManager().getGroup(jsArgs[1]);
            if (!group) {
                sender.sendMessage("§cKelas '" + jsArgs[1] + "' tidak ditemukan.");
                return;
            }
            sender.sendMessage("§6=== Info Kelas " + group.getName().toUpperCase() + " ===");
            sender.sendMessage("§fWeight: §e" + (group.getWeight() || 0));

            var nodes = group.getNodes();
            var prefixes = [];
            var iterator = nodes.iterator();
            while (iterator.hasNext()) {
                var node = iterator.next();
                var key = node.getKey();
                if (key.indexOf("prefix.") === 0) {
                    prefixes.push(key.substring(7));
                }
            }
            if (prefixes.length > 0) {
                sender.sendMessage("§fPrefix: §e" + prefixes.join(", "));
            }
            return;
        }

        if (aksi === "siswa") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk melihat daftar siswa.");
                return;
            }
            if (!jsArgs[1]) {
                sender.sendMessage("§cGunakan: /kelas siswa <nama_kelas>");
                return;
            }
            var members = GroupSys.getGroupMembers(jsArgs[1]);
            if (members.length === 0) {
                sender.sendMessage("§eTidak ada siswa di kelas " + jsArgs[1] + ".");
                return;
            }
            sender.sendMessage("§6=== Siswa " + jsArgs[1].toUpperCase() + " (" + members.length + ") ===");
            for (var i = 0; i < members.length; i++) {
                sender.sendMessage("§7- §f" + members[i].name);
            }
            return;
        }

        if (aksi === "masukkan") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola siswa.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /kelas masukkan <player> <nama_kelas>");
                return;
            }
            var playerName = jsArgs[1];
            var groupName = jsArgs[2];
            var hasil = GroupSys.assignPlayer(playerName, groupName);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "keluarkan") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengelola siswa.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /kelas keluarkan <player> <nama_kelas>");
                return;
            }
            var playerName = jsArgs[1];
            var groupName = jsArgs[2];
            var hasil = GroupSys.removePlayer(playerName, groupName);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "setweight") {
            if (!sender.hasPermission("server.kelas")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengatur weight.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /kelas setweight <nama_kelas> <weight>");
                return;
            }
            var hasil = GroupSys.setGroupWeight(jsArgs[1], parseInt(jsArgs[2]));
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        sender.sendMessage("§cGunakan: /kelas tambah|hapus|list|info|siswa|masukkan|keluarkan|setweight");
    } catch (e) {
        sender.sendMessage("§cTerjadi kesalahan saat memproses command kelas.");
        log.error("Command /kelas error: " + e);
    }
  },
  onTabComplete: function(sender, args) {
    var jsArgs = toArray(args);
    if (jsArgs.length === 1) {
        return toJavaList(["tambah", "hapus", "list", "info", "siswa", "masukkan", "keluarkan", "setweight"]);
    }
    if (jsArgs.length === 2 && (jsArgs[0] === "masukkan" || jsArgs[0] === "keluarkan")) {
        var names = [];
        var players = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < players.length; i++) names.push(players[i].getName());
        return toJavaList(names);
    }
    if (jsArgs.length === 3 && (jsArgs[0] === "masukkan" || jsArgs[0] === "keluarkan")) {
        return toJavaList(["kelasa", "kelasb", "kelasc", "kelasd"]);
    }
    if (jsArgs.length === 2 && (jsArgs[0] === "info" || jsArgs[0] === "siswa" || jsArgs[0] === "hapus")) {
        return toJavaList(["kelasa", "kelasb", "kelasc", "kelasd"]);
    }
    if (jsArgs.length === 2 && jsArgs[0] === "tambah") {
        return toJavaList(["kelasa", "kelasb", "kelasc", "kelasd"]);
    }
    if (jsArgs.length === 3 && jsArgs[0] === "setweight") {
        return toJavaList(["kelasa", "kelasb", "kelasc", "kelasd"]);
    }
    return toJavaList([]);
  }
}, "server.kelas");

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
}, "server.kelas");

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
      Tugas.bukaChestUntukGuru(sender, jsArgs[1]);
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

      const hasil = Tugas.submitTugas(sender, namaKelas);
      sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
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
                var offlinePlayers = Bukkit.getOfflinePlayers();
                var found = false;
                for (var j = 0; j < offlinePlayers.length; j++) {
                    if (offlinePlayers[j].getName() != null && offlinePlayers[j].getName().equalsIgnoreCase(playerName)) {
                        uuid = offlinePlayers[j].getUniqueId().toString();
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
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
                var offlinePlayers = Bukkit.getOfflinePlayers();
                var found = false;
                for (var j = 0; j < offlinePlayers.length; j++) {
                    if (offlinePlayers[j].getName() != null && offlinePlayers[j].getName().equalsIgnoreCase(playerName)) {
                        uuid = offlinePlayers[j].getUniqueId().toString();
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
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
                var offlinePlayers = Bukkit.getOfflinePlayers();
                var found = false;
                for (var j = 0; j < offlinePlayers.length; j++) {
                    if (offlinePlayers[j].getName() != null && offlinePlayers[j].getName().equalsIgnoreCase(playerName)) {
                        uuid = offlinePlayers[j].getUniqueId().toString();
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
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
                var offlinePlayers = Bukkit.getOfflinePlayers();
                var found = false;
                for (var j = 0; j < offlinePlayers.length; j++) {
                    if (offlinePlayers[j].getName() != null && offlinePlayers[j].getName().equalsIgnoreCase(playerName)) {
                        uuid = offlinePlayers[j].getUniqueId().toString();
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
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
                var offlinePlayers = Bukkit.getOfflinePlayers();
                var found = false;
                for (var j = 0; j < offlinePlayers.length; j++) {
                    if (offlinePlayers[j].getName() != null && offlinePlayers[j].getName().equalsIgnoreCase(playerName)) {
                        uuid = offlinePlayers[j].getUniqueId().toString();
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    sender.sendMessage("§cPlayer '" + playerName + "' tidak ditemukan.");
                    return;
                }
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

        if (aksi === "hapusmenu") {
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

// --- COMMAND: /group ---
addCommand("group", {
    onCommand: function(sender, args) {
        var jsArgs = toArray(args);
        var aksi = jsArgs[0];

        if (aksi === "create") {
            if (!sender.hasPermission("server.group.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk membuat group.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /group create <nama_group> [weight]");
                return;
            }
            var hasil = GroupSys.createGroup(jsArgs[1], jsArgs[2] ? parseInt(jsArgs[2]) : null);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "delete") {
            if (!sender.hasPermission("server.group.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk menghapus group.");
                return;
            }
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /group delete <nama_group>");
                return;
            }
            var hasil = GroupSys.deleteGroup(jsArgs[1]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "info") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /group info <nama_group>");
                return;
            }
            var info = GroupSys.getGroupInfo(jsArgs[1]);
            if (!info) {
                sender.sendMessage("§cGroup '" + jsArgs[1] + "' tidak ditemukan.");
                return;
            }
            sender.sendMessage("§6=== Info Group " + info.name.toUpperCase() + " ===");
            sender.sendMessage("§fWeight: §e" + info.weight);
            if (info.prefix) sender.sendMessage("§fPrefix: §e" + info.prefix);
            if (info.permissions.length > 0) {
                sender.sendMessage("§fMeta:");
                for (var i = 0; i < info.permissions.length; i++) {
                    sender.sendMessage(" §7- §f" + info.permissions[i]);
                }
            }
            return;
        }

        if (aksi === "list") {
            var groups = GroupSys.listGroups();
            if (groups.length === 0) {
                sender.sendMessage("§eTidak ada group.");
                return;
            }
            sender.sendMessage("§6=== Daftar Group (" + groups.length + ") ===");
            for (var i = 0; i < groups.length; i++) {
                sender.sendMessage("§7- §f" + groups[i].name + " §7(Weight: §e" + groups[i].weight + "§7)");
            }
            return;
        }

        if (aksi === "setweight") {
            if (!sender.hasPermission("server.group.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk mengatur weight.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /group setweight <nama_group> <weight>");
                return;
            }
            var hasil = GroupSys.setGroupWeight(jsArgs[1], parseInt(jsArgs[2]));
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "assign") {
            if (!sender.hasPermission("server.group.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk assign player.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /group assign <player> <nama_group>");
                return;
            }
            var hasil = GroupSys.assignPlayer(jsArgs[1], jsArgs[2]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "remove") {
            if (!sender.hasPermission("server.group.manage")) {
                sender.sendMessage("§cKamu tidak punya izin untuk remove player.");
                return;
            }
            if (jsArgs.length < 3) {
                sender.sendMessage("§cGunakan: /group remove <player> <nama_group>");
                return;
            }
            var hasil = GroupSys.removePlayer(jsArgs[1], jsArgs[2]);
            sender.sendMessage(hasil.sukses ? "§a" + hasil.pesan : "§c" + hasil.pesan);
            return;
        }

        if (aksi === "members") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /group members <nama_group>");
                return;
            }
            var members = GroupSys.getGroupMembers(jsArgs[1]);
            if (members.length === 0) {
                sender.sendMessage("§eTidak ada anggota di group " + jsArgs[1] + ".");
                return;
            }
            sender.sendMessage("§6=== Anggota " + jsArgs[1].toUpperCase() + " (" + members.length + ") ===");
            for (var i = 0; i < members.length; i++) {
                sender.sendMessage("§7- §f" + members[i].name);
            }
            return;
        }

        if (aksi === "player") {
            if (jsArgs.length < 2) {
                sender.sendMessage("§cGunakan: /group player <nama_player>");
                return;
            }
            var groups = GroupSys.getPlayerGroups(jsArgs[1]);
            if (groups.length === 0) {
                sender.sendMessage("§ePlayer " + jsArgs[1] + " tidak ada di group manapun.");
                return;
            }
            sender.sendMessage("§6=== Group " + jsArgs[1] + " ===");
            for (var i = 0; i < groups.length; i++) {
                sender.sendMessage("§7- §f" + groups[i]);
            }
            return;
        }

        sender.sendMessage("§cGunakan: /group create|delete|info|list|setweight|assign|remove|members|player");
    },
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        if (jsArgs.length === 1) {
            return toJavaList(["create", "delete", "info", "list", "setweight", "assign", "remove", "members", "player"]);
        }
        if (jsArgs.length === 2 && (jsArgs[0] === "assign" || jsArgs[0] === "remove")) {
            var names = [];
            var players = Bukkit.getOnlinePlayers().toArray();
            for (var i = 0; i < players.length; i++) names.push(players[i].getName());
            return toJavaList(names);
        }
        if (jsArgs.length === 2 && (jsArgs[0] === "info" || jsArgs[0] === "delete" || jsArgs[0] === "setweight" || jsArgs[0] === "members" || jsArgs[0] === "assign" || jsArgs[0] === "remove")) {
            var groups = GroupSys.listGroups();
            var names = [];
            for (var i = 0; i < groups.length; i++) names.push(groups[i].name);
            return toJavaList(names);
        }
        return toJavaList([]);
    }
}, "server.group.manage");

addCommand("setgift", {
  onCommand: function(sender, args) {
    if (!sender.isOp() && !sender.hasPermission("server.setgift")) {
      sender.sendMessage("§cKamu tidak punya izin memggunakan /setgift")
      return;
    }

    if (args.length < 2) {
      sender.sendMessage("§cGunakan: /setgift <nama_player> <dd/mm>");
      sender.sendMessage("§eContoh: /setgift Budi 25/12");
      return;
    }

    var targetName = args[0];
    var dateString = args[1];

    // validasi format tanggal
    if (dateString.length !== 5 || dateString.indexOf("/") === -1) {
      sender.sendMessage("§cFormat tanggal salah! Gunakan format dd/mm contoh (Contoh: 05/08)");
      return;
    }

    // Ambil target player 
    var targetPlayer = Bukkit.getPlayerExact(targetName);
    var uuid = null;
    var realName = targetName;

    if (targetPlayer !== null) {
      uuid = targetPlayer.getUniqueId().toString();
      realName = targetPlayer.getName();
    } else {
      var offlinePlayers = Bukkit.getOfflinePlayers();
      for (var i = 0; i < offlinePlayers.length; i++) {
        var op = offlinePlayers[i];
        if (op.getName() !== null && op.getName().equalsIgnoreCase(targetName)) {
          if (op.hasPlayedBefore()) {
            uuid = op.getUniqueId().toString();
            realName = op.getName();
            break;
          }
        }
      }
    }

    if (!uuid) {
      sender.sendMessage("§cPemain '" + targetName + "' tidak ditemukan atau belum pernah bermain di server ini.");
      return;
    }

    // panggil fungsi penyimpanan 
    var success = SistemHadiah.setBirthday(uuid, targetName, dateString);

    if (success) {
      sender.sendMessage("§aBerhasil mengatur tanggal ulang tahun!")
    } else {
      sender.sendMessage("§cTerjadi kesalahan saat menyimpan data.");
    }
  }
});

addCommand("ambilhadiah", {
  onCommand: function(sender, args) {
    if (!(sender instanceof org.bukkit.entity.Player)) {
      sender.sendMessage("Command ini hanya bisa dijalankan player");
      return;
    }

    // Panggol fungsi klaim 
    var hasil = SistemHadiah.klaimHadiahManual(sender);

    sender.sendMessage(hasil.pesan);
  }
})
