//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit");
const Material = importClass("org.bukkit.Material");
const ItemStack = importClass("org.bukkit.inventory.ItemStack");
const ArrayList = importClass("java.util.ArrayList");
const Sound = importClass("org.bukkit.Sound");

var Kelas = requireScript("../libs/libkelas.js");

var GUI_TITLE = "§8Pilih Jurusan Sekolah";
var GUI_SIZE = 27;

var KELAS_LIST = [
    {
        nama: "§b§lJURUSAN BUILD",
        material: "CRAFTING_TABLE",
        slot: 11,
        groupLP: "jurusan_build",
        lore: ["§7Fokus: §fArsitektur & Building", "§7Guru: §eDaenishDDE (Builder)", "", "§a▶ Klik untuk masuk!"]
    },
    {
        nama: "§c§lJURUSAN REDSTONE",
        material: "REDSTONE",
        slot: 13,
        groupLP: "jurusan_redstone",
        lore: ["§7Fokus: §fMekanisme & Redstone", "§7Guru: §eKeyls (Redstone)", "", "§a▶ Klik untuk masuk!"]
    },
    {
        nama: "§e§lJURUSAN PERTANIAN",
        material: "HAY_BLOCK",
        slot: 15,
        groupLP: "jurusan_pertanian",
        lore: ["§7Fokus: §fFarming & Perkebunan", "§7Guru: §cBelum ada", "", "§a▶ Klik untuk masuk!"]
    }
];

function pindahKelas(player, kelasBaru) {
    // 🎯 FIX: Validasi Super Ketat via Native Bukkit Permission
    // LuckPerms otomatis memberikan permission "group.<nama>" ke setiap anggotanya.
    var sudahPunyaJurusan = false;

    for (var i = 0; i < KELAS_LIST.length; i++) {
        if (player.hasPermission("group." + KELAS_LIST[i].groupLP)) {
            sudahPunyaJurusan = true;
            break;
        }
    }

    // Jika pemain sudah punya salah satu jurusan dari KELAS_LIST, batalkan
    if (sudahPunyaJurusan) {
        player.sendMessage("§c---------------------------------");
        player.sendMessage("§c[!] Kamu sudah terdaftar di jurusan!");
        player.sendMessage("§7Pemain tidak bisa pindah jurusan sendiri.");
        player.sendMessage("§eSilakan hubungi Admin / Guru untuk memindahkan.");
        player.sendMessage("§c---------------------------------");
        try {
            player.playSound(player.getLocation(), Sound.ENTITY_VILLAGER_NO, 1.0, 1.0);
        } catch(e) {}
        return false;
    }

    // Jika belum punya jurusan, tambahkan grup jurusan baru
    task.main(function() {
        var console = Bukkit.getConsoleSender();
        Bukkit.dispatchCommand(console, "lp user " + player.getName() + " parent add " + kelasBaru.groupLP);
        
        // Opsional: Jika fungsi setKelasSiswa ada di libkelas, panggil di sini agar tersimpan ke Disk
        // Kelas.setKelasSiswa(player.getUniqueId().toString(), kelasBaru.groupLP);
    });

    return true;
}

function openKelasGUI(player) {
    var inv = Bukkit.createInventory(null, GUI_SIZE, GUI_TITLE);

    var glassMat = Material.getMaterial("GRAY_STAINED_GLASS_PANE");
    if (glassMat) {
        var glass = new ItemStack(glassMat, 1);
        var gMeta = glass.getItemMeta();
        gMeta.setDisplayName(" ");
        glass.setItemMeta(gMeta);
        for (var s = 0; s < GUI_SIZE; s++) inv.setItem(s, glass);
    }

    KELAS_LIST.forEach(function(kData) {
        var mat = Material.getMaterial(kData.material) || Material.BOOK;
        var item = new ItemStack(mat, 1);
        var meta = item.getItemMeta();
        meta.setDisplayName(kData.nama);

        var loreList = new ArrayList();
        kData.lore.forEach(function(baris) { loreList.add(baris); });
        meta.setLore(loreList);
        item.setItemMeta(meta);

        inv.setItem(kData.slot, item);
    });

    player.openInventory(inv);
    try {
        player.playSound(player.getLocation(), Sound.BLOCK_CHEST_OPEN, 1.0, 1.0);
    } catch (e) {}
}

registerEvent("org.bukkit.event.inventory.InventoryClickEvent", function(event) {
    var view = event.getView();
    if (!view || view.getTitle() !== GUI_TITLE) return;

    event.setCancelled(true);

    var player = event.getWhoClicked();
    var clickedSlot = event.getRawSlot();
    if (clickedSlot < 0 || clickedSlot >= GUI_SIZE) return;

    var kelasDipilih = KELAS_LIST.filter(function(k) { return k.slot === clickedSlot; })[0];
    if (!kelasDipilih) return;

    player.closeInventory();

    var sukses = pindahKelas(player, kelasDipilih);
    if (sukses) {
        player.sendMessage("§a§m                                §r");
        player.sendMessage("§e[Sistem Sekolah] §fSelamat! Kamu resmi masuk ke " + kelasDipilih.nama);
        player.sendMessage("§a§m                                §r");
        try { player.playSound(player.getLocation(), Sound.UI_TOAST_CHALLENGE_COMPLETE, 1.0, 1.0); } catch(e) {}
    }
});

var kelasCommandHandler = {
    onCommand: function(sender, args) {
        if (!(sender instanceof org.bukkit.entity.Player)) {
            sender.sendMessage("§cPerintah GUI kelas hanya bisa dibuka oleh pemain!");
            return;
        }
        openKelasGUI(sender);
    }
};

addCommand("kelasgui", kelasCommandHandler, "server.kelas.use");
addCommand("kelas", kelasCommandHandler, "server.kelas.use");

