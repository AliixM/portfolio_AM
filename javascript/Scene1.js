class Scene1 extends Phaser.Scene {
    constructor(){
        super("bootGame"); //bootgame = identifiant pour la scene
    }
    
    preload(){
        this.load.image("background", "assets/images/background.png");
    }

    create() {
        this.add.text(20, 20, "Loading game...");
        this.scene.start("playGame");
    }
}

