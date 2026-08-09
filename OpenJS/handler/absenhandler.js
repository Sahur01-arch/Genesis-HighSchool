//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit");
const LuckPermsProvider = importClass("net.luckperms.api.LuckPermsProvider");
const Node = importClass("net.luckperms.api.node.Node");
const UUID = importClass("java.util.UUID");
const ArrayList = importClass("java.util.ArrayList");

// Panggil MySQL (Navigasi dari handler/ ke libs/libmysql.js)
const MySQL = requireScript("../libs/libmysql.js");

// ==============================================================
// 0. FUNGSI UTILITAS (Mencegah Bug Tab-Complete dll)
// ==============================================================
function toJavaList(jsArray, currentArg) {
    var list = new ArrayList();
    var filter = currentArg ? currentArg.toLowerCase() : "";
    for (var i = 0; i < jsArray.length; i++) {
        if (!filter || jsArray[i].toLowerCase().startsWith(filter)) {
            list.add(jsArray[i]);
        }
    }
    return list;
}

function padTwo(n) { return n < 10 ? "0" + n : "" + n; }
function formatTanggalHariIni() {
    var now = new Date();
    return now.getFullYear() + "-" + padTwo(now.getMonth() + 1) + "-" + padTwo(now.getDate());
}

// ==============================================================
// 1. INISIALISASI TABEL MYSQL (Absensi Sekolah & Ekskul)
// ==============================================================
task.thread(function() {
    var conn = MySQL.getConnection();
    if (conn) {
        try {
            var stmt = conn.createStatement();
            stmt.execute("CREATE TABLE IF NOT EXISTS sekolah_absensi (id INT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL, date DATE NOT NULL, status VARCHAR(20) NOT NULL, timestamp BIGINT NOT NULL)");
            stmt.execute("CREATE TABLE IF NOT EXISTS ekskul_absensi (id INT AUTO_INCREMENT PRIMARY KEY, uuid VARCHAR(36) NOT NULL, ekskul_name VARCHAR(50) NOT NULL, date DATE NOT NULL, status VARCHAR(20) NOT NULL, timestamp BIGINT NOT NULL)");
            stmt.close();
            conn.close();
            log.info("[absenhandler] Tabel absensi (Sekolah & Ekskul) berhasil diinisialisasi di MySQL.");
        } catch (e) {
            log.error("[absenhandler] Gagal inisialisasi tabel MySQL: " + e);
        }
    } else {
        log.error("[absenhandler] Gagal menghubungkan ke MySQL saat inisialisasi tabel.");
    }
});

// ==============================================================
// 2. LOGIKA EKSTRAKURIKULER (Penyimpanan JSON + LuckPerms)
// ==============================================================
var EKSKUL_FILE = "ekskul_data";

function loadEkskul() { DiskApi.loadFile(EKSKUL_FILE, false, false); }
function saveEkskul() { DiskApi.saveFile(EKSKUL_FILE, false, false); }
function safeParse(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    var str = String(raw);
    if (!str) return fallback;
    try { return JSON.parse(str); } catch (e) { return fallback; }
}

function manageLuckPerms(uuidStr, groupName, isAdd) {
    var lp = LuckPermsProvider.get();
    try {
        if (isAdd) {
            var group = lp.getGroupManager().createAndLoadGroup(groupName).join();
            lp.getGroupManager().saveGroup(group);
        }
        var user = lp.getUserManager().loadUser(UUID.fromString(uuidStr)).join();
        if (user) {
            var node = Node.builder("group." + groupName).build();
            if (isAdd) user.data().add(node); else user.data().remove(node);
            lp.getUserManager().saveUser(user);
        }
        return true;
    } catch (e) { 
        log.error("[absenhandler] LuckPerms Error: " + e);
        return false; 
    }
}

function deleteLuckPermsGroup(groupName) {
    var lp = LuckPermsProvider.get();
    try {
        var group = lp.getGroupManager().getGroup(groupName);
        if (group) lp.getGroupManager().deleteGroup(group);
    } catch (e) {}
}

