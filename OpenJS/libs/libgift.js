//!loadmanually
var Bukkit = importClass("org.bukkit.Bukkit");

var FILENAME = "birthday_data";
var bdaysCache = null; // Variabel penampung data di RAM (Cache)

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

// === FUNGSI BARU: Mengisi Cache dari Disk (Hanya dipanggil sekali) ===
function initCache() {
    if (bdaysCache === null) {
        loadData();
        var rawData = DiskApi.getVar(FILENAME, "players", null, false);
        bdaysCache = safeParse(rawData, {});
    }
}

// === FUNGSI BARU: Menyimpan isi Cache ke Disk ===
function saveCacheToDisk() {
    DiskApi.setVar(FILENAME, "players", JSON.stringify(bdaysCache), false);
    saveData();
}

function padTwo(n) {
    return n < 10 ? "0" + n : "" + n;
}

function setBirthday(uuid, playerName, dateString) {
    try {
        initCache(); // Pastikan cache sudah dimuat
        
        bdaysCache[uuid] = {
            name: playerName,
            date: dateString, // Format: "dd/mm"
            lastClaimedYear: 0
        };
        
        saveCacheToDisk(); // Simpan ke disk karena ini command admin (jarang dipakai)
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
    initCache(); 
    
    // Cek langsung dari RAM (Sangat Cepat!)
    if (!bdaysCache[uuid]) return false; 
    
    var data = bdaysCache[uuid];
    var now = new Date();
    var todayStr = padTwo(now.getDate()) + "/" + padTwo(now.getMonth() + 1);
    var currentYear = now.getFullYear();
    
    // Jika hari ini tanggal ulang tahunnya DAN belum klaim tahun ini
    if (data.date === todayStr && data.lastClaimedYear < currentYear) {
        giveGift(player);
        data.lastClaimedYear = currentYear;
        bdaysCache[uuid] = data; // Perbarui data di RAM
        
        return true; // Beri sinyal bahwa ada perubahan data yang perlu di-save
    }
    
    return false; // Tidak ada kado yang diberikan
}

function klaimHadiahManual(player) {
    var uuid = player.getUniqueId().toString();
    initCache();
    
    if (!bdaysCache[uuid]) {
        return { sukses: false, pesan: "§cData ulang tahunmu belum diatur oleh admin." };
    }
    
    var data = bdaysCache[uuid];
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
        bdaysCache[uuid] = data;
        
        saveCacheToDisk(); // Simpan ke disk secara instan karena dipicu command
        
        return { sukses: true, pesan: "§aBerhasil! Hadiah ulang tahunmu yang sempat terlewat telah diklaim." };
    } else {
        return { sukses: false, pesan: "§cUlang tahunmu belum tiba tahun ini! Jadwalmu: " + data.date };
    }
}

// === SISTEM LOOP OTOMATIS (OPTIMASI TPS) ===
var giftTaskId = null;

function mulaiScheduler() {
    initCache(); // Muat data ke RAM saat scheduler pertama kali dinyalakan
    
    var plugin = Bukkit.getPluginManager().getPlugin("OpenJS");
    var task = Bukkit.getScheduler().runTaskTimer(plugin, new java.lang.Runnable({
        run: function() {
            var onlinePlayers = Bukkit.getOnlinePlayers().iterator();
            var isDataChanged = false; // Penanda apakah ada perubahan data
            
            while (onlinePlayers.hasNext()) {
                var player = onlinePlayers.next();
                // Jika checkAndGiveGift mengembalikan 'true', berarti ada yang ulang tahun
                if (checkAndGiveGift(player)) {
                    isDataChanged = true;
                }
            }
            
            // Simpan ke disk HANYA JIKA ada player yang baru saja menerima kado di menit ini
            if (isDataChanged) {
                saveCacheToDisk();
            }
        }
    }), 0, 1200); // 1200 ticks = 1 menit
    giftTaskId = task.getTaskId();
}
mulaiScheduler();

task.bindToUnload(function() {
    if (giftTaskId !== null) {
        Bukkit.getScheduler().cancelTask(giftTaskId);
    }
    // Opsional: Simpan sisa data di memori ke disk sebelum skrip dimatikan
    if (bdaysCache !== null) {
        saveCacheToDisk();
    }
});

return {
    setBirthday: setBirthday,
    klaimHadiahManual: klaimHadiahManual
};

