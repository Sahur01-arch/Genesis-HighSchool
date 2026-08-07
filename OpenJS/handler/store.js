//!loadmanually

const Bukkit = importClass("org.bukkit.Bukkit");
const Material = importClass("org.bukkit.Material");
const ItemStack = importClass("org.bukkit.inventory.ItemStack");
const ChatColor = importClass("org.bukkit.ChatColor");
const Player = importClass("org.bukkit.entity.Player");

var PREFIX = "§8[§bServerStore§8] §r";
var PERM_ADMIN = "store.admin";
var DB_FILE = "store_database";

var adminSessions = {};
var GAMEPASS_FALLBACK_LIST = ["coal", "iron_ingot", "gold_ingot", "diamond", "netherite_ingot"];
var RANK_FALLBACK_LIST = ["netherite_ingot", "emerald", "nether_star"];

// Daftar hitam blok/item terlarang admin (format resmi Minecraft)
var BLACKLISTED_MATERIALS = [
    "BARRIER", "COMMAND_BLOCK", "CHAIN_COMMAND_BLOCK", "REPEATING_COMMAND_BLOCK",
    "COMMAND_BLOCK_MINECART", "STRUCTURE_BLOCK", "STRUCTURE_VOID", "JIGSAW", "BEDROCK",
    "SPAWNER", "DEBUG_STICK", "LAVA_BUCKET", "WATER_BUCKET", "POTION", "SPLASH_POTION", "LINGERING_POTION"
];

function isBlacklisted(matName) {
    var upper = matName.toUpperCase();
    for (var i = 0; i < BLACKLISTED_MATERIALS.length; i++) {
        if (BLACKLISTED_MATERIALS[i] === upper) return true;
    }
    // Blokir juga item yang berupa legacy atau tidak bisa ditaruh item stack bersih
    if (upper.indexOf("LEGACY_") !== -1) return true;
    return false;
}

function resolveMaterial(inputName, isRank) {
    if (!inputName) {
        if (isRank) {
            var randIdx = Math.floor(Math.random() * RANK_FALLBACK_LIST.length);
            inputName = RANK_FALLBACK_LIST[randIdx];
        } else {
            var randIdx2 = Math.floor(Math.random() * GAMEPASS_FALLBACK_LIST.length);
            inputName = GAMEPASS_FALLBACK_LIST[randIdx2];
        }
    }
    
    var clean = inputName.toUpperCase().trim();
    if (isBlacklisted(clean)) {
        clean = isRank ? "NETHER_STAR" : "DIAMOND";
    }
    
    var mat = Material.getMaterial(clean);
    if (!mat) {
        mat = Material.getMaterial(isRank ? "NETHER_STAR" : "PAPER");
        if (!mat) mat = Material.PAPER;
    }
    return mat;
}

// -----------------------------------------------------------------------------
// [1] DATABASE SYSTEM
// -----------------------------------------------------------------------------
function getDB() {
    DiskApi.loadFile(DB_FILE, false, false);
    var data = DiskApi.getVar(DB_FILE, "data", null, false);
    
    if (!data) {
        data = { gamepasses: {}, ranks: {} };
        DiskApi.setVar(DB_FILE, "data", data, false);
        DiskApi.saveFile(DB_FILE, false, false);
        DiskApi.loadFile(DB_FILE, false, false);
    }
    return data;
}

function saveDB(dataObj) {
    DiskApi.loadFile(DB_FILE, false, false);
    DiskApi.setVar(DB_FILE, "data", dataObj, false);
    DiskApi.saveFile(DB_FILE, false, false);
    DiskApi.loadFile(DB_FILE, false, false);
}

// -----------------------------------------------------------------------------
// [2] BUKKIT UTILITIES & SENDER CHECK
// -----------------------------------------------------------------------------
function color(text) {
    return ChatColor.translateAlternateColorCodes('&', text);
}

function isPlayer(sender) {
    return sender instanceof Player;
}

function executeLuckPerms(type, target, node, duration) {
    task.main(function() {
        var console = Bukkit.getConsoleSender();
        var cmd = "";
        
        if (type === "gamepass") {
            if (duration === "perm" || duration === "permanent") {
                cmd = "lp user " + target + " permission set " + node + " true";
            } else {
                cmd = "lp user " + target + " permission settemp " + node + " true " + duration;
            }
        } else {
            if (duration === "perm" || duration === "permanent") {
                cmd = "lp user " + target + " parent add " + node;
            } else {
                cmd = "lp user " + target + " parent addtemp " + node + " " + duration;
            }
        }
        Bukkit.dispatchCommand(console, cmd);
    });
}

