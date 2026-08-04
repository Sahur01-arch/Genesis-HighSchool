//!waitForInit
const Bukkit = importClass("org.bukkit.Bukkit");
const panel = Bukkit.getConsoleSender();
log.info("[System] Initializing startup sequence...");

// 1. Wait for required plugins
task.waitForPlugin("LuckPerms");
log.info("[System] Dependencies loaded.");

// 2. Perform loading in a dedicated thread to avoid blocking main thread
task.thread(function() {
    task.wait(1); // ADDED: Delay to allow initialization to finish

    const scriptsToLoad = [
        "libs/libluckperms.js",
        "libs/libkelas.js",
        "libs/libtugas.js",
        "libs/libclass.js",
        "libs/libeventschool.js",
        "libs/libreportcard.js",
        "libs/liborganisasi.js",
        "libs/libextracurricular.js",
        "libs/libcooperative.js",
        "libs/libgroup.js",
        "handler/command.js"
    ];

    var maxRetries = 2;
    var retryDelay = 10;

    for (var attempt = 0; attempt <= maxRetries; attempt++) {
        var hasError = false;

        if (attempt > 0) {
            log.info("[System] Retry attempt " + attempt + "/" + maxRetries + " in " + retryDelay + " seconds...");
            task.wait(retryDelay);
        }

        log.info("[System] Starting module loading (attempt " + (attempt + 1) + ")...");

        for (var i = 0; i < scriptsToLoad.length; i++) {
            var scriptPath = scriptsToLoad[i];
            try {
                LoadScript(scriptPath);
                log.info("[System] Successfully loaded: " + scriptPath);
            } catch (e) {
                log.error("[System] Failed to load " + scriptPath + ": " + e);
                hasError = true;
            }
        }

        if (!hasError) {
            log.info("[System] All modules initialized successfully.");
            break;
        }

        if (attempt === maxRetries) {
            log.error("[System] Failed to initialize after " + (maxRetries + 1) + " attempts. Giving up.");
        }
    }
});

addCommand("startup", {
  onCommand: function(sender) {
    Bukkit.dispatchCommand(panel, "oj load main.js")
  }
});

task.bindToUnload(function() {
    log.info("[System] Unloading modules...");
    // Unload in reverse order
    UnloadScript("handler/command.js");
    UnloadScript("libs/libgroup.js");
    UnloadScript("libs/libcooperative.js");
    UnloadScript("libs/libextracurricular.js");
    UnloadScript("libs/liborganisasi.js");
    UnloadScript("libs/libreportcard.js");
    UnloadScript("libs/libeventschool.js");
    UnloadScript("libs/libclass.js");
    UnloadScript("libs/libtugas.js");
    UnloadScript("libs/libkelas.js");
    UnloadScript("libs/libluckperms.js");
    log.info("[System] Cleanup complete.");
});
