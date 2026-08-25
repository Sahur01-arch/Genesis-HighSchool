//!loadmanually

const Bukkit = importClass("org.bukkit.Bukkit");
const Material = importClass("org.bukkit.Material");
const InventoryApi = Services.get("InventoryApi");

var PREFIX = "§8[§bServerStore§8] §r";
var PERM_ADMIN = "store.admin";
var DB_FILE = "store_database";

var adminSessions = {};
var GAMEPASS_FALLBACK_LIST = ["coal", "iron_ingot", "gold_ingot", "diamond", "netherite_ingot"];
var RANK_FALLBACK_LIST = ["netherite_ingot", "emerald", "nether_star"];

// Daftar hitam blok/item terlarang admin
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
    if (upper.indexOf("LEGACY_") !== -1) return true;
    return false;
}

function getSafeMaterialId(inputName, isRank) {
    if (!inputName) {
        inputName = isRank 
            ? RANK_FALLBACK_LIST[Math.floor(Math.random() * RANK_FALLBACK_LIST.length)] 
            : GAMEPASS_FALLBACK_LIST[Math.floor(Math.random() * GAMEPASS_FALLBACK_LIST.length)];
    }
    
    var clean = inputName.toUpperCase().trim();
    if (isBlacklisted(clean)) {
        clean = isRank ? "NETHER_STAR" : "DIAMOND";
    }
    
    var mat = Material.getMaterial(clean);
    if (!mat) {
        clean = isRank ? "NETHER_STAR" : "PAPER";
    }
    return clean.toLowerCase(); // Format ID Minecraft standar
}

// -----------------------------------------------------------------------------
// [1] DATABASE SYSTEM (STANDAR BARU)
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
    DiskApi.saveFile(DB_FILE, false, false); // Menghapus dari RAM
    DiskApi.loadFile(DB_FILE, false, false); // Load kembali ke RAM
}

// -----------------------------------------------------------------------------
// [2] BUKKIT UTILITIES & LUCKPERMS EXECUTION
// -----------------------------------------------------------------------------
function isPlayer(sender) {
    return typeof sender.hasPermission === "function" && sender.getName() !== "CONSOLE";
}

function executeLuckPerms(type, target, node, duration) {
    task.main(function() {
        var console = Bukkit.getConsoleSender();
        var cmd = "";
        
        if (type === "gamepass") {
            // Gamepass bisa node permission bebas atau group (menggunakan prefix group.nama_grup)
            if (duration === "perm" || duration === "permanent") {
                cmd = "lp user " + target + " permission set " + node + " true";
            } else {
                cmd = "lp user " + target + " permission settemp " + node + " true " + duration;
            }
        } else {
            // Rankbuy didedikasikan untuk parent add grup
            if (duration === "perm" || duration === "permanent") {
                cmd = "lp user " + target + " parent add " + node;
            } else {
                cmd = "lp user " + target + " parent addtemp " + node + " " + duration;
            }
        }
        Bukkit.dispatchCommand(console, cmd);
    });
}

// -----------------------------------------------------------------------------
// [3] GUI MENUS (MENGGUNAKAN INVENTORYAPI STANDAR BARU)
// -----------------------------------------------------------------------------
function openMainMenu(player) {
    var menu = InventoryApi.constructInventory("single", "§8§l🛒 Store Admin Panel");
    
    var gpItem = InventoryApi.createItem({ id: "minecraft:emerald", name: "§a§lKelola Gamepass", lore: ["§7Kelola daftar Gamepass server."] });
    var rankItem = InventoryApi.createItem({ id: "minecraft:diamond", name: "§b§lKelola Ranks", lore: ["§7Kelola daftar Ranks server."] });
    
    menu.setSlot(11, gpItem);
    menu.setSlot(15, rankItem);
    
    menu.onLeftClick(function(p, slot, event) {
        event.setCancelled(true);
        if (slot === 11) { menu.hide(p); openListMenu(p, "gamepass"); }
        if (slot === 15) { menu.hide(p); openListMenu(p, "rank"); }
    });
    
    menu.onClosed(function() { menu.destroy(); });
    menu.show(player);
}

function openListMenu(player, type) {
    var invName = type === "gamepass" ? "§a§lDaftar Gamepass" : "§b§lDaftar Ranks";
    var menu = InventoryApi.constructInventory("double", invName); 
    
    var db = getDB();
    var objData = type === "gamepass" ? db.gamepasses : db.ranks;
    var isRank = (type === "rank");
    
    var slot = 0;
    var keys = [];
    
    for (var key in objData) {
        if (Object.prototype.hasOwnProperty.call(objData, key)) {
            if (slot >= 53) break;
            var itemData = objData[key];
            var nodeVal = (typeof itemData === "object") ? itemData.node : itemData;
            var logoVal = (typeof itemData === "object") ? itemData.logo : (isRank ? "nether_star" : "coal");
            var mat = getSafeMaterialId(logoVal, isRank);
            
            var item = InventoryApi.createItem({
                id: "minecraft:" + mat,
                name: "§e§l" + key.toUpperCase(),
                lore: [
                    "§7Tipe: §f" + type,
                    "§7Target (Node/Group): §f" + nodeVal,
                    "§7Material: §e" + mat,
                    "",
                    "§a▶ Klik untuk berikan ke player!"
                ]
            });
            
            menu.setSlot(slot, item);
            keys[slot] = key;
            slot++;
        }
    }
    
    menu.onLeftClick(function(p, clickedSlot, event) {
        event.setCancelled(true);
        if (keys[clickedSlot]) {
            menu.hide(p);
            openDurationMenu(p, type, keys[clickedSlot], null);
        }
    });
    
    menu.onClosed(function() { menu.destroy(); });
    menu.show(player);
}

