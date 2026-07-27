//!loadmanually

const Bukkit = importClass("org.bukkit.Bukkit");
const LuckPermsProvider = importClass("net.luckperms.api.LuckPermsProvider");

task.waitForPlugin("LuckPerms");

function getLuckPerms() {
    return LuckPermsProvider.get();
}

function createGroup(name, weight) {
    if (!name) return { sukses: false, pesan: "Nama group tidak boleh kosong." };

    try {
        var lp = getLuckPerms();
        var existing = lp.getGroupManager().getGroup(name);
        if (existing) return { sukses: false, pesan: "Group '" + name + "' sudah ada." };

        task.main(function() {
            var console = Bukkit.getConsoleSender();
            Bukkit.dispatchCommand(console, "lp creategroup " + name);
            if (weight) {
                Bukkit.dispatchCommand(console, "lp group " + name + " setweight " + weight);
            }
        });

        log.info("[libgroup] Group '" + name + "' dibuat dengan weight " + (weight || 0));
        return { sukses: true, pesan: "Group '" + name + "' berhasil dibuat." };
    } catch (e) {
        log.error("[libgroup] Error createGroup: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat membuat group." };
    }
}

function deleteGroup(name) {
    if (!name) return { sukses: false, pesan: "Nama group tidak boleh kosong." };

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(name);
        if (!group) return { sukses: false, pesan: "Group '" + name + "' tidak ditemukan." };

        task.main(function() {
            var console = Bukkit.getConsoleSender();
            Bukkit.dispatchCommand(console, "lp deletegroup " + name);
        });

        log.info("[libgroup] Group '" + name + "' dihapus.");
        return { sukses: true, pesan: "Group '" + name + "' berhasil dihapus." };
    } catch (e) {
        log.error("[libgroup] Error deleteGroup: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus group." };
    }
}

function getGroupInfo(name) {
    if (!name) return null;

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(name);
        if (!group) return null;

        var nodes = group.getNodes();
        var permissions = [];
        var prefix = "";

        var iterator = nodes.iterator();
        while (iterator.hasNext()) {
            var node = iterator.next();
            var key = node.getKey();
            if (key.indexOf("prefix.") === 0) {
                prefix = key.substring(7);
            } else if (key.indexOf("meta.") === 0) {
                permissions.push(key);
            }
        }

        return {
            name: group.getName(),
            weight: group.getWeight() || 0,
            permissions: permissions,
            prefix: prefix
        };
    } catch (e) {
        log.error("[libgroup] Error getGroupInfo: " + e);
        return null;
    }
}

function listGroups() {
    try {
        var lp = getLuckPerms();
        var groups = lp.getGroupManager().getLoadedGroups();
        var result = [];
        var iterator = groups.iterator();
        while (iterator.hasNext()) {
            var group = iterator.next();
            result.push({
                name: group.getName(),
                weight: group.getWeight() || 0
            });
        }
        result.sort(function(a, b) { return b.weight - a.weight; });
        return result;
    } catch (e) {
        log.error("[libgroup] Error listGroups: " + e);
        return [];
    }
}

function setGroupWeight(name, weight) {
    if (!name || weight === undefined) return { sukses: false, pesan: "Data tidak lengkap." };

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(name);
        if (!group) return { sukses: false, pesan: "Group '" + name + "' tidak ditemukan." };

        task.main(function() {
            var console = Bukkit.getConsoleSender();
            Bukkit.dispatchCommand(console, "lp group " + name + " setweight " + weight);
        });

        return { sukses: true, pesan: "Weight group '" + name + "' diatur ke " + weight + "." };
    } catch (e) {
        log.error("[libgroup] Error setGroupWeight: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat mengatur weight." };
    }
}

function assignPlayer(playerName, groupName) {
    if (!playerName || !groupName) return { sukses: false, pesan: "Data tidak lengkap." };

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(groupName);
        if (!group) return { sukses: false, pesan: "Group '" + groupName + "' tidak ditemukan." };

        task.main(function() {
            var console = Bukkit.getConsoleSender();
            Bukkit.dispatchCommand(console, "lp user " + playerName + " parent add " + groupName);
        });

        log.info("[libgroup] " + playerName + " ditambahkan ke group " + groupName);
        return { sukses: true, pesan: playerName + " berhasil ditambahkan ke group " + groupName + "." };
    } catch (e) {
        log.error("[libgroup] Error assignPlayer: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menambahkan player." };
    }
}

function removePlayer(playerName, groupName) {
    if (!playerName || !groupName) return { sukses: false, pesan: "Data tidak lengkap." };

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(groupName);
        if (!group) return { sukses: false, pesan: "Group '" + groupName + "' tidak ditemukan." };

        task.main(function() {
            var console = Bukkit.getConsoleSender();
            Bukkit.dispatchCommand(console, "lp user " + playerName + " parent remove " + groupName);
        });

        log.info("[libgroup] " + playerName + " dihapus dari group " + groupName);
        return { sukses: true, pesan: playerName + " berhasil dihapus dari group " + groupName + "." };
    } catch (e) {
        log.error("[libgroup] Error removePlayer: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus player." };
    }
}

function getGroupMembers(groupName) {
    if (!groupName) return [];

    try {
        var lp = getLuckPerms();
        var group = lp.getGroupManager().getGroup(groupName);
        if (!group) return [];

        var users = lp.getUserManager().getUsers();
        var members = [];
        var iterator = users.iterator();
        while (iterator.hasNext()) {
            var user = iterator.next();
            var nodes = user.getNodes();
            var nodeIterator = nodes.iterator();
            while (nodeIterator.hasNext()) {
                var node = nodeIterator.next();
                if (node.getType().toString() === "INHERITANCE" && node.getGroupName() === groupName) {
                    members.push({ name: user.getName(), uuid: user.getUniqueId().toString() });
                    break;
                }
            }
        }
        return members;
    } catch (e) {
        log.error("[libgroup] Error getGroupMembers: " + e);
        return [];
    }
}

function getPlayerGroups(playerName) {
    if (!playerName) return [];

    try {
        var lp = getLuckPerms();
        var user = lp.getUserManager().getUser(playerName);
        if (!user) return [];

        var groups = [];
        var nodes = user.getNodes();
        var iterator = nodes.iterator();
        while (iterator.hasNext()) {
            var node = iterator.next();
            if (node.getType().toString() === "INHERITANCE") {
                groups.push(node.getGroupName());
            }
        }
        return groups;
    } catch (e) {
        log.error("[libgroup] Error getPlayerGroups: " + e);
        return [];
    }
}

return {
    createGroup: createGroup,
    deleteGroup: deleteGroup,
    getGroupInfo: getGroupInfo,
    listGroups: listGroups,
    setGroupWeight: setGroupWeight,
    assignPlayer: assignPlayer,
    removePlayer: removePlayer,
    getGroupMembers: getGroupMembers,
    getPlayerGroups: getPlayerGroups
};
