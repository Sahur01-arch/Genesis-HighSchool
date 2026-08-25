//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit")

function setPrefix(groupName, prefixText) {
  const safeText = prefixText.replace(/"/g, "");
  log.info("DEBUG cmd = " + 'lp group ' + groupName + ' meta setprefix "' + safeText + '"');

  task.main(function() {
    try {
      const console = Bukkit.getConsoleSender();
      Bukkit.dispatchCommand(console, 'lp group ' + groupName + ' meta setprefix "' + safeText + '"');
    } catch (e) {
      log.error("Gagal menetapkan prefix untuk " + groupName + ": " + e);
    }
  });
}

function removePrefix(groupName) {
  task.main(function() {
    try {
      const console = Bukkit.getConsoleSender();
      Bukkit.dispatchCommand(console, 'lp group ' + groupName + ' meta setprefix ""');
    } catch (e) {
      log.error("Gagal menghapus prefix untuk " + groupName + ": " + e);
    }
  });
}

function assignGroup(playerName, groupName) {
  task.main(function() {
    try {
      const console = Bukkit.getConsoleSender();
      Bukkit.dispatchCommand(console, 'lp user ' + playerName + ' parent add ' + groupName);
      log.info("Berhasil menambahkan " + playerName + " ke grup " + groupName);
    } catch (e) {
      log.error("Gagal menambahkan " + playerName + " ke grup " + groupName + ": " + e);
    }
  });
}

return {
  setPrefix: setPrefix,
  removePrefix: removePrefix,
  assignGroup: assignGroup
};
