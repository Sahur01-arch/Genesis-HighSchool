//!waitForInit
const Bukkit = importClass("org.bukkit.Bukkit");
const panel = Bukkit.getConsoleSender();
log.info("[System] Initializing startup sequence...");

// 1. Wait for required plugins
task.waitForPlugin("LuckPerms");
log.info("[System] Dependencies loaded.");

// 2. Perform loading in a dedicated thread to avoid blocking main thread
task.thread(function() {
    task.wait(1);

    // KONEKSI MYSQL PERTAMA KALI SEBELUM SCRIPT LAIN DIMUAT
    try {
        LoadScript("libs/libmysql.js");
        const MySQLInit = requireScript("libs/libmysql.js");
        MySQLInit.initTables();
        log.info("[System] MySQL module & tables initialized successfully.");
    } catch (e) {
        log.error("[System] Failed to load MySQL module: " + e);
    }
    
    // Beri jeda sejenak untuk memastikan tabel dan koneksi siap
    task.wait(1);

    const scriptsToLoad = [
        "libs/libluckperms.js",
        "libs/libkelas.js",
        "libs/libtugas.js",
        "libs/libeventschool.js",
        "libs/libreportcard.js",
        "libs/liborganisasi.js",
        "libs/absenhandler.js", // Absen dimuat SETELAH libextracurricular dan MySQL
        "libs/libcooperative.js",
        "libs/libgroup.js",
        "libs/libgift.js",
        "handler/kelasgui.js",
        "handler/absenhandler.js",
        "handler/command.js",
        "handler/store.js"
    ];

    var pending = scriptsToLoad.slice();
    var maxRetries = 3;
    var retryDelay = 20;

    for (var attempt = 0; attempt <= maxRetries && pending.length > 0; attempt++) {
        var stillFailed = [];

        for (var i = 0; i < pending.length; i++) {
            try {
                LoadScript(pending[i]);
            } catch (e) {
                stillFailed.push(pending[i]);
            }
        }

        pending = stillFailed;

        if (pending.length > 0 && attempt < maxRetries) {
            task.wait(retryDelay);
        }
    }
    
    log.info("[System] All scripts loading sequence complete.");
});

addCommand("startup", {
  onCommand: function(sender) {
    Bukkit.dispatchCommand(panel, "oj load main.js");
  }
});

task.bindToUnload(function() {
    log.info("[System] Unloading modules...");
    UnloadScript("handler/command.js");
    UnloadScript("handler/store.js");
    UnloadScript("libs/libgroup.js");
    UnloadScript("libs/libcooperative.js");
    UnloadScript("handler/absenhandler.js");
    UnloadScript("handler/kelasgui.js");
    UnloadScript("libs/liborganisasi.js");
    UnloadScript("libs/libreportcard.js");
    UnloadScript("libs/libeventschool.js");
    UnloadScript("libs/libtugas.js");
    UnloadScript("libs/libkelas.js");
    UnloadScript("libs/libluckperms.js");
    UnloadScript("libs/libgift.js");
    UnloadScript("libs/libmysql.js");
    log.info("[System] Cleanup complete.");
});
