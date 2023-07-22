
const firebase = require('firebase');


const firebaseConfig = Config.firebaseConfig;
  
  const app = firebase.initializeApp(firebaseConfig);


  let database = firebase.database()
  
  //module.exports = app;


module.exports = database;