function requestCreateEkskul(name, description, schedule, creatorName, creatorUuid, isAdmin) {
    loadEkskul();
    var ekskuls = safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
    var key = name.toLowerCase();
    
    if (ekskuls[key]) return { sukses: false, pesan: "Ekstrakurikuler '" + name + "' sudah terdaftar di sistem. Silakan pilih nama lain." };

    ekskuls[key] = {
        name: name,
        description: description || "Belum ada deskripsi",
        schedule: schedule || "Belum ditentukan",
        status: isAdmin ? "APPROVED" : "PENDING", 
        lead: { name: creatorName, uuid: creatorUuid.toString() },
        members: [{ name: creatorName, uuid: creatorUuid.toString(), joined: Date.now() }],
        created: Date.now()
    };

    if (isAdmin) manageLuckPerms(creatorUuid.toString(), "eks." + key, true);
    
    DiskApi.setVar(EKSKUL_FILE, "extracurriculars", JSON.stringify(ekskuls), false);
    saveEkskul();
    return isAdmin ? { sukses: true, pesan: "§a[Sistem Ekskul] §fEkstrakurikuler §e" + name + " §fberhasil diciptakan oleh Admin dan berstatus §aAKTIF§f. Grup LuckPerms terkait telah dikonfigurasi." } 
                   : { sukses: true, pesan: "§a[Sistem Ekskul] §fPengajuan ekskul §e" + name + " §fberhasil dikirim. Harap tunggu persetujuan dari Admin sekolah." };
}

function setEkskulStatus(name, status) {
    loadEkskul();
    var ekskuls = safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
    var key = name.toLowerCase();
    if (!ekskuls[key]) return { sukses: false, pesan: "Ekskul tersebut tidak ditemukan dalam database." };
    
    ekskuls[key].status = status;
    if (status === "APPROVED") manageLuckPerms(ekskuls[key].lead.uuid, "eks." + key, true);
    
    DiskApi.setVar(EKSKUL_FILE, "extracurriculars", JSON.stringify(ekskuls), false);
    saveEkskul();
    return { sukses: true, pesan: "§a[Panel Admin] §fStatus ekskul §e" + ekskuls[key].name + " §fberhasil diubah menjadi §b" + status + "§f." };
}

function removeEkskul(name) {
    loadEkskul();
    var ekskuls = safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
    var key = name.toLowerCase();
    if (!ekskuls[key]) return { sukses: false, pesan: "Ekskul tersebut tidak ditemukan." };
    
    var realName = ekskuls[key].name;
    delete ekskuls[key];
    DiskApi.setVar(EKSKUL_FILE, "extracurriculars", JSON.stringify(ekskuls), false);
    saveEkskul();
    deleteLuckPermsGroup("eks." + key);
    return { sukses: true, pesan: "§a[Panel Admin] §fEkstrakurikuler §c" + realName + " §ftelah resmi dibubarkan secara permanen dan seluruh datanya dihapus." };
}

function registerEkskulStudent(exskulName, playerName, uuid) {
    loadEkskul();
    var ekskuls = safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
    var key = exskulName.toLowerCase();
    if (!ekskuls[key]) return { sukses: false, pesan: "Ekskul tersebut tidak ditemukan." };
    if (ekskuls[key].status !== "APPROVED") return { sukses: false, pesan: "Ekskul ini belum disetujui oleh Admin (Belum aktif)." };
    
    for (var i=0; i<ekskuls[key].members.length; i++) {
        if (ekskuls[key].members[i].uuid === uuid.toString()) return { sukses: false, pesan: "Kamu sudah terdaftar di ekskul ini sebelumnya!" };
    }
    
    ekskuls[key].members.push({ name: playerName, uuid: uuid.toString(), joined: Date.now() });
    DiskApi.setVar(EKSKUL_FILE, "extracurriculars", JSON.stringify(ekskuls), false);
    saveEkskul();
    manageLuckPerms(uuid.toString(), "eks." + key, true);
    return { sukses: true, pesan: "§a[Sistem Ekskul] §fSelamat! Kamu berhasil bergabung dengan ekskul §e" + ekskuls[key].name + "§f." };
}

