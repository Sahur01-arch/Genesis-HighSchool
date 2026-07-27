//!loadmanually

var FILENAME_BALANCE = "koperasi_balance";
var FILENAME_MENU = "koperasi_menu";
var FILENAME_LOG = "koperasi_log";

function loadAll() {
    DiskApi.loadFile(FILENAME_BALANCE, false, false);
    DiskApi.loadFile(FILENAME_MENU, false, false);
    DiskApi.loadFile(FILENAME_LOG, false, false);
}

function saveAll() {
    DiskApi.saveFile(FILENAME_BALANCE, false, false);
    DiskApi.saveFile(FILENAME_MENU, false, false);
    DiskApi.saveFile(FILENAME_LOG, false, false);
}

function padTwo(n) {
    return n < 10 ? "0" + n : "" + n;
}

function formatTanggal() {
    var now = new Date();
    return now.getFullYear() + "-" + padTwo(now.getMonth() + 1) + "-" + padTwo(now.getDate()) + " " + padTwo(now.getHours()) + ":" + padTwo(now.getMinutes()) + ":" + padTwo(now.getSeconds());
}

function getBalance(uuid) {
    loadAll();
    var raw = DiskApi.getVar(FILENAME_BALANCE, uuid, null, false);
    if (raw === null || raw === undefined) return 0;
    return parseInt(raw) || 0;
}

function setBalance(uuid, amount) {
    try {
        loadAll();
        DiskApi.setVar(FILENAME_BALANCE, uuid, amount, false);
        saveAll();
        return { sukses: true, pesan: "Saldo berhasil diatur." };
    } catch (e) {
        log.error("[libcooperative] Error setBalance: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat mengatur saldo." };
    }
}