function createCustomItem(mat, name, loreArray) {
    if (!mat) mat = Material.PAPER;
    var item = new ItemStack(mat);
    var meta = item.getItemMeta();
    meta.setDisplayName(color(name));
    
    if (loreArray && loreArray.length > 0) {
        var loreList = new java.util.ArrayList();
        for (var i = 0; i < loreArray.length; i++) {
            loreList.add(color(loreArray[i]));
        }
        meta.setLore(loreList);
    }
    item.setItemMeta(meta);
    return item;
}

// -----------------------------------------------------------------------------
// [3] GUI MENUS
// -----------------------------------------------------------------------------
function openMainMenu(player) {
    var inv = Bukkit.createInventory(null, 27, color("&8&l🛒 Store Admin Panel"));
    inv.setItem(11, createCustomItem(Material.EMERALD, "&a&lKelola Gamepass", ["&7Kelola daftar Gamepass server."]));
    inv.setItem(15, createCustomItem(Material.DIAMOND, "&b&lKelola Ranks", ["&7Kelola daftar Ranks server."]));
    player.openInventory(inv);
}

function openListMenu(player, type) {
    var invName = type === "gamepass" ? "&a&lDaftar Gamepass" : "&b&lDaftar Ranks";
    var inv = Bukkit.createInventory(null, 54, color(invName));
    
    var db = getDB();
    var objData = type === "gamepass" ? db.gamepasses : db.ranks;
    var isRank = (type === "rank");
    
    var slot = 0;
    for (var key in objData) {
        if (Object.prototype.hasOwnProperty.call(objData, key)) {
            if (slot >= 53) break;
            var itemData = objData[key];
            var nodeVal = (typeof itemData === "object") ? itemData.node : itemData;
            var logoVal = (typeof itemData === "object") ? itemData.logo : (isRank ? "nether_star" : "coal");
            var mat = resolveMaterial(logoVal, isRank);
            
            inv.setItem(slot, createCustomItem(mat, "&e&l" + key.toUpperCase(), [
                "&7Tipe: &f" + type,
                "&7Target (Node/Group): &f" + nodeVal,
                "&7Material: &e" + logoVal.toLowerCase(),
                "",
                "&a▶ Klik untuk berikan ke player!"
            ]));
            slot++;
        }
    }
    player.openInventory(inv);
}

function openDurationMenu(player) {
    var session = adminSessions[player.getName()];
    if (!session) return;
    
    var targetName = session.target ? "&b" + session.target : "&cBelum Diatur (Klik buku)";
    var inv = Bukkit.createInventory(null, 27, color("&8&lBerikan: " + session.itemKey.toUpperCase()));
    
    inv.setItem(4, createCustomItem(Material.WRITTEN_BOOK, "&e&lTarget Player", [
        "&7Player Terpilih: " + targetName,
        "",
        "&a▶ Klik untuk mengetik nama player",
        "&a  secara manual di chat!"
    ]));
    
    inv.setItem(11, createCustomItem(Material.IRON_INGOT, "&f&l7 Hari (1 Minggu)", ["&7Berikan akses 7 hari."]));
    inv.setItem(13, createCustomItem(Material.GOLD_INGOT, "&6&l30 Hari (1 Bulan)", ["&7Berikan akses 30 hari."]));
    inv.setItem(15, createCustomItem(Material.NETHER_STAR, "&c&lPermanen", ["&7Berikan akses permanen."]));
    
    player.openInventory(inv);
}

