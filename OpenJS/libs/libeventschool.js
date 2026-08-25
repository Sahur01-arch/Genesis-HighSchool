//!loadmanually
const FILENAME = "event_data";

function loadData() {
    DiskApi.loadFile(FILENAME, false, false);
}

function saveData() {
    DiskApi.saveFile(FILENAME, false, false);
}

function safeParse(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    var str = String(raw);
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        log.error("[libeventschool] JSON parse error, resetting data: " + e);
        return fallback;
    }
}

function createEvent(name, date) {
    if (!name || !date) {
        log.error("[libeventschool] Gagal buat event: Nama atau tanggal tidak valid.");
        return { sukses: false, pesan: "Data event tidak lengkap." };
    }

    try {
        loadData();
        var events = safeParse(DiskApi.getVar(FILENAME, "events", null, false), []);
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
    return safeParse(DiskApi.getVar(FILENAME, "events", null, false), []);
}

return {
    createEvent: createEvent,
    getEvents: getEvents
};
