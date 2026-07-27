//!loadmanually

var FILENAME = "organisasi_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function createOrganisation(name, description) {
    if (!name) {
        return { sukses: false, pesan: "Nama organisasi tidak boleh kosong." };
    }

    try {
        loadData();
        var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);

        if (orgs[name.toLowerCase()]) {
            return { sukses: false, pesan: "Organisasi '" + name + "' sudah ada." };
        }

        orgs[name.toLowerCase()] = {
            name: name,
            description: description || "",
            members: {},
            created: Date.now()
        };

        DiskApi.setVar(FILENAME, "organisations", orgs, false);
        saveData();
        log.info("[liborganisasi] Organisasi '" + name + "' berhasil dibuat.");
        return { sukses: true, pesan: "Organisasi '" + name + "' berhasil dibuat." };
    } catch (e) {
        log.error("[liborganisasi] Error createOrganisation: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat membuat organisasi." };
    }
}

function deleteOrganisation(name) {
    if (!name) return { sukses: false, pesan: "Nama organisasi tidak boleh kosong." };

    try {
        loadData();
        var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
        var key = name.toLowerCase();

        if (!orgs[key]) {
            return { sukses: false, pesan: "Organisasi '" + name + "' tidak ditemukan." };
        }

        delete orgs[key];
        DiskApi.setVar(FILENAME, "organisations", orgs, false);
        saveData();
        log.info("[liborganisasi] Organisasi '" + name + "' berhasil dihapus.");
        return { sukses: true, pesan: "Organisasi '" + name + "' berhasil dihapus." };
    } catch (e) {
        log.error("[liborganisasi] Error deleteOrganisation: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus organisasi." };
    }
}

function addMember(orgName, playerName, uuid, role) {
    if (!orgName || !playerName || !uuid) {
        return { sukses: false, pesan: "Data tidak lengkap." };
    }

    var validRoles = ["Ketua", "Wakil", "Sekretaris", "Bendahara", "Anggota"];
    if (role && validRoles.indexOf(role) === -1) {
        return { sukses: false, pesan: "Jabatan tidak valid. Pilihan: " + validRoles.join(", ") };
    }

    try {
        loadData();
        var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
        var key = orgName.toLowerCase();

        if (!orgs[key]) {
            return { sukses: false, pesan: "Organisasi '" + orgName + "' tidak ditemukan." };
        }

        if (orgs[key].members[uuid]) {
            return { sukses: false, pesan: playerName + " sudah menjadi anggota " + orgName + "." };
        }

        orgs[key].members[uuid] = {
            name: playerName,
            role: role || "Anggota",
            joined: Date.now()
        };

        DiskApi.setVar(FILENAME, "organisations", orgs, false);
        saveData();
        log.info("[liborganisasi] " + playerName + " ditambahkan ke " + orgName + " sebagai " + (role || "Anggota"));
        return { sukses: true, pesan: playerName + " berhasil ditambahkan ke " + orgName + " sebagai " + (role || "Anggota") + "." };
    } catch (e) {
        log.error("[liborganisasi] Error addMember: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menambahkan anggota." };
    }
}

function removeMember(orgName, playerName, uuid) {
    if (!orgName || !uuid) return { sukses: false, pesan: "Data tidak lengkap." };

    try {
        loadData();
        var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
        var key = orgName.toLowerCase();

        if (!orgs[key]) return { sukses: false, pesan: "Organisasi '" + orgName + "' tidak ditemukan." };
        if (!orgs[key].members[uuid]) return { sukses: false, pesan: (playerName || "Player") + " bukan anggota " + orgName + "." };

        delete orgs[key].members[uuid];
        DiskApi.setVar(FILENAME, "organisations", orgs, false);
        saveData();
        log.info("[liborganisasi] " + (playerName || "Player") + " dihapus dari " + orgName);
        return { sukses: true, pesan: (playerName || "Player") + " berhasil dihapus dari " + orgName + "." };
    } catch (e) {
        log.error("[liborganisasi] Error removeMember: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat menghapus anggota." };
    }
}

function setRole(orgName, playerName, uuid, newRole) {
    if (!orgName || !uuid || !newRole) return { sukses: false, pesan: "Data tidak lengkap." };

    var validRoles = ["Ketua", "Wakil", "Sekretaris", "Bendahara", "Anggota"];
    if (validRoles.indexOf(newRole) === -1) {
        return { sukses: false, pesan: "Jabatan tidak valid. Pilihan: " + validRoles.join(", ") };
    }

    try {
        loadData();
        var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
        var key = orgName.toLowerCase();

        if (!orgs[key]) return { sukses: false, pesan: "Organisasi '" + orgName + "' tidak ditemukan." };
        if (!orgs[key].members[uuid]) return { sukses: false, pesan: playerName + " bukan anggota " + orgName + "." };

        orgs[key].members[uuid].role = newRole;
        DiskApi.setVar(FILENAME, "organisations", orgs, false);
        saveData();
        return { sukses: true, pesan: "Jabatan " + playerName + " di " + orgName + " diubah menjadi " + newRole + "." };
    } catch (e) {
        log.error("[liborganisasi] Error setRole: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan saat mengubah jabatan." };
    }
}

function getOrganisation(orgName) {
    if (!orgName) return null;
    loadData();
    var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
    return orgs[orgName.toLowerCase()] || null;
}

function listOrganisations() {
    loadData();
    var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
    var result = [];
    for (var key in orgs) {
        var memberCount = 0;
        for (var m in orgs[key].members) memberCount++;
        result.push({ name: orgs[key].name, description: orgs[key].description, members: memberCount });
    }
    return result;
}

function getMemberInfo(orgName, uuid) {
    var org = getOrganisation(orgName);
    if (!org || !org.members[uuid]) return null;
    return org.members[uuid];
}

function getOrganisationsForMember(uuid) {
    loadData();
    var orgs = DiskApi.getVar(FILENAME, "organisations", {}, false);
    var result = [];
    for (var key in orgs) {
        if (orgs[key].members[uuid]) {
            result.push({ name: orgs[key].name, role: orgs[key].members[uuid].role });
        }
    }
    return result;
}

return {
    createOrganisation: createOrganisation,
    deleteOrganisation: deleteOrganisation,
    addMember: addMember,
    removeMember: removeMember,
    setRole: setRole,
    getOrganisation: getOrganisation,
    listOrganisations: listOrganisations,
    getMemberInfo: getMemberInfo,
    getOrganisationsForMember: getOrganisationsForMember
};
