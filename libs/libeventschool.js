//!loadmanually
const FILENAME = "event_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function createEvent(name, date) {
    if (!name || !date) {
        log.error("[libeventschool] Gagal buat event: Nama atau tanggal tidak valid.");
        return { sukses: false, pesan: "Data event tidak lengkap." };
    }

    try {
        loadData();
        var raw = DiskApi.getVar(FILENAME, "events", null, false);
        var events = raw ? JSON.parse(raw) : [];
        events.push({ name: name, date: date });
        DiskApi.setVar(FILENAME, "events", JSON.stringify(events), false);
        saveData();
        log.info("[libeventschool] Event '" + name + "' berhasil dibuat.");
        return { sukses: true, pesan: "Event '" + name + "' berhasil dijadwalkan pada " + date + "." };
    } catch (e) {
        log.error("[libeventschool] Error saat buat event: " + e);
        return { sukses: false, pesan: "Terjadi kesalahan internal saat membuat event." };
    }
}

function getEvents() {
    loadData();
    var raw = DiskApi.getVar(FILENAME, "events", null, false);
    return raw ? JSON.parse(raw) : [];
}

return {
    createEvent: createEvent,
    getEvents: getEvents
};
