//loadmanually!

const DriverManager = importClass("java.sql.DriverManager");
var DB_HOST = "localhost";
var DB_PORT = "3306";
var DB_NAME = "minecraft_server";
var DB_USER = "root";
var DB_PASS = "you_pass";

var DB_URL = "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME + "?autoReconnect=true&useSSL=false";

function getConnection() {
  try {
    return DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
  } catch (e) {
    log.error("[libmysql] Gagal terhubung ke database MySQL: " + e);
    return null;
  }
}

function initTables() {
  task.thread(function() {
    var conn = getConnection();
    if (conn !== null) {
      try {
        var stmt = conn.createStatement();
        var sqlAbsen = "CREATE TABLE IF NOT EXISTS ekskul_absensi (" +
                       "id INT AUTO_INCREMENT PRIMARY KEY, " + 
                       "uuid VARCHAR(36) NOT NULL, " +
                       "date DATE NOT NULL, " +
                       "status VARCHAR(50) NOT NULL, " +
                       "timestamp BIGINT NOT NULL" +
                       ")";
        stmt.execute(sqlAbsen);
        stmt.close();
        conn.close();
        log.info("[libmysql] Tabel Absensi Berhasil Di init");
      } catch (e) {
        log.error("[libmysql] Gagal membuat tabel: " + e);
      }
    }
  });
}

return {
  getConnection: getConnection,
  initTables: initTables
};