function unregisterEkskulStudent(exskulName, playerName, uuid) {
    loadEkskul();
    var ekskuls = safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
    var key = exskulName.toLowerCase();
    if (!ekskuls[key]) return { sukses: false, pesan: "Ekskul tersebut tidak ditemukan." };
    if (ekskuls[key].lead.uuid === uuid.toString()) return { sukses: false, pesan: "Sebagai Ketua Ekskul (Lead), kamu tidak bisa keluar. Harap minta Admin membubarkan ekskul atau ganti ketua." };
    
    var index = -1;
    for (var i=0; i<ekskuls[key].members.length; i++) {
        if (ekskuls[key].members[i].uuid === uuid.toString()) { index = i; break; }
    }
    if (index === -1) return { sukses: false, pesan: "Kamu bukan bagian dari ekskul ini." };
    
    ekskuls[key].members.splice(index, 1);
    DiskApi.setVar(EKSKUL_FILE, "extracurriculars", JSON.stringify(ekskuls), false);
    saveEkskul();
    manageLuckPerms(uuid.toString(), "eks." + key, false);
    return { sukses: true, pesan: "§a[Sistem Ekskul] §fKamu telah berhasil keluar dari ekskul §e" + ekskuls[key].name + "§f." };
}

function getAllEkskuls() {
    loadEkskul();
    return safeParse(DiskApi.getVar(EKSKUL_FILE, "extracurriculars", null, false), {});
}

// ==============================================================
// 3. LOGIKA ABSENSI (MySQL - Sekolah & Ekskul)
// ==============================================================
function _dbAbsen(isEkskul, uuidStr, ekskulName, status) {
    var tanggal = formatTanggalHariIni();
    var st = status.toUpperCase();
    try {
        var conn = MySQL.getConnection();
        if (!conn) {
            log.error("[absenhandler] Gagal koneksi database saat mencoba _dbAbsen.");
            return { sukses: false, pesan: "Sistem absensi sedang offline (Gagal konek Database)." };
        }

        var checkSql = isEkskul ? "SELECT id FROM ekskul_absensi WHERE uuid=? AND ekskul_name=? AND date=?" 
                                : "SELECT id FROM sekolah_absensi WHERE uuid=? AND date=?";
        var pstmtC = conn.prepareStatement(checkSql);
        pstmtC.setString(1, uuidStr);
        if (isEkskul) { pstmtC.setString(2, ekskulName.toLowerCase()); pstmtC.setString(3, tanggal); } 
        else { pstmtC.setString(2, tanggal); }
        
        var rs = pstmtC.executeQuery();
        if (rs.next()) {
            rs.close(); pstmtC.close(); conn.close();
            return { sukses: false, pesan: "Kamu sudah tercatat melakukan absensi hari ini (" + tanggal + ")!" };
        }
        rs.close(); pstmtC.close();

        var insSql = isEkskul ? "INSERT INTO ekskul_absensi (uuid,ekskul_name,date,status,timestamp) VALUES (?,?,?,?,?)"
                              : "INSERT INTO sekolah_absensi (uuid,date,status,timestamp) VALUES (?,?,?,?)";
        var pstmtI = conn.prepareStatement(insSql);
        pstmtI.setString(1, uuidStr);
        if (isEkskul) {
            pstmtI.setString(2, ekskulName.toLowerCase()); pstmtI.setString(3, tanggal);
            pstmtI.setString(4, st); pstmtI.setLong(5, Date.now());
        } else {
            pstmtI.setString(2, tanggal); pstmtI.setString(3, st); pstmtI.setLong(4, Date.now());
        }
        pstmtI.executeUpdate();
        pstmtI.close(); conn.close();
        
        var tipeString = isEkskul ? ("Ekskul §e" + ekskulName) : "Sekolah Umum";
        return { sukses: true, pesan: "§a[Sistem Absensi] §fBerhasil mencatat kehadiranmu untuk §a" + tipeString + " §fpada tanggal §e" + tanggal + " §fdengan status: §b" + st };
    } catch (e) { 
        log.error("[absenhandler] ERROR DATABASE (_dbAbsen): " + e);
        return { sukses: false, pesan: "Terjadi kesalahan internal pada Database. Lapor ke Admin!" }; 
    }
}