function openDurationMenu(player, type, itemKey, targetName) {
    var menu = InventoryApi.constructInventory("single", "§8§lBerikan: " + itemKey.toUpperCase());
    var displayTarget = targetName ? "§b" + targetName : "§cBelum Diatur (Klik buku)";
    
    var book = InventoryApi.createItem({
        id: "minecraft:written_book",
        name: "§e§lTarget Player",
        lore: [
            "§7Player Terpilih: " + displayTarget,
            "",
            "§a▶ Klik untuk mengetik nama player",
            "§a  secara manual di chat!"
        ]
    });
    
    menu.setSlot(4, book);
    menu.setSlot(11, InventoryApi.createItem({ id: "minecraft:iron_ingot", name: "§f§l7 Hari", lore: ["§7Berikan akses 7 hari."] }));
    menu.setSlot(13, InventoryApi.createItem({ id: "minecraft:gold_ingot", name: "§6§l30 Hari", lore: ["§7Berikan akses 30 hari."] }));
    menu.setSlot(15, InventoryApi.createItem({ id: "minecraft:nether_star", name: "§c§lPermanen", lore: ["§7Berikan akses permanen."] }));
    
    menu.onLeftClick(function(p, slot, event) {
        event.setCancelled(true);
        if (slot === 4) {
            menu.hide(p);
            adminSessions[p.getName()] = {
                type: type,
                itemKey: itemKey,
                state: "typing_target"
            };
            p.sendMessage(PREFIX + "§aSilahkan ketik §enama player target§a di chat!");
            p.sendMessage(PREFIX + "§7(Ketik 'cancel' untuk membatalkan)");
        } 
        else if (slot === 11 || slot === 13 || slot === 15) {
            if (!targetName) {
                p.sendMessage(PREFIX + "§cAnda harus mengatur Target Player terlebih dahulu!");
                return;
            }
            var duration = (slot === 11) ? "7d" : (slot === 13) ? "30d" : "perm";
            var db = getDB();
            var rawData = type === "gamepass" ? db.gamepasses[itemKey] : db.ranks[itemKey];
            
            if (rawData) {
                var node = (typeof rawData === "object") ? rawData.node : rawData;
                executeLuckPerms(type, targetName, node, duration);
                p.sendMessage(PREFIX + "§aBerhasil memproses " + itemKey.toUpperCase() + " kepada " + targetName + "!");
            }
            menu.hide(p);
        }
    });
    
    menu.onClosed(function() { menu.destroy(); });
    menu.show(player);
}

// -----------------------------------------------------------------------------
// [4] EVENT HANDLER (KHUSUS CHAT UNTUK TARGET PLAYER)
// -----------------------------------------------------------------------------
var chatListener = registerEvent("org.bukkit.event.player.AsyncPlayerChatEvent", function(event) {
    var player = event.getPlayer();
    var pName = player.getName();
    var session = adminSessions[pName];
    
    if (session && session.state === "typing_target") {
        event.setCancelled(true);
        var msg = event.getMessage().trim();
        
        if (msg.toLowerCase() === "cancel") {
            delete adminSessions[pName];
            player.sendMessage(PREFIX + "§cPemilihan dibatalkan.");
            return;
        }
        
        if (msg.indexOf(" ") !== -1) {
            player.sendMessage(PREFIX + "§cNama tidak boleh mengandung spasi!");
            return;
        }
        
        var type = session.type;
        var itemKey = session.itemKey;
        
        delete adminSessions[pName]; // Hapus state sebelum mengembalikan UI
        
        task.main(function() {
            openDurationMenu(player, type, itemKey, msg);
        });
    }
});

