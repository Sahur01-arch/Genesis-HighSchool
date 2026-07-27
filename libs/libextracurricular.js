//!loadmanually

var FILENAME = "ekskul_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function createExtracurricular(name, description, schedule) {
    if (!name) {
        return { sukses: false, pesan: "Nama ekstrakurikuler tidak boleh kosong." };
    }

    try {
        loadData();
        var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);

        if (ekskuls[name.toLowerCase()]) {
            return { sukses: false, pesan: "Ekstrakurikuler '" + name + "' sudah ada." };
        }

        ekskuls[name.toLowerCase()] = {
            name: name,
            description: description || "",
            schedule: schedule || "-",
            members: [],
            created: Date.now()
        };

        DiskApi.setVar(FILENAME, "extracurriculars", ekskuls, false);
        saveData();
        log.info("[libextracurricular] Ekskul '" + name + "' berhasil dibuat.");
        return { sukses: true, pesan: "Ekstrakurikuler '" + name + "' berhasil dibuat." };
    } catch (e) {
        log.error("[libextracurricular] Error createExtracurricular: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat membuat ekstrakurikuler." };
    }
}

function deleteExtracurricular(name) {
    if (!name) return { sukses: false, pesan: "Nama ekstrakurikuler tidak boleh kosong." };

    try {
        loadData();
        var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
        var key = name.toLowerCase();

        if (!ekskuls[key]) return { sukses: false, pesan: "Ekstrakurikuler '" + name + "' tidak ditemukan." };

        delete ekskuls[key];
        DiskApi.setVar(FILENAME, "extracurriculars", ekskuls, false);
        saveData();
        log.info("[libextracurricular] Ekskul '" + name + "' berhasil dihapus.");
        return { sukses: true, pesan: "Ekstrakurikuler '" + name + "' berhasil dihapus." };
    } catch (e) {
        log.error("[libextracurricular] Error deleteExtracurricular: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus ekstrakurikuler." };
    }
}

function registerStudent(exskulName, playerName, uuid) {
    if (!exskulName || !playerName || !uuid) {
        return { sukses: false, pesan: "Data tidak lengkap." };
    }

    try {
        loadData();
        var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
        var key = exskulName.toLowerCase();

        if (!ekskuls[key]) return { sukses: false, pesan: "Ekstrakurikuler '" + exskulName + "' tidak ditemukan." };

        for (var i = 0; i < ekskuls[key].members.length; i++) {
            if (ekskuls[key].members[i].uuid === uuid) {
                return { sukses: false, pesan: playerName + " sudah terdaftar di " + exskulName + "." };
            }
        }

        ekskuls[key].members.push({
            name: playerName,
            uuid: uuid,
            joined: Date.now()
        });

        DiskApi.setVar(FILENAME, "extracurriculars", ekskuls, false);
        saveData();
        log.info("[libextracurricular] " + playerName + " mendaftar di " + exskulName);
        return { sukses: true, pesan: playerName + " berhasil mendaftar di " + exskulName + "." };
    } catch (e) {
        log.error("[libextracurricular] Error registerStudent: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat mendaftar." };
    }
}

function unregisterStudent(exskulName, playerName, uuid) {
    if (!exskulName || !uuid) return { sukses: false, pesan: "Data tidak lengkap." };

    try {
        loadData();
        var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
        var key = exskulName.toLowerCase();

        if (!ekskuls[key]) return { sukses: false, pesan: "Ekstrakurikuler '" + exskulName + "' tidak ditemukan." };

        var found = false;
        for (var i = ekskuls[key].members.length - 1; i >= 0; i--) {
            if (ekskuls[key].members[i].uuid === uuid) {
                ekskuls[key].members.splice(i, 1);
                found = true;
                break;
            }
        }

        if (!found) return { sukses: false, pesan: (playerName || "Player") + " bukan anggota " + exskulName + "." };

        DiskApi.setVar(FILENAME, "extracurriculars", ekskuls, false);
        saveData();
        log.info("[libextracurricular] " + (playerName || "Player") + " keluar dari " + exskulName);
        return { sukses: true, pesan: (playerName || "Player") + " berhasil keluar dari " + exskulName + "." };
    } catch (e) {
        log.error("[libextracurricular] Error unregisterStudent: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus pendaftaran." };
    }
}

function getExtracurricular(name) {
    if (!name) return null;
    loadData();
    var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
    return ekskuls[name.toLowerCase()] || null;
}

function listExtracurriculars() {
    loadData();
    var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
    var result = [];
    for (var key in ekskuls) {
        result.push({
            name: ekskuls[key].name,
            description: ekskuls[key].description,
            schedule: ekskuls[key].schedule,
            members: ekskuls[key].members.length
        });
    }
    return result;
}

function getExtracurricularsForMember(uuid) {
    loadData();
    var ekskuls = DiskApi.getVar(FILENAME, "extracurriculars", {}, false);
    var result = [];
    for (var key in ekskuls) {
        for (var i = 0; i < ekskuls[key].members.length; i++) {
            if (ekskuls[key].members[i].uuid === uuid) {
                result.push({ name: ekskuls[key].name, schedule: ekskuls[key].schedule });
                break;
            }
        }
    }
    return result;
}

return {
    createExtracurricular: createExtracurricular,
    deleteExtracurricular: deleteExtracurricular,
    registerStudent: registerStudent,
    unregisterStudent: unregisterStudent,
    getExtracurricular: getExtracurricular,
    listExtracurriculars: listExtracurriculars,
    getExtracurricularsForMember: getExtracurricularsForMember
};