function _dbRekap(isEkskul, uuidStr, ekskulName) {
    var rekap = { hadir: 0, izin: 0, sakit: 0, alpha: 0, list: [] };
    try {
        var conn = MySQL.getConnection();
        if (!conn) return rekap;

        var sqlL = isEkskul ? "SELECT date, status FROM ekskul_absensi WHERE uuid=? AND ekskul_name=? ORDER BY date DESC LIMIT 10"
                            : "SELECT date, status FROM sekolah_absensi WHERE uuid=? ORDER BY date DESC LIMIT 10";
        var pL = conn.prepareStatement(sqlL);
        pL.setString(1, uuidStr);
        if (isEkskul) pL.setString(2, ekskulName.toLowerCase());
        var rsL = pL.executeQuery();
        while(rsL.next()) { rekap.list.push({ date: rsL.getString("date"), status: rsL.getString("status") }); }
        rsL.close(); pL.close();

        var sqlC = isEkskul ? "SELECT status, COUNT(*) as c FROM ekskul_absensi WHERE uuid=? AND ekskul_name=? GROUP BY status"
                            : "SELECT status, COUNT(*) as c FROM sekolah_absensi WHERE uuid=? GROUP BY status";
        var pC = conn.prepareStatement(sqlC);
        pC.setString(1, uuidStr);
        if (isEkskul) pC.setString(2, ekskulName.toLowerCase());
        var rsC = pC.executeQuery();
        while(rsC.next()) {
            var st = rsC.getString("status").toLowerCase();
            rekap[st] = rsC.getInt("c");
        }
        rsC.close(); pC.close(); conn.close();
    } catch(e) {
        log.error("[absenhandler] ERROR DATABASE (_dbRekap): " + e);
    }
    return rekap;
}

function tampilkanAbsensi(sender, targetName, uuidStr, isEkskul, eksName) {
    task.thread(function() {
        var r = _dbRekap(isEkskul, uuidStr, eksName);
        task.main(function() {
            var title = isEkskul ? "Buku Absensi " + targetName + " - " + eksName : "Buku Absensi Sekolah: " + targetName;
            sender.sendMessage("§6=================================");
            sender.sendMessage("§e 📜 " + title);
            sender.sendMessage("§6=================================");
            if (r.list.length === 0) {
                sender.sendMessage("§cBelum ada riwayat absensi yang tercatat di sistem.");
                return;
            }
            sender.sendMessage("§fTotal Hadir : §a" + r.hadir);
            sender.sendMessage("§fTotal Izin  : §e" + r.izin);
            sender.sendMessage("§fTotal Sakit : §9" + r.sakit);
            sender.sendMessage("§fTotal Alpha : §c" + r.alpha);
            sender.sendMessage("§8---------------------------------");
            sender.sendMessage("§7» 10 Riwayat Terakhir:");
            for(var i=0; i<r.list.length; i++) {
                sender.sendMessage(" §8- §fTanggal: §e" + r.list[i].date + " §8| §fStatus: §b" + r.list[i].status);
            }
            sender.sendMessage("§6=================================");
        });
    });
}

