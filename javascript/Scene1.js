class Scene1 extends Phaser.Scene {
    constructor(){
        super("bootGame"); //bootgame = identifiant pour la scene
    }
    
    create() {
        this.add.text(20, 20, "Loading game...");
    }
}