function deposit(uuid, playerName, amount) {
    if (!amount || amount <= 0) {
        return { sukses: false, pesan: "Jumlah deposit harus lebih dari 0." };
    }

    try {
        loadAll();
        var current = getBalance(uuid);
        var newBalance = current + amount;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var rawLogs = DiskApi.getVar(FILENAME_LOG, "transactions", null, false);
        var logs = rawLogs ? JSON.parse(rawLogs) : [];
        logs.push({
            type: "DEPOSIT",
            player: playerName,
            uuid: uuid,
            amount: amount,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", JSON.stringify(logs), false);
        saveAll();

        log.info("[libcooperative] " + playerName + " deposit " + amount + ". Saldo: " + newBalance);
        return { sukses: true, pesan: "Berhasil deposit " + amount + ". Saldo sekarang: " + newBalance };
    } catch (e) {
        log.error("[libcooperative] Error deposit: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat deposit." };
    }
}

function withdraw(uuid, playerName, amount) {
    if (!amount || amount <= 0) {
        return { sukses: false, pesan: "Jumlah penarikan harus lebih dari 0." };
    }

    try {
        loadAll();
        var current = getBalance(uuid);

        if (current < amount) {
            return { sukses: false, pesan: "Saldo tidak mencukupi. Saldo kamu: " + current };
        }

        var newBalance = current - amount;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var rawLogs = DiskApi.getVar(FILENAME_LOG, "transactions", null, false);
        var logs = rawLogs ? JSON.parse(rawLogs) : [];
        logs.push({
            type: "WITHDRAW",
            player: playerName,
            uuid: uuid,
            amount: amount,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", JSON.stringify(logs), false);
        saveAll();

        log.info("[libcooperative] " + playerName + " tarik " + amount + ". Saldo: " + newBalance);
        return { sukses: true, pesan: "Berhasil menarik " + amount + ". Saldo sekarang: " + newBalance };
    } catch (e) {
        log.error("[libcooperative] Error withdraw: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat penarikan." };
    }
}

function buyItem(uuid, playerName, itemName) {
    if (!itemName) return { sukses: false, pesan: "Nama item tidak boleh kosong." };

    try {
        loadAll();
        var rawMenu = DiskApi.getVar(FILENAME_MENU, "items", null, false);
        var menu = rawMenu ? JSON.parse(rawMenu) : {};
        var key = itemName.toLowerCase();

        if (!menu[key]) return { sukses: false, pesan: "Item '" + itemName + "' tidak tersedia di kantin." };

        var item = menu[key];
        var current = getBalance(uuid);

        if (current < item.price) {
            return { sukses: false, pesan: "Saldo tidak mencukupi. Harga: " + item.price + ", Saldo: " + current };
        }

        var newBalance = current - item.price;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var rawLogs = DiskApi.getVar(FILENAME_LOG, "transactions", null, false);
        var logs = rawLogs ? JSON.parse(rawLogs) : [];
        logs.push({
            type: "BUY",
            player: playerName,
            uuid: uuid,
            item: item.name,
            amount: item.price,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", JSON.stringify(logs), false);
        saveAll();

        log.info("[libcooperative] " + playerName + " beli " + item.name + " (" + item.price + "). Saldo: " + newBalance);
        return { sukses: true, pesan: "Berhasil membeli " + item.name + " seharga " + item.price + ". Saldo: " + newBalance };
    } catch (e) {
        log.error("[libcooperative] Error buyItem: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat pembelian." };
    }
}

function addItemMenu(name, description, price) {
    if (!name || !price) return { sukses: false, pesan: "Nama dan harga item tidak boleh kosong." };

    try {
        loadAll();
        var rawMenu = DiskApi.getVar(FILENAME_MENU, "items", null, false);
        var menu = rawMenu ? JSON.parse(rawMenu) : {};

        if (menu[name.toLowerCase()]) {
            return { sukses: false, pesan: "Item '" + name + "' sudah ada di menu." };
        }

        menu[name.toLowerCase()] = {
            name: name,
            description: description || "",
            price: parseInt(price)
        };

        DiskApi.setVar(FILENAME_MENU, "items", JSON.stringify(menu), false);
        saveAll();
        log.info("[libcooperative] Item '" + name + "' ditambahkan ke menu.");
        return { sukses: true, pesan: "Item '" + name + "' berhasil ditambahkan ke menu kantin." };
    } catch (e) {
        log.error("[libcooperative] Error addItemMenu: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menambahkan item." };
    }
}

function removeItemMenu(name) {
    if (!name) return { sukses: false, pesan: "Nama item tidak boleh kosong." };

    try {
        loadAll();
        var rawMenu = DiskApi.getVar(FILENAME_MENU, "items", null, false);
        var menu = rawMenu ? JSON.parse(rawMenu) : {};
        var key = name.toLowerCase();

        if (!menu[key]) return { sukses: false, pesan: "Item '" + name + "' tidak ditemukan di menu." };

        delete menu[key];
        DiskApi.setVar(FILENAME_MENU, "items", JSON.stringify(menu), false);
        saveAll();
        return { sukses: true, pesan: "Item '" + name + "' berhasil dihapus dari menu." };
    } catch (e) {
        log.error("[libcooperative] Error removeItemMenu: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus item." };
    }
}

function getMenu() {
    loadAll();
    var rawMenu = DiskApi.getVar(FILENAME_MENU, "items", null, false);
    return rawMenu ? JSON.parse(rawMenu) : {};
}

function getTransactionLog(count) {
    loadAll();
    var rawLogs = DiskApi.getVar(FILENAME_LOG, "transactions", null, false);
    var logs = rawLogs ? JSON.parse(rawLogs) : [];
    var limit = count || 10;
    var start = Math.max(0, logs.length - limit);
    var result = [];
    for (var i = logs.length - 1; i >= start; i--) {
        result.push(logs[i]);
    }
    return result;
}

return {
    getBalance: getBalance,
    setBalance: setBalance,
    deposit: deposit,
    withdraw: withdraw,
    buyItem: buyItem,
    addItemMenu: addItemMenu,
    removeItemMenu: removeItemMenu,
    getMenu: getMenu,
    getTransactionLog: getTransactionLog
};