// ==============================================================
// 4. COMMAND HANDLER ABSENSI (/absen & /attendance)
// ==============================================================
var absenCommandHandler = {
    onCommand: function(sender, args) {
        var isPlayer = (sender instanceof org.bukkit.entity.Player);
        var jsArgs = toArray(args);
        var uuidStr = isPlayer ? sender.getUniqueId().toString() : "CONSOLE";

        if (jsArgs.length === 0) {
            sender.sendMessage("§6=== Panduan Sistem Absensi ===");
            sender.sendMessage("§e/absen mark §7- Melakukan absen harian (Default Hadir)");
            sender.sendMessage("§e/absen rekap §7- Melihat total & riwayat absen sekolahmu");
            sender.sendMessage("§e/absen ekskul <nama> <hadir|izin|sakit|alpha> §7- Absen khusus ekskul");
            sender.sendMessage("§e/absen rekap ekskul <nama> §7- Melihat riwayat absen ekskulmu");
            if (!isPlayer || sender.hasPermission("server.attendance.guru")) {
                sender.sendMessage("§e/absen cek <nama_player> §7- [Guru/Console] Cek absen murid");
            }
            return;
        }

        var aksi = jsArgs[0].toLowerCase();

        // 4A. ABSEN SEKOLAH UMUM
        if (aksi === "mark") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak bisa absen harian.");
            task.thread(function() {
                var h = _dbAbsen(false, uuidStr, null, "HADIR");
                task.main(function() { sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan); });
            });
            return;
        }

        // 4B. REKAP ABSENSI PRIBADI
        if (aksi === "rekap") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak punya riwayat absen pribadi. Gunakan '/absen cek <nama>'.");
            if (jsArgs.length >= 3 && jsArgs[1].toLowerCase() === "ekskul") {
                var ekskuls = getAllEkskuls();
                var namaEks = jsArgs[2].toLowerCase();
                if (!ekskuls[namaEks]) return sender.sendMessage("§cEkskul tidak ditemukan dalam sistem.");
                tampilkanAbsensi(sender, sender.getName(), uuidStr, true, ekskuls[namaEks].name);
            } else {
                tampilkanAbsensi(sender, sender.getName(), uuidStr, false, null);
            }
            return;
        }

        // 4C. ABSEN EKSKUL
        if (aksi === "ekskul") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak bisa absen ekskul.");
            if (jsArgs.length < 3) return sender.sendMessage("§cFormat salah! §fGunakan: §e/absen ekskul <nama_ekskul> <hadir|izin|sakit|alpha>");
            
            var ekskuls = getAllEkskuls();
            var eksData = ekskuls[jsArgs[1].toLowerCase()];
            if (!eksData) return sender.sendMessage("§cEkskul yang kamu sebutkan tidak ada atau belum terdaftar.");
            
            var isMember = false;
            for (var i=0; i<eksData.members.length; i++) { if (eksData.members[i].uuid === uuidStr) isMember = true; }
            if (!isMember) return sender.sendMessage("§cKamu tidak berhak absen karena tidak terdaftar sebagai anggota ekskul ini.");
            
            var st = jsArgs[2].toUpperCase();
            if (["HADIR","IZIN","SAKIT","ALPHA"].indexOf(st) === -1) return sender.sendMessage("§cStatus absen tidak valid! Pilih: §fHADIR, IZIN, SAKIT, atau ALPHA.");
            
            task.thread(function() {
                var h = _dbAbsen(true, uuidStr, eksData.name, st);
                task.main(function() { sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan); });
            });
            return;
        }

        // 4D. GURU CEK MURID
        if (aksi === "cek" && (!isPlayer || sender.hasPermission("server.attendance.guru"))) {
            if (!jsArgs[1]) return sender.sendMessage("§cFormat salah! §fGunakan: §e/absen cek <nama_player>");
            var targetName = jsArgs[1];
            var target = Bukkit.getPlayer(targetName);
            var tuuid = target ? target.getUniqueId().toString() : null;
            if (!tuuid) {
                var off = Bukkit.getOfflinePlayer(targetName);
                if (off && off.hasPlayedBefore()) tuuid = off.getUniqueId().toString();
            }
            if (!tuuid) return sender.sendMessage("§cPlayer §e" + targetName + " §ctidak pernah bermain di server ini.");
            
            tampilkanAbsensi(sender, targetName, tuuid, false, null);
            return;
        }
        
        sender.sendMessage("§cPerintah tidak dikenali. Ketik §e/absen §cuntuk bantuan.");
    },
    
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        var isPlayer = (sender instanceof org.bukkit.entity.Player);

        if (jsArgs.length === 1) {
            var opts = ["mark", "rekap", "ekskul"];
            if (!isPlayer || sender.hasPermission("server.attendance.guru")) opts.push("cek");
            return toJavaList(opts, jsArgs[0]);
        }
        if (jsArgs.length === 2 && jsArgs[0].toLowerCase() === "ekskul") {
            var e = getAllEkskuls(), names = [];
            for (var k in e) if (e[k].status === "APPROVED") names.push(e[k].name);
            return toJavaList(names, jsArgs[1]);
        }
        if (jsArgs.length === 3 && jsArgs[0].toLowerCase() === "ekskul") {
            var stList = ["hadir", "izin", "sakit", "alpha"];
            return toJavaList(stList, jsArgs[2]);
        }
        return toJavaList([], "");
    }
};

