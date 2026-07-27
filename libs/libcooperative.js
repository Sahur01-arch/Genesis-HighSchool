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

function formatTanggal() {
    var now = new Date();
    var d = now.getDate();
    var m = now.getMonth() + 1;
    var y = now.getFullYear();
    var h = now.getHours();
    var mi = now.getMinutes();
    var s = now.getSeconds();
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d + " " + (h < 10 ? "0" : "") + h + ":" + (mi < 10 ? "0" : "") + mi + ":" + (s < 10 ? "0" : "") + s;
}

function getBalance(uuid) {
    loadAll();
    return DiskApi.getVar(FILENAME_BALANCE, uuid, 0, false);
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
        var current = DiskApi.getVar(FILENAME_BALANCE, uuid, 0, false);
        var newBalance = current + amount;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var logs = DiskApi.getVar(FILENAME_LOG, "transactions", [], false);
        logs.push({
            type: "DEPOSIT",
            player: playerName,
            uuid: uuid,
            amount: amount,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", logs, false);
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
        var current = DiskApi.getVar(FILENAME_BALANCE, uuid, 0, false);

        if (current < amount) {
            return { sukses: false, pesan: "Saldo tidak mencukupi. Saldo kamu: " + current };
        }

        var newBalance = current - amount;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var logs = DiskApi.getVar(FILENAME_LOG, "transactions", [], false);
        logs.push({
            type: "WITHDRAW",
            player: playerName,
            uuid: uuid,
            amount: amount,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", logs, false);
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
        var menu = DiskApi.getVar(FILENAME_MENU, "items", {}, false);
        var key = itemName.toLowerCase();

        if (!menu[key]) return { sukses: false, pesan: "Item '" + itemName + "' tidak tersedia di kantin." };

        var item = menu[key];
        var current = DiskApi.getVar(FILENAME_BALANCE, uuid, 0, false);

        if (current < item.price) {
            return { sukses: false, pesan: "Saldo tidak mencukupi. Harga: " + item.price + ", Saldo: " + current };
        }

        var newBalance = current - item.price;
        DiskApi.setVar(FILENAME_BALANCE, uuid, newBalance, false);

        var logs = DiskApi.getVar(FILENAME_LOG, "transactions", [], false);
        logs.push({
            type: "BUY",
            player: playerName,
            uuid: uuid,
            item: item.name,
            amount: item.price,
            balanceAfter: newBalance,
            date: formatTanggal()
        });
        DiskApi.setVar(FILENAME_LOG, "transactions", logs, false);
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
        var menu = DiskApi.getVar(FILENAME_MENU, "items", {}, false);

        if (menu[name.toLowerCase()]) {
            return { sukses: false, pesan: "Item '" + name + "' sudah ada di menu." };
        }

        menu[name.toLowerCase()] = {
            name: name,
            description: description || "",
            price: parseInt(price)
        };

        DiskApi.setVar(FILENAME_MENU, "items", menu, false);
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
        var menu = DiskApi.getVar(FILENAME_MENU, "items", {}, false);
        var key = name.toLowerCase();

        if (!menu[key]) return { sukses: false, pesan: "Item '" + name + "' tidak ditemukan di menu." };

        delete menu[key];
        DiskApi.setVar(FILENAME_MENU, "items", menu, false);
        saveAll();
        return { sukses: true, pesan: "Item '" + name + "' berhasil dihapus dari menu." };
    } catch (e) {
        log.error("[libcooperative] Error removeItemMenu: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus item." };
    }
}

function getMenu() {
    loadAll();
    return DiskApi.getVar(FILENAME_MENU, "items", {}, false);
}

function getTransactionLog(count) {
    loadAll();
    var logs = DiskApi.getVar(FILENAME_LOG, "transactions", [], false);
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
