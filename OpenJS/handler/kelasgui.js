//!loadmanually
const Bukkit = importClass("org.bukkit.Bukkit");
const Material = importClass("org.bukkit.Material");
const ItemStack = importClass("org.bukkit.inventory.ItemStack");
const ArrayList = importClass("java.util.ArrayList");
const Sound = importClass("org.bukkit.Sound");

var Kelas = requireScript("../libs/libkelas.js");

var GUI_TITLE = "&8PILIH JURUSAN";
var GUI_SIZE = 27;

var KELAS_LIST = [
  {
    nama: "&c&lREDSTONE",
    material: "REDSTONE_BLOCK",
    slot: 11,
    groupLP: "jurusan_redstone",
    lore: ["&7Fokus: &fRedstone Dan Mesin", "&7Wali Kelas: &eKeyls", "&a▶ Klik Untuk Masuk"];
  },
  {
    nama: "&e&lBUILDER",
    material: "STONE_BRICKS",
    slot: 13,
    groupLP: "jurusan_build",
    lore: ["&7Fokus: &fArsitek dan Building", "&7Wali Kelas: &eDaenishDDE", "&a▶ Klik Untuk Masuk"];
  },
  {
    nama: "&6&lPERTANIAN",
    material: "WHEAT",
    slot: 15,
    groupLP: "jurusan_pertanian",
    lore: ["&7Fokus: &fMenanam Tanaman Dan Mengelola Lahan", "&7Wali Kelas:&f &eBelum Ada", "▶ Klik Untuk Masuk"];
  },
];

function pindahKelas(player, kelasBaru) {
  var kelasSekarang = Kelas.ambilKelasSiswa(player.getUniqueId().toString());

  if (kelasSekarang === kelasBaru.groupLP) {
    player.sendMessage("§eKamu sudah berada di kelas ini.");
      return false;
  }

  task.main(function() {
    var console = Bukkit.getConsoleSender();
        // hapus SEMUA grup kelas lama dulu (loop, cegah double-parent)
    KELAS_LIST.forEach(function(k) {
      Bukkit.dispatchCommand(console, "lp user " + player.getName() + " parent remove " + k.groupLP);
    });
      Bukkit.dispatchCommand(console, "lp user " + player.getName() + " parent add " + kelasBaru.groupLP);
  });
  return true;
}

function openKelasGUI(player) {
  var inv = Bukkit.createInventory(null, GUI_SIZE, GUI_TITTLE);

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

    inv.setItemMeta(meta);
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

