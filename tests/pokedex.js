var PokeDex = require('pokemon-showdown').Dex;
var expect = require('chai').expect

describe("PokeDex IDs Test", function () {
   it ("should return a pokemon 'wynaut' with ID 360", function() {
     expect(Dex.species.get(360).exists).to.be(true);
   })
})
