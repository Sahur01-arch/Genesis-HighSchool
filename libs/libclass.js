//!loadmanually

const Bukkit = importClass("org.bukkit.Bukkit");

const FILENAME = "attendance_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function padTwo(n) {
    return n < 10 ? "0" + n : "" + n;
}

function formatTanggalHariIni() {
    var now = new Date();
    var tahun = now.getFullYear();
    var bulan = padTwo(now.getMonth() + 1);
    var tanggal = padTwo(now.getDate());
    return tahun + "-" + bulan + "-" + tanggal;
}

function recordAttendance(uuid, status) {
    if (!uuid || !status) {
        log.error("[libclass] Gagal catat absensi: UUID atau status tidak valid.");
        return { sukses: false, pesan: "Data absensi tidak lengkap." };
    }

    try {
        loadData();
        var tanggalHariIni = formatTanggalHariIni();
        var attendance = DiskApi.getVar(FILENAME, uuid, [], false);

        var sudahAbsenHariIni = attendance.some(function(a) { return a.date === tanggalHariIni; });
        if (sudahAbsenHariIni) {
            return { sukses: false, pesan: "Kamu sudah absen hari ini." };
        }

        attendance.push({
            date: tanggalHariIni,
            status: status,
            timestamp: Date.now()
        });
        DiskApi.setVar(FILENAME, uuid, attendance, false);
        saveData();

        log.info("[libclass] Absensi dicatat untuk UUID: " + uuid + " tanggal " + tanggalHariIni);
        return { sukses: true, pesan: "Absensi berhasil dicatat sebagai: " + status + " (" + tanggalHariIni + ")" };
    } catch (e) {
        log.error("[libclass] Error saat mencatat absensi: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan internal saat mencatat absensi." };
    }
}

function getAttendance(uuid) {
    if (!uuid) return [];
    loadData();
    return DiskApi.getVar(FILENAME, uuid, [], false);
}

function getAttendanceBulanIni(uuid) {
    var semua = getAttendance(uuid);
    var prefixBulanIni = formatTanggalHariIni().substring(0, 7);
    return semua.filter(function(a) { return a.date.indexOf(prefixBulanIni) === 0; });
}

function hitungRekap(uuid) {
    var semua = getAttendance(uuid);
    var rekap = { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: semua.length };

    semua.forEach(function(a) {
        var statusLower = a.status.toLowerCase();
        if (rekap.hasOwnProperty(statusLower)) {
            rekap[statusLower]++;
        }
    });

    return rekap;
}

function tampilkanAbsensi(sender, targetPlayerName, targetUuid) {
    var riwayat = getAttendance(targetUuid);
    var rekap = hitungRekap(targetUuid);

    if (riwayat.length === 0) {
        sender.sendMessage("§e" + targetPlayerName + " belum punya riwayat absensi.");
        return;
    }

    sender.sendMessage("§6=== Absensi " + targetPlayerName + " ===");
    sender.sendMessage("§fHadir: §a" + rekap.hadir + " §f| Izin: §e" + rekap.izin + " §f| Sakit: §9" + rekap.sakit + " §f| Alpha: §c" + rekap.alpha);
    sender.sendMessage("§7--- Riwayat 10 Terakhir ---");

    var mulaiDari = Math.max(0, riwayat.length - 10);
    for (var i = riwayat.length - 1; i >= mulaiDari; i--) {
        var a = riwayat[i];
        sender.sendMessage("§7" + a.date + " §f: §e" + a.status);
    }
}

return {
    recordAttendance: recordAttendance,
    getAttendance: getAttendance,
    getAttendanceBulanIni: getAttendanceBulanIni,
    hitungRekap: hitungRekap,
    tampilkanAbsensi: tampilkanAbsensi
};