addCommand("absen", absenCommandHandler, "server.absen.use");
addCommand("attendance", absenCommandHandler, "server.absen.use");

// ==============================================================
// 5. COMMAND HANDLER EKSKUL (/eks & /ekstrakurikuler)
// ==============================================================
var eksCommandHandler = {
    onCommand: function(sender, args) {
        var isPlayer = (sender instanceof org.bukkit.entity.Player);
        var jsArgs = toArray(args);
        var subCmd = jsArgs[0] ? jsArgs[0].toLowerCase() : "";
        var uuidStr = isPlayer ? sender.getUniqueId().toString() : "CONSOLE";
        var senderName = isPlayer ? sender.getName() : "CONSOLE";

        if (!subCmd) {
            sender.sendMessage("§6=== Panduan Sistem Ekstrakurikuler ===");
            sender.sendMessage("§e/eks create <nama> §7- Ajukan pembuatan ekskul baru");
            sender.sendMessage("§e/eks list §7- Tampilkan seluruh ekskul yang aktif");
            sender.sendMessage("§e/eks info <nama> §7- Lihat statistik detail ekskul");
            sender.sendMessage("§e/eks join <nama> §7- Bergabung menjadi anggota ekskul");
            sender.sendMessage("§e/eks leave <nama> §7- Keluar dari anggota ekskul");
            if (!isPlayer || sender.hasPermission("server.ekskul.admin")) {
                sender.sendMessage("§e/eks admin <approve|deny|remove> <nama> §7- Panel kelola admin");
            }
            return;
        }

        if (subCmd === "create") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak bisa membuat ekskul.");
            if (!jsArgs[1]) return sender.sendMessage("§cNama ekskul wajib diisi!");
            var isAdmin = sender.hasPermission("server.ekskul.admin");
            var h = requestCreateEkskul(jsArgs[1], "", "", senderName, uuidStr, isAdmin);
            sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan);
            return;
        }
        if (subCmd === "join") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak bisa join ekskul.");
            if (!jsArgs[1]) return sender.sendMessage("§cTentukan nama ekskulnya!");
            var h = registerEkskulStudent(jsArgs[1], senderName, uuidStr);
            sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan);
            return;
        }
        if (subCmd === "leave") {
            if (!isPlayer) return sender.sendMessage("§cConsole tidak bisa leave ekskul.");
            if (!jsArgs[1]) return sender.sendMessage("§cTentukan nama ekskulnya!");
            var h = unregisterEkskulStudent(jsArgs[1], senderName, uuidStr);
            sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan);
            return;
        }
        if (subCmd === "list") {
            var e = getAllEkskuls(), c = 0;
            sender.sendMessage("§6=================================");
            sender.sendMessage("§e 🏆 Daftar Ekstrakurikuler Aktif");
            sender.sendMessage("§6=================================");
            for (var key in e) {
                if (e[key].status === "APPROVED") {
                    sender.sendMessage(" §8» §a" + e[key].name);
                    sender.sendMessage("    §7Ketua: §f" + e[key].lead.name + " §8| §7Total Anggota: §b" + e[key].members.length);
                    c++;
                }
            }
            if (c === 0) sender.sendMessage("§cBelum ada ekskul yang di-approve di server ini.");
            sender.sendMessage("§6=================================");
            return;
        }
        if (subCmd === "info") {
            if (!jsArgs[1]) return sender.sendMessage("§cMasukkan nama ekskul yang ingin dicek!");
            var targetEks = jsArgs[1].toLowerCase();
            var e = getAllEkskuls()[targetEks];
            if (!e) return sender.sendMessage("§cEkskul §e" + jsArgs[1] + " §ctidak ditemukan.");
            
            sender.sendMessage("§6=================================");
            sender.sendMessage("§e ℹ️ Informasi Detail: §a" + e.name);
            sender.sendMessage("§6=================================");
            sender.sendMessage("§7Status Validasi : §b" + e.status);
            sender.sendMessage("§7Ketua / Leader  : §f" + e.lead.name);
            sender.sendMessage("§7Total Anggota   : §e" + e.members.length + " Orang");
            sender.sendMessage("§8---------------------------------");
            
            var mlist = [];
            for(var i = 0; i < e.members.length; i++) { mlist.push(e.members[i].name); }
            sender.sendMessage("§7Daftar Anggota:");
            sender.sendMessage("§f" + mlist.join("§8, §f"));
            sender.sendMessage("§6=================================");
            return;
        }

        // TIER ADMIN / CONSOLE
        if (subCmd === "admin" && (!isPlayer || sender.hasPermission("server.ekskul.admin"))) {
            var act = jsArgs[1] ? jsArgs[1].toLowerCase() : "";
            if (!act || !jsArgs[2]) {
                sender.sendMessage("§cFormat salah! §fGunakan: §e/eks admin <approve|remove|deny> <nama_ekskul>");
                return;
            }
            
            if (act === "approve") {
                var h = setEkskulStatus(jsArgs[2], "APPROVED");
                sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan);
            } else if (act === "remove" || act === "deny") {
                var h = removeEkskul(jsArgs[2]);
                sender.sendMessage(h.sukses ? h.pesan : "§c" + h.pesan);
            } else {
                sender.sendMessage("§cSub-perintah admin tidak dikenali!");
            }
            return;
        }
        
        sender.sendMessage("§cPerintah tidak dikenali. Ketik §e/eks §cuntuk melihat bantuan.");
    },
    
    onTabComplete: function(sender, args) {
        var jsArgs = toArray(args);
        var isPlayer = (sender instanceof org.bukkit.entity.Player);

        if (jsArgs.length === 1) {
            var opts = ["create", "list", "join", "leave", "info"];
            if (!isPlayer || sender.hasPermission("server.ekskul.admin")) opts.push("admin");
            return toJavaList(opts, jsArgs[0]);
        }
        if (jsArgs.length === 2 && jsArgs[0].toLowerCase() === "admin" && (!isPlayer || sender.hasPermission("server.ekskul.admin"))) {
            return toJavaList(["approve", "remove", "deny"], jsArgs[1]);
        }
        // Autocomplete nama ekskul di arg 2
        if (jsArgs.length === 2 && ["join","leave","info"].indexOf(jsArgs[0].toLowerCase()) !== -1) {
            var e = getAllEkskuls(), names = [];
            for (var k in e) if (e[k].status === "APPROVED") names.push(e[k].name);
            return toJavaList(names, jsArgs[1]);
        }
        // Autocomplete nama ekskul (termasuk yang pending) untuk command admin
        if (jsArgs.length === 3 && jsArgs[0].toLowerCase() === "admin") {
            var e = getAllEkskuls(), allnames = [];
            for (var k in e) allnames.push(e[k].name);
            return toJavaList(allnames, jsArgs[2]);
        }
        return toJavaList([], "");
    }
};

addCommand("eks", eksCommandHandler, "server.ekskul.use");
addCommand("ekstrakurikuler", eksCommandHandler, "server.ekskul.use");

