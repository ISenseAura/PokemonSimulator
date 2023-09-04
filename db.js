const fs = require("fs");

var DB = {
  data: [],
  users: [],

  importDatabase: function(roomid) {
    let file = "{}";
    try {
      file = fs.readFileSync("./replays/" + roomid + ".txt").toString();
    } catch (e) {
      console.log(e.message);
    }
    this.data[roomid] = file.split("-|BREAK|-");
  },

  importDatabases: function() {
    let databases = fs.readdirSync("./replays");
    for (let i = 0, len = databases.length; i < len; i++) {
      let file = databases[i];
      if (!file.endsWith(".txt")) continue;
      this.importDatabase(file.substr(0, file.indexOf(".txt")));
    }
  },

  exportDatabase: function(name) {
    if (!(name in this.data)) return;
    fs.writeFileSync(
      "./replays/" + name + ".txt",
    this.data[name]
        .join("-|BREAK|-")
    );
  },


  importUsers: function() {
    if (!this.data["users"]) return console.log("No users registered");
    let users = Object.keys(this.data["users"]);
    for (let i = 0; i < users.length; i++) {
      this.add(this.data["users"][users[i]]);
    }
    console.log("Successfully imported users");
  },

  toId: function(str) {
    return str.replace(/[^A-Z0-9]/gi, "").toLowerCase();
  }
};

module.exports = DB;