// -----------------------------------------------------------------------------
// [5] COMMAND REGISTRATION
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

    if (jsArgs.length === 0) {
        var cmdName = type === "rank" ? "rankbuy" : "gamepass";
        sender.sendMessage(PREFIX + "§cFormat: §e/" + cmdName + " <tambah|remove|set|list> ...");
        return;
    }

    var action = jsArgs[0].toLowerCase();
    
    // Command baru untuk melihat list langsung tanpa harus lewat GUI Utama Store Admin
    if (action === "list") {
        if (!isPlayer(sender)) {
            sender.sendMessage("§cHanya player yang bisa menggunakan UI ini.");
            return;
        }
        openListMenu(sender, type);
        return;
    }

    if (action === "tambah") {
        if (jsArgs.length < 3) {
            if (type === "gamepass") {
                sender.sendMessage(PREFIX + "§cFormat: §e/gamepass tambah <nama_item> <node_atau_group> [logo_item]");
                sender.sendMessage(PREFIX + "§7(Info: Gunakan format §fgroup.nama_grup§7 untuk membagikan Bundle/Grup)");
            } else {
                sender.sendMessage(PREFIX + "§cFormat: §e/rankbuy tambah <nama_item> <nama_grup> [logo_item]");
            }
            return;
        }
        
        var name = jsArgs[1].toLowerCase();
        var nodeVal = jsArgs[2]; 
        var logoVal = jsArgs[3] ? jsArgs[3].toLowerCase() : null;
        
        var finalLogo = getSafeMaterialId(logoVal, isRank);
        
        objData[name] = { node: nodeVal, logo: finalLogo };
        saveDB(db);
        sender.sendMessage(PREFIX + "§aData §e" + name + " §aberhasil ditambahkan dengan logo material §b" + finalLogo.toUpperCase() + "!");
    } 
    else if (action === "remove") {
        if (jsArgs.length < 2) {
            sender.sendMessage(PREFIX + "§cTentukan nama item untuk dihapus."); return;
        }
        var targetName = jsArgs[1].toLowerCase();
        
        if (objData[targetName]) {
            delete objData[targetName];
            saveDB(db);
            sender.sendMessage(PREFIX + "§aBerhasil dihapus dari sistem!");
        } else {
            sender.sendMessage(PREFIX + "§cItem tidak ditemukan.");
        }
    } 
    else if (action === "set") {
        if (jsArgs.length < 4) {
            sender.sendMessage(PREFIX + "§cFormat: §e/" + (type==="rank"?"rankbuy":type) + " set <nama_item> <player> <7d|30d|perm>"); return;
        }
        
        var setName = jsArgs[1].toLowerCase();
        var target = jsArgs[2];
        var durasi = jsArgs[3].toLowerCase();
        
        if (!objData[setName]) {
            sender.sendMessage(PREFIX + "§cItem tidak terdaftar di sistem."); return;
        }
        
        var rawData = objData[setName];
        var setNodeVal = (typeof rawData === "object") ? rawData.node : rawData;
        
        executeLuckPerms(type, target, setNodeVal, durasi);
        sender.sendMessage(PREFIX + "§aSukses memberikan §e" + setName + " §akepada §b" + target);
    } 
    else {
        sender.sendMessage(PREFIX + "§cAksi tidak dikenal. Gunakan: tambah, remove, set, list");
    }
}

function handleTabComplete(sender, args, type) {
    var jsArgs = toArray(args);
    var suggestions = [];
    var db = getDB();
    var objData = type === "gamepass" ? db.gamepasses : db.ranks;

    if (jsArgs.length === 1) {
        suggestions = ["tambah", "remove", "set", "list"];
    } else if (jsArgs.length === 2) {
        for (var key in objData) {
            if (Object.prototype.hasOwnProperty.call(objData, key)) {
                suggestions.push(key);
            }
        }
    } else if (jsArgs.length === 3) {
        var action = jsArgs[0].toLowerCase();
        if (action === "tambah") {
            var allMats = Material.values();
            for (var i = 0; i < allMats.length; i++) {
                var matName = allMats[i].name().toLowerCase();
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
        var actionCheck = jsArgs[0].toLowerCase();
        if (actionCheck === "set") {
            suggestions = ["7d", "30d", "perm"];
        }
    }

    var currentInput = jsArgs[jsArgs.length - 1].toLowerCase();
    var filtered = [];
    for (var j = 0; j < suggestions.length; j++) {
        if (filtered.length >= 80) break;
        if (suggestions[j].toLowerCase().indexOf(currentInput) === 0) {
            filtered.push(suggestions[j]);
        }
    }

    return toJavaList(filtered);
}

addCommand("gamepass", {
    onCommand: function(sender, args) { handleStoreCommand(sender, toArray(args), "gamepass"); },
    onTabComplete: function(sender, args) { return handleTabComplete(sender, args, "gamepass"); }
}, PERM_ADMIN);

addCommand("rankbuy", {
    onCommand: function(sender, args) { handleStoreCommand(sender, toArray(args), "rank"); }, // Flag as 'rank' internal
    onTabComplete: function(sender, args) { return handleTabComplete(sender, args, "rank"); }
}, PERM_ADMIN);

// -----------------------------------------------------------------------------
// [6] CLEANUP
// -----------------------------------------------------------------------------
task.bindToUnload(function() {
    // InventoryApi sudah menghandle GUI tanpa butuh listener native, 
    // jadi kita hanya cukup melepas chatListener
    unregisterEvent(chatListener);
    log.info("[StoreSystem] Script dinonaktifkan dengan aman.");
});

