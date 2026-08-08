//!loadmanually
var Bukkit = importClass("org.bukkit.Bukkit");

var FILENAME = "birthday_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function safeParse(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    var str = String(raw);
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        log.error("[libgift] JSON parse error: " + e);
        return fallback;
    }
}

function padTwo(n) {
    return n < 10 ? "0" + n : "" + n;
}

function setBirthday(uuid, playerName, dateString) {
    try {
        loadData();
        var bdays = safeParse(DiskApi.getVar(FILENAME, "players", null, false), {});
        
        bdays[uuid] = {
            name: playerName,
            date: dateString, // Format: "dd/mm"
            lastClaimedYear: 0
        };
        
        DiskApi.setVar(FILENAME, "players", JSON.stringify(bdays), false);
        saveData();
        return true;
    } catch (e) {
        log.error("Error setBirthday: " + e);
        return false;
    }
}

function giveGift(player) {
    var playerName = player.getName();
    var console = Bukkit.getConsoleSender();
    
    // Sesuaikan isi hadiah manual di sini
    Bukkit.dispatchCommand(console, "give " + playerName + " diamond 64");
    Bukkit.dispatchCommand(console, "give " + playerName + " cake 1");
    Bukkit.dispatchCommand(console, "eco give " + playerName + " 50000");
    
    player.sendTitle("§6§lSELAMAT ULANG TAHUN!", "§eSemoga panjang umur & sehat selalu", 10, 70, 20);
    player.sendMessage("§a[Kado] §fCek inventory kamu! Ada hadiah spesial dari server.");
    Bukkit.broadcastMessage("§d§l[Event] §fHari ini adalah ulang tahun §e§l" + playerName + "§f! Ucapkan selamat!");
}

function checkAndGiveGift(player) {
    var uuid = player.getUniqueId().toString();
    loadData();
    var bdays = safeParse(DiskApi.getVar(FILENAME, "players", null, false), {});
    
    if (!bdays[uuid]) return; 
    
    var data = bdays[uuid];
    var now = new Date();
    var todayStr = padTwo(now.getDate()) + "/" + padTwo(now.getMonth() + 1);
    var currentYear = now.getFullYear();
    
    // Jika hari ini tanggal ulang tahunnya DAN belum klaim tahun ini
    if (data.date === todayStr && data.lastClaimedYear < currentYear) {
        giveGift(player);
        data.lastClaimedYear = currentYear;
        bdays[uuid] = data;
        
        DiskApi.setVar(FILENAME, "players", JSON.stringify(bdays), false);
        saveData();
    }
}

function klaimHadiahManual(player) {
    var uuid = player.getUniqueId().toString();
    loadData();
    var bdays = safeParse(DiskApi.getVar(FILENAME, "players", null, false), {});
    
    if (!bdays[uuid]) {
        return { sukses: false, pesan: "§cData ulang tahunmu belum diatur oleh admin." };
    }
    
    var data = bdays[uuid];
    var now = new Date();
    var currentYear = now.getFullYear();
    
    if (data.lastClaimedYear >= currentYear) {
        return { sukses: false, pesan: "§cKamu sudah mengambil hadiah ulang tahun untuk tahun ini (" + currentYear + ")!" };
    }
    
    var parts = data.date.split("/");
    var targetDay = parseInt(parts[0], 10);
    var targetMonth = parseInt(parts[1], 10) - 1;
    var bdayThisYear = new Date(currentYear, targetMonth, targetDay);
    
    if (now >= bdayThisYear) {
        giveGift(player);
        data.lastClaimedYear = currentYear;
        bdays[uuid] = data;
        
        DiskApi.setVar(FILENAME, "players", JSON.stringify(bdays), false);
        saveData();
        
        return { sukses: true, pesan: "§aBerhasil! Hadiah ulang tahunmu yang sempat terlewat telah diklaim." };
    } else {
        return { sukses: false, pesan: "§cUlang tahunmu belum tiba tahun ini! Jadwalmu: " + data.date };
    }
}

// === SISTEM LOOP OTOMATIS (Mengecek player online setiap 1 menit) ===
var plugin = Bukkit.getPluginManager().getPlugin("OpenJS");
Bukkit.getScheduler().runTaskTimer(plugin, new java.lang.Runnable({
    run: function() {
        var onlinePlayers = Bukkit.getOnlinePlayers().iterator();
        while (onlinePlayers.hasNext()) {
            var player = onlinePlayers.next();
            checkAndGiveGift(player);
        }
    }
}), 0, 1200);

return {
    setBirthday: setBirthday,
    klaimHadiahManual: klaimHadiahManual
};