// -----------------------------------------------------------------------------
// [4] EVENT HANDLERS
// -----------------------------------------------------------------------------
var invListener = registerEvent("org.bukkit.event.inventory.InventoryClickEvent", function(event) {
    var title = ChatColor.stripColor(event.getView().getTitle());
    
    if (title.indexOf("Store Admin") === -1 && title.indexOf("Daftar Gamepass") === -1 && title.indexOf("Daftar Ranks") === -1 && title.indexOf("Berikan: ") === -1) {
        return;
    }
    
    event.setCancelled(true);
    var player = event.getWhoClicked();
    if (!isPlayer(player)) return;
    
    var clickedItem = event.getCurrentItem();
    if (!clickedItem || clickedItem.getType() === Material.AIR) return;
    
    var itemName = ChatColor.stripColor(clickedItem.getItemMeta().getDisplayName());
    
    if (title.indexOf("Store Admin") !== -1) {
        if (itemName.indexOf("Kelola Gamepass") !== -1) openListMenu(player, "gamepass");
        if (itemName.indexOf("Kelola Ranks") !== -1) openListMenu(player, "rank");
        return;
    }
    
    if (title.indexOf("Daftar Gamepass") !== -1 || title.indexOf("Daftar Ranks") !== -1) {
        var type = title.indexOf("Gamepass") !== -1 ? "gamepass" : "rank";
        var key = itemName.toLowerCase();
        
        adminSessions[player.getName()] = {
            type: type,
            itemKey: key,
            target: null,
            state: "selecting_duration"
        };
        openDurationMenu(player);
        return;
    }
    
    if (title.indexOf("Berikan: ") !== -1) {
        var session = adminSessions[player.getName()];
        if (!session) return;
        
        if (itemName.indexOf("Target Player") !== -1) {
            session.state = "typing_target";
            player.closeInventory();
            player.sendMessage(PREFIX + "§aSilahkan ketik §enama player target§a di chat!");
            player.sendMessage(PREFIX + "§7(Ketik 'cancel' untuk membatalkan)");
            return;
        }
        
        if (!session.target) {
            player.sendMessage(PREFIX + "§cAnda harus mengatur Target Player terlebih dahulu!");
            return;
        }
        
        var duration = "";
        if (itemName.indexOf("7 Hari") !== -1) duration = "7d";
        else if (itemName.indexOf("30 Hari") !== -1) duration = "30d";
        else if (itemName.indexOf("Permanen") !== -1) duration = "perm";
        else return;
        
        var db = getDB();
        var rawData = session.type === "gamepass" ? db.gamepasses[session.itemKey] : db.ranks[session.itemKey];
        var node = (typeof rawData === "object") ? rawData.node : rawData;
        
        executeLuckPerms(session.type, session.target, node, duration);
        player.sendMessage(PREFIX + "§aBerhasil memproses " + session.itemKey.toUpperCase() + " kepada " + session.target + "!");
        player.closeInventory();
        delete adminSessions[player.getName()];
    }
});

var chatListener = registerEvent("org.bukkit.event.player.AsyncPlayerChatEvent", function(event) {
    var player = event.getPlayer();
    var session = adminSessions[player.getName()];
    
    if (session && session.state === "typing_target") {
        event.setCancelled(true);
        var msg = event.getMessage().trim();
        
        if (msg.toLowerCase() === "cancel") {
            delete adminSessions[player.getName()];
            player.sendMessage(PREFIX + "§cPemilihan dibatalkan.");
            return;
        }
        
        if (msg.indexOf(" ") !== -1) {
            player.sendMessage(PREFIX + "§cNama tidak boleh mengandung spasi!");
            return;
        }
        
        session.target = msg;
        session.state = "selecting_duration";
        
        task.main(function() {
            openDurationMenu(player);
        });
    }
});

// -----------------------------------------------------------------------------
// [5] COMMAND REGISTRATION DENGAN DYNAMIC BUKKIT ITEM TABCOMPLETE
// -----------------------------------------------------------------------------
addCommand("storeadmin", {
    onCommand: function(sender, args) {
        if (!sender.hasPermission(PERM_ADMIN)) {
            sender.sendMessage(PREFIX + "§cAnda tidak memiliki akses.");
            return;
        }
        if (!isPlayer(sender)) {
            sender.sendMessage("§cCommand /storeadmin khusus untuk Player di dalam game.");
            return;
        }
        openMainMenu(sender);
    }
}, PERM_ADMIN);

