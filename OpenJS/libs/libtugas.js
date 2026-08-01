//!loadmanually

const Bukkit = importClass("org.bukkit.Bukkit");
const Material = importClass("org.bukkit.Material");
const ItemStack = importClass("org.bukkit.inventory.ItemStack"); // PERBAIKAN: huruf 'i' kecil pada package path
const ByteArrayOutputStream = importClass("java.io.ByteArrayOutputStream");
const ByteArrayInputStream = importClass("java.io.ByteArrayInputStream");
const BukkitObjectOutputStream = importClass("org.bukkit.util.io.BukkitObjectOutputStream");
const BukkitObjectInputStream = importClass("org.bukkit.util.io.BukkitObjectInputStream");
const Base64 = importClass("java.util.Base64");

var chestSizePerKelas = 54;

function serializeItem(itemArray) {
  var outStream = new ByteArrayOutputStream();
  var dataOutput = new BukkitObjectOutputStream(outStream);

  dataOutput.writeInt(itemArray.length);
  for (var i = 0; i < itemArray.length; i++) {
    dataOutput.writeObject(itemArray[i]);
  }
  dataOutput.close();

  return Base64.getEncoder().encodeToString(outStream.toByteArray());
}

function deserializeItems(base64String) {
  if (!base64String) return [];

  var bytes = Base64.getDecoder().decode(base64String);
  var inStream = new ByteArrayInputStream(bytes);
  var dataInput = new BukkitObjectInputStream(inStream);

  var size = dataInput.readInt();
  var items = [];
  for (var i = 0; i < size; i++) {
    items.push(dataInput.readObject());
  }
  dataInput.close();

  return items;
}

function getChestInventory(namaKelas) {
  var fileName = "tugas_data";
  DiskApi.loadFile(fileName, false, false);

  var savedData = DiskApi.getVar(fileName, namaKelas, null, false);
  var inv = Bukkit.createInventory(null, chestSizePerKelas, "§6Kumpulan Tugas-" + namaKelas);
  
  if (savedData !== null) {
    var items = deserializeItems(savedData);
    for (var i = 0; i < items.length; i++) {
      if (items[i] !== null) {
        inv.setItem(i, items[i]);
      }
    }
  }

  return inv;
}

function simpanChestInventory(namaKelas, inv) {
  task.spawn(function() {
    var fileName = "tugas_data";
    DiskApi.loadFile(fileName, true, false); // Async load

    var contents = inv.getContents();
    var serialized = serializeItem(contents);

    DiskApi.setVar(fileName, namaKelas, serialized, false);
    DiskApi.saveFile(fileName, true, false); // Async save
  });
}

function submitTugas(player, namaKelas) {
  try {
    var itemDiTangan = player.getInventory().getItemInMainHand();
  
    if (itemDiTangan === null || itemDiTangan.getType() === Material.AIR){
      return { sukses: false, pesan: "Kamu tidak memegang buku apapun." };
    }

    var tipe = itemDiTangan.getType();
    if (tipe !== Material.WRITTEN_BOOK && tipe !== Material.WRITABLE_BOOK) {
      return { sukses: false, pesan: "Item di tangan bukan Book and Quill / Written Book" };
    }

    if (tipe === Material.WRITABLE_BOOK) {
      return { sukses: false, pesan: "Buku belum ditandatangani (sign). Tanda tangani dulu sebelum submit" };
    }

    var inv = getChestInventory(namaKelas);
    var slotKosong = inv.firstEmpty();

    if (slotKosong === -1) {
      return { sukses: false, pesan: "Chest Tugas " + namaKelas + " Penuh. Hubungi Guru"};
    }

    var bookMeta = itemDiTangan.getItemMeta();
    var judulTugas = bookMeta.hasTitle() ? bookMeta.getTitle() : "(tanpa judul)";

    var loreBaru = new java.util.ArrayList();
    loreBaru.add("§7Dikumpulkan oleh: §f" + player.getName());
    loreBaru.add("§7Waktu: §f" + new Date().toLocaleString());
    bookMeta.setLore(loreBaru);
    itemDiTangan.setItemMeta(bookMeta);

    var itemUntukDisimpan = itemDiTangan.clone();
    itemUntukDisimpan.setAmount(1);

    inv.setItem(slotKosong, itemUntukDisimpan);
    simpanChestInventory(namaKelas, inv);
  
    var jumlahSekarang = itemDiTangan.getAmount();
    if (jumlahSekarang <= 1) {
      player.getInventory().setItemInMainHand(new ItemStack(Material.AIR));
    } else {
      itemDiTangan.setAmount(jumlahSekarang - 1);
      player.getInventory().setItemInMainHand(itemDiTangan);
    }

    return { sukses: true, pesan: "Tugas " + judulTugas + " berhasil dikumpulkan ke kelas " + namaKelas + "." };
  } catch (e) {
    log.error("Gagal submit tugas: " + e);
    return { sukses: false, pesan: "Terjadi kesalahan sistem saat mengumpulkan tugas." };
  }
}

function bukaChestUntukGuru(guru, namaKelas) {
  var inv = getChestInventory(namaKelas);
  guru.openInventory(inv);
  return inv;
}

return {
  getChestInventory: getChestInventory,
  simpanChestInventory: simpanChestInventory,
  submitTugas: submitTugas,
  bukaChestUntukGuru: bukaChestUntukGuru
};

