
const bcrypt = require("bcryptjs");
const Tools = require("js-helpertools");
const saltRounds = Config.salt;


class Guest {
  constructor(name, ws,agent) {
    this.id = Tools.toId(name);
    this.name = name;
    this.socket = this.ws = ws;
    this.agent = agent ? agent : null;
    this.ip = agent ? agent.ip : null;

  }

  delete() {
    delete Guests[this.id]
  }
}



class User {
  constructor(name, password, socket, agent) {
    this.name = name;
    this.id = Tools.toId(name);
    this.userID = Tools.toId(name);
    this.socket = socket ? socket : null;
    this.socketID = null;
    this.avatar = 1;

    this.agent = agent ? agent : null;
    this.ip = agent ? agent.ip : null;

    this.password = password;

    //array of battles ids user is participant in.
    this.battles = [];
  }

  async setPassword() {
    let self = this;

    let salt = await bcrypt.genSalt(saltRounds);
    let hash = await bcrypt.hash(self.password,salt);
    return hash;

    bcrypt
      .genSalt(saltRounds)
      .then((salt) => {
        console.log("Salt: ", salt);
        return bcrypt.hash(self.password, salt);
      })
      .then((hash) => {
        self.password = hash;
        console.log("Hash: ", hash);
       // users[self.id] = self;
        return self;
      })
      .catch((err) => console.error(err.message));
  }
}

let user = new User("mayur","1233");

exports.User = User;

exports.Guest = Guest;

user.setPassword().then((hash) => {
  console.log(hash);
})



//console.log(user);