function handleStoreCommand(sender, jsArgs, type) {
    if (!sender.hasPermission(PERM_ADMIN)) {
        sender.sendMessage(PREFIX + "§cNo permission."); return;
    }
    
    var db = getDB();
    var objData = type === "gamepass" ? db.gamepasses : db.ranks;
    var isRank = (type === "rank");

    if (jsArgs.length < 2) {
        sender.sendMessage(PREFIX + "§cFormat: §e/" + type + " <tambah|remove|set> <nama> [node/player] [material/durasi] [durasi]");
        return;
    }

    var action = jsArgs[0].toLowerCase();
    var name = jsArgs[1].toLowerCase();

    if (action === "tambah") {
        if (jsArgs.length < 3) {
            sender.sendMessage(PREFIX + "§cTentukan node permission/group!"); return;
        }
        var nodeVal = jsArgs[2];
        var logoVal = jsArgs[3] ? jsArgs[3].toLowerCase() : null;
        
        var finalLogo = "";
        if (logoVal) {
            if (isBlacklisted(logoVal) || !Material.getMaterial(logoVal.toUpperCase())) {
                finalLogo = isRank ? "nether_star" : "diamond";
                sender.sendMessage(PREFIX + "§cItem tersebut dilarang atau tidak valid! Menggunakan logo fallback.");
            } else {
                finalLogo = logoVal;
            }
        } else {
            if (isRank) {
                var randIdx = Math.floor(Math.random() * RANK_FALLBACK_LIST.length);
                finalLogo = RANK_FALLBACK_LIST[randIdx];
            } else {
                var randIdx2 = Math.floor(Math.random() * GAMEPASS_FALLBACK_LIST.length);
                finalLogo = GAMEPASS_FALLBACK_LIST[randIdx2];
            }
            sender.sendMessage(PREFIX + "§7Logo material tidak diisi, sistem menggunakan fallback: §e" + finalLogo);
        }
        
        objData[name] = { node: nodeVal, logo: finalLogo };
        saveDB(db);
        sender.sendMessage(PREFIX + "§a" + type + " §e" + name + " §aberhasil ditambahkan dengan material §b" + finalLogo.toUpperCase() + "!");
    } 
    else if (action === "remove") {
        if (objData[name]) {
            delete objData[name];
            saveDB(db);
            sender.sendMessage(PREFIX + "§a" + type + " §e" + name + " §aberhasil dihapus!");
        } else {
            sender.sendMessage(PREFIX + "§cItem tidak ditemukan dalam database.");
        }
    } 
    else if (action === "set") {
        if (jsArgs.length < 4) {
            sender.sendMessage(PREFIX + "§cFormat: §e/" + type + " set <nama_item> <player> <7d|30d|perm>"); return;
        }
        var target = jsArgs[2];
        var durasi = jsArgs[3].toLowerCase();
        
        if (!objData[name]) {
            sender.sendMessage(PREFIX + "§cItem tidak terdaftar di sistem."); return;
        }
        
        var rawData = objData[name];
        var nodeVal = (typeof rawData === "object") ? rawData.node : rawData;
        
        executeLuckPerms(type, target, nodeVal, durasi);
        sender.sendMessage(PREFIX + "§aSukses memberikan §e" + name + " §akepada §b" + target);
    } else {
        sender.sendMessage(PREFIX + "§cAksi tidak dikenal. Gunakan: tambah, remove, atau set");
    }
}

function handleTabComplete(sender, args, type) {
    var jsArgs = toArray(args);
    var suggestions = [];
    var db = getDB();
    var objData = type === "gamepass" ? db.gamepasses : db.ranks;

    if (jsArgs.length === 1) {
        suggestions = ["tambah", "remove", "set"];
    } else if (jsArgs.length === 2) {
        for (var key in objData) {
            if (Object.prototype.hasOwnProperty.call(objData, key)) {
                suggestions.push(key);
            }
        }
    } else if (jsArgs.length === 3) {
        var action = jsArgs[0].toLowerCase();
        if (action === "tambah") {
            // Ambil SEMUA material resmi dari class Bukkit Material secara dinamis
            var allMats = Material.values();
            for (var i = 0; i < allMats.length; i++) {
                var matName = allMats[i].name().toLowerCase();
                // Hanya masukkan yang bisa dipakai item stack biasa dan tidak di-blacklist
                if (allMats[i].isItem() && !isBlacklisted(matName)) {
                    suggestions.push(matName);
                }
            }
        } else if (action === "set") {
            var onlinePlayers = Bukkit.getOnlinePlayers();
            var iterator = onlinePlayers.iterator();
            while (iterator.hasNext()) {
                suggestions.push(iterator.next().getName());
            }
        }
    } else if (jsArgs.length === 4) {
        var action = jsArgs[0].toLowerCase();
        if (action === "set") {
            suggestions = ["7d", "30d", "perm"];
        }
    }

    var currentInput = jsArgs[jsArgs.length - 1].toLowerCase();
    var filtered = [];
    for (var i = 0; i < suggestions.length; i++) {
        // Batasi maksimal 80 saran agar tidak membebani buffer network packet client Minecraft
        if (filtered.length >= 80) break;
        if (suggestions[i].toLowerCase().indexOf(currentInput) === 0) {
            filtered.push(suggestions[i]);
        }
    }

    return toJavaList(filtered);
}

addCommand("gamepass", {
    onCommand: function(sender, args) { handleStoreCommand(sender, toArray(args), "gamepass"); },
    onTabComplete: function(sender, args) { return handleTabComplete(sender, args, "gamepass"); }
}, PERM_ADMIN);

addCommand("rankbuy", {
    onCommand: function(sender, args) { handleStoreCommand(sender, toArray(args), "rankbuy"); },
    onTabComplete: function(sender, args) { return handleTabComplete(sender, args, "rankbuy"); }
}, PERM_ADMIN);

// -----------------------------------------------------------------------------
// [6] CLEANUP SAAT UNLOAD
// -----------------------------------------------------------------------------
task.bindToUnload(function() {
    unregisterEvent(invListener);
    unregisterEvent(chatListener);
    log.info("[StoreSystem] Event listeners berhasil dibersihkan dengan aman.");
});
