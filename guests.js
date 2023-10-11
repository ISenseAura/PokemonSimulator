const bcrypt = require("bcryptjs");
const Tools = require("js-helpertools");
//const saltRounds = Config.salt;

class Guest {
  constructor(name, ws, agent) {
    this.id = Tools.toId(name);
    this.name = name;
    this.socket = this.ws = ws;
    this.agent = agent ? agent : null;
    this.ip = agent ? agent.ip : null;
  }

  delete() {
    delete Guests[this.id];
  }
}

class Guests {
  constructor() {
    this.guests = {};
    this.totalGuests = DB.guests ? Object.keys(DB.guests).length : Object.keys(this.guests).length;
  }

  new(ws, agent) {
    let len = (this.totalGuests + 1) / 1000000;
    console.log(len);
    let name = "Guest";

    this.totalGuests += 1;
    name += len;
    name = name.replace(".","")
    this.guests[Tools.toId(name)] = new Guest(name, ws, agent);
    DB.guests[Tools.toId(name)] = { ip: agent.ip };
    DB.exportDatabase("guests");
    return Tools.toId(name);
  }
}

let g = new Guests();

exports.Guests = g;
