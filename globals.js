

global.Tools =  require("js-helpertools");
global.Config = require("./config");

global.Sim = require("pokemon-showdown");
global.Teams = Sim.Teams;
global.TeamValidator = Sim.TeamValidator;
global.Dex = Sim.Dex;

global.database = require("./database");

global.jwt = require("jsonwebtoken");
global.jwtKey = Config.jwtKey;

global.DB = require("./db");

global.parseBattle = require("./battle-parser").parseBattle;
global.SingleBattle = require("./battles").SingleBattle;

global.Users = {};
global.Guests = require("./guests").Guests;

global.signup = require("./login").signup;
global.login = require("./login").login;
global.verifyUser = require("./login").verifyUser;
global.getUser = require("./login").getUser;
global.initUser = require("./login").initUser;

global.hasGuest = require("./login").hasGuest;
global.addGuest = require("./login").addGuest;



DB.data["test"] = "hello sfsf sdfs\n efwef".split(" ");
DB.exportDatabase("test");



